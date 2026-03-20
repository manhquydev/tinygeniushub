import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const reportDir = join(process.cwd(), "reports", "security");
mkdirSync(reportDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const rawPath = join(reportDir, `security-baseline-${timestamp}.json`);
const rawPathAll = join(reportDir, `security-baseline-${timestamp}-all.json`);
const rawPathProd = join(reportDir, `security-baseline-${timestamp}-prod.json`);
const summaryPath = join(reportDir, "latest-summary.md");
const FAIL_ON = (process.env.SECURITY_FAIL_ON ?? "high").toLowerCase();
const FAIL_SCOPE = (process.env.SECURITY_FAIL_SCOPE ?? "prod").toLowerCase();
const severityOrder = ["info", "low", "moderate", "high", "critical"];
const failScopes = ["prod", "all"];

function runAudit(command) {
  let rawOutput = "";
  try {
    rawOutput = execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    rawOutput = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
  }

  const trimmedOutput = rawOutput.trim();
  const jsonStart = trimmedOutput.indexOf("{");
  const jsonEnd = trimmedOutput.lastIndexOf("}");

  if (jsonStart < 0 || jsonEnd < 0 || jsonEnd <= jsonStart) {
    throw new Error(`Unable to parse pnpm audit JSON output for command: ${command}`);
  }

  const jsonText = trimmedOutput.slice(jsonStart, jsonEnd + 1);
  return JSON.parse(jsonText);
}

function getVulnerabilities(report) {
  return report.metadata?.vulnerabilities ?? {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    total: 0,
  };
}

function getTotal(vulnerabilities) {
  return (
    vulnerabilities.total ??
    (vulnerabilities.info ?? 0) +
      (vulnerabilities.low ?? 0) +
      (vulnerabilities.moderate ?? 0) +
      (vulnerabilities.high ?? 0) +
      (vulnerabilities.critical ?? 0)
  );
}

if (!severityOrder.includes(FAIL_ON)) {
  throw new Error(`Invalid SECURITY_FAIL_ON='${FAIL_ON}'. Expected one of: ${severityOrder.join(", ")}`);
}

if (!failScopes.includes(FAIL_SCOPE)) {
  throw new Error(`Invalid SECURITY_FAIL_SCOPE='${FAIL_SCOPE}'. Expected one of: ${failScopes.join(", ")}`);
}

const allReport = runAudit("pnpm audit --json");
const prodReport = runAudit("pnpm audit --prod --json");

const allVulnerabilities = getVulnerabilities(allReport);
const prodVulnerabilities = getVulnerabilities(prodReport);
const selectedVulnerabilities = FAIL_SCOPE === "all" ? allVulnerabilities : prodVulnerabilities;

writeFileSync(rawPathAll, JSON.stringify(allReport, null, 2), "utf8");
writeFileSync(rawPathProd, JSON.stringify(prodReport, null, 2), "utf8");

const combinedReport = {
  generatedAt: new Date().toISOString(),
  failOn: FAIL_ON,
  failScope: FAIL_SCOPE,
  reports: {
    all: allReport,
    prod: prodReport,
  },
};
writeFileSync(rawPath, JSON.stringify(combinedReport, null, 2), "utf8");

const summary = [
  "# Security Baseline",
  "",
  `- Generated: ${new Date().toISOString()}`,
  `- Fail on severity: ${FAIL_ON}`,
  `- Fail scope: ${FAIL_SCOPE}`,
  "",
  "## Production Dependencies",
  `- Total: ${getTotal(prodVulnerabilities)}`,
  `- Critical: ${prodVulnerabilities.critical ?? 0}`,
  `- High: ${prodVulnerabilities.high ?? 0}`,
  `- Moderate: ${prodVulnerabilities.moderate ?? 0}`,
  `- Low: ${prodVulnerabilities.low ?? 0}`,
  `- Info: ${prodVulnerabilities.info ?? 0}`,
  "",
  "## All Dependencies (Including Dev)",
  `- Total: ${getTotal(allVulnerabilities)}`,
  `- Critical: ${allVulnerabilities.critical ?? 0}`,
  `- High: ${allVulnerabilities.high ?? 0}`,
  `- Moderate: ${allVulnerabilities.moderate ?? 0}`,
  `- Low: ${allVulnerabilities.low ?? 0}`,
  `- Info: ${allVulnerabilities.info ?? 0}`,
  "",
  `- Combined raw report: ${rawPath}`,
  `- All-deps raw report: ${rawPathAll}`,
  `- Prod-deps raw report: ${rawPathProd}`,
].join("\n");

writeFileSync(summaryPath, summary, "utf8");
console.log(summary);

const thresholdIndex = severityOrder.indexOf(FAIL_ON);
const shouldFail = severityOrder
  .slice(thresholdIndex)
  .some((severity) => (selectedVulnerabilities[severity] ?? 0) > 0);

if (shouldFail) {
  process.exit(1);
}
