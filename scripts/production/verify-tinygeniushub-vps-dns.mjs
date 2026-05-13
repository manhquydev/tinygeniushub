#!/usr/bin/env node

import dns from "node:dns/promises";

const EXPECTED_IP = process.env.EXPECTED_VPS_IP ?? "152.42.246.218";
const DOMAIN = process.env.PROD_DOMAIN ?? "tinygeniushubvn.tech";
const WWW_DOMAIN = process.env.PROD_WWW_DOMAIN ?? `www.${DOMAIN}`;
const NAMESERVERS = [
  "tech-domains.earth.orderbox-dns.com",
  "tech-domains.mars.orderbox-dns.com",
  "tech-domains.mercury.orderbox-dns.com",
  "tech-domains.venus.orderbox-dns.com",
  "cont603385.earth.orderbox-dns.com",
  "cont603385.mars.orderbox-dns.com",
  "cont603385.mercury.orderbox-dns.com",
  "cont603385.venus.orderbox-dns.com",
];

const checks = [];
const staleRecordFailures = [];

function record(name, ok, detail) {
  checks.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${name}: ${detail}`);
}

function hasOnlyExpectedIp(records) {
  return records.length === 1 && records[0]?.address === EXPECTED_IP;
}

function formatAddressRecords(records) {
  if (records.length === 0) {
    return "no A records";
  }

  return records.map((record) => `${record.address} ttl=${record.ttl ?? "unknown"}`).join(", ");
}

function formatSoa(soa) {
  if (!soa) {
    return "SOA unavailable";
  }

  return `SOA serial=${soa.serial} ns=${soa.nsname}`;
}

function formatLogicBoxesHost(host) {
  if (host === DOMAIN) {
    return "";
  }

  if (host === WWW_DOMAIN) {
    return "www";
  }

  return host.endsWith(`.${DOMAIN}`) ? host.slice(0, -DOMAIN.length - 1) : host;
}

function formatDeleteIpv4RecordUrl(host, address) {
  const params = new URLSearchParams({
    "auth-userid": "ORDERBOX_AUTH_USERID",
    "api-key": "ORDERBOX_API_KEY",
    "domain-name": DOMAIN,
    value: address,
  });
  const logicBoxesHost = formatLogicBoxesHost(host);

  if (logicBoxesHost) {
    params.set("host", logicBoxesHost);
  }

  return `https://test.httpapi.com/api/dns/manage/delete-ipv4-record.json?${params}`;
}

async function resolveAFrom(nsAddress, host) {
  const resolver = new dns.Resolver();
  resolver.setServers([nsAddress]);
  return (await resolver.resolve4(host, { ttl: true })).sort((a, b) => a.address.localeCompare(b.address));
}

async function resolveSoaFrom(nsAddress) {
  const resolver = new dns.Resolver();
  resolver.setServers([nsAddress]);
  return resolver.resolveSoa(DOMAIN);
}

async function checkAuthoritativeDns() {
  for (const ns of NAMESERVERS) {
    let nsAddresses = [];
    try {
      nsAddresses = await dns.resolve4(ns);
    } catch (error) {
      record(`nameserver ${ns}`, false, error.message);
      continue;
    }

    for (const nsAddress of nsAddresses.sort()) {
      let soa = null;
      try {
        soa = await resolveSoaFrom(nsAddress);
      } catch {
        // Keep A-record checks useful even when SOA lookup fails.
      }

      for (const host of [DOMAIN, WWW_DOMAIN]) {
        try {
          const records = await resolveAFrom(nsAddress, host);
          const ok = hasOnlyExpectedIp(records);
          const staleAddresses = records
            .map((item) => item.address)
            .filter((address) => address !== EXPECTED_IP);
          const detail = `${formatAddressRecords(records)}; ${formatSoa(soa)}`;
          record(`${host} @ ${ns} (${nsAddress})`, ok, detail);

          if (!ok && staleAddresses.length > 0) {
            staleRecordFailures.push({
              host,
              ns,
              nsAddress,
              staleAddresses,
              soa,
            });
          }
        } catch (error) {
          record(`${host} @ ${ns} (${nsAddress})`, false, error.message);
        }
      }
    }
  }
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, {
      redirect: "manual",
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkHttp() {
  try {
    const response = await fetchWithTimeout(`https://${DOMAIN}/`, { method: "HEAD" });
    record(
      `https://${DOMAIN}/`,
      response.status === 200 || response.status === 301 || response.status === 302,
      `${response.status} ${response.statusText} location=${response.headers.get("location") ?? ""}`,
    );
  } catch (error) {
    record(
      `https://${DOMAIN}/`,
      false,
      `${error.message}; likely stale authoritative A records if DNS checks above failed`,
    );
  }

  try {
    const response = await fetchWithTimeout(`http://${EXPECTED_IP}/`, { method: "HEAD" });
    record(`http://${EXPECTED_IP}/`, response.status === 200, `${response.status} ${response.statusText}`);
  } catch (error) {
    record(`http://${EXPECTED_IP}/`, false, error.message);
  }

  try {
    const response = await fetchWithTimeout(`http://${EXPECTED_IP}/api/health/ready`);
    const text = await response.text();
    record(
      `http://${EXPECTED_IP}/api/health/ready`,
      response.status === 200 && text.includes('"status":"ready"'),
      `${response.status} ${text.slice(0, 140)}`,
    );
  } catch (error) {
    record(`http://${EXPECTED_IP}/api/health/ready`, false, error.message);
  }

  try {
    const response = await fetchWithTimeout(`https://${WWW_DOMAIN}/`, { method: "HEAD" });
    record(`https://${WWW_DOMAIN}/`, response.status === 200, `${response.status} ${response.statusText}`);
  } catch (error) {
    record(`https://${WWW_DOMAIN}/`, false, error.message);
  }
}

await checkAuthoritativeDns();
await checkHttp();

const failed = checks.filter((check) => !check.ok);
if (failed.length > 0) {
  if (staleRecordFailures.length > 0) {
    console.error("\nDNS provider action required:");
    console.error(`- Keep only A ${EXPECTED_IP} for ${DOMAIN} and ${WWW_DOMAIN}.`);

    const stalePairs = new Set();
    for (const failure of staleRecordFailures) {
      for (const address of failure.staleAddresses) {
        stalePairs.add(`${failure.host} A ${address}`);
      }
    }

    for (const pair of [...stalePairs].sort()) {
      console.error(`- Remove stale ${pair}`);
    }

    console.error("\nOrderBox/LogicBoxes cleanup hints:");
    console.error("- Control Panel -> domain order -> DNS Service -> Manage DNS -> A Records.");
    console.error(`- Search API: https://test.httpapi.com/api/dns/manage/search-records.json?auth-userid=ORDERBOX_AUTH_USERID&api-key=ORDERBOX_API_KEY&domain-name=${DOMAIN}&type=A&no-of-records=50&page-no=1`);

    for (const pair of [...stalePairs].sort()) {
      const [host, , address] = pair.split(" ");
      console.error(`- Delete API (${pair}): POST ${formatDeleteIpv4RecordUrl(host, address)}`);
    }

    console.error("- Do not SSH into stale IPs; they are not the approved project VPS.");
  }

  console.error(`\n${failed.length} production verification check(s) failed.`);
  process.exit(1);
}

console.log("\nAll production VPS/DNS checks passed.");
