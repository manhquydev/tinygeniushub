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
];

const checks = [];

function record(name, ok, detail) {
  checks.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${name}: ${detail}`);
}

function hasOnlyExpectedIp(addresses) {
  return addresses.length === 1 && addresses[0] === EXPECTED_IP;
}

async function resolveAFrom(nsAddress, host) {
  const resolver = new dns.Resolver();
  resolver.setServers([nsAddress]);
  return (await resolver.resolve4(host)).sort();
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
      for (const host of [DOMAIN, WWW_DOMAIN]) {
        try {
          const addresses = await resolveAFrom(nsAddress, host);
          record(`${host} @ ${ns} (${nsAddress})`, hasOnlyExpectedIp(addresses), addresses.join(", "));
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
  console.error(`\n${failed.length} production verification check(s) failed.`);
  process.exit(1);
}

console.log("\nAll production VPS/DNS checks passed.");
