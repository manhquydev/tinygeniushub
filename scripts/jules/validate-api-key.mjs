#!/usr/bin/env node

const apiKey = process.env.JULES_API_KEY || process.argv[2];
const baseUrl = process.env.JULES_BASE_URL || "https://jules.googleapis.com";
const sourceFilter = process.env.JULES_SOURCE || process.argv[3] || "";

if (!apiKey) {
  console.error("Missing JULES_API_KEY. Usage: JULES_API_KEY=... node scripts/jules/validate-api-key.mjs");
  process.exit(1);
}

async function request(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: {
      "x-goog-api-key": apiKey,
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`Request ${path} failed (${response.status}): ${text.slice(0, 1000)}`);
  }

  return body;
}

try {
  console.log("Jules API key validation started...");
  const sourcesResult = await request("/v1alpha/sources?pageSize=100");
  const sessionsResult = await request("/v1alpha/sessions?pageSize=5");

  const sourceNames = Array.isArray(sourcesResult.sources) ? sourcesResult.sources.map((item) => item.name) : [];
  const sessions = Array.isArray(sessionsResult.sessions) ? sessionsResult.sessions : [];
  const matchedSource = sourceFilter ? sourceNames.find((name) => name === sourceFilter) : null;

  console.log("");
  console.log("Validation summary:");
  console.log(`- Sources accessible: ${sourceNames.length}`);
  console.log(`- Sessions accessible: ${sessions.length}`);
  console.log(`- API base URL: ${baseUrl}`);
  if (sourceFilter) {
    console.log(`- Source filter: ${sourceFilter}`);
    console.log(`- Source filter matched: ${matchedSource ? "YES" : "NO"}`);
  }

  console.log("");
  console.log("Plan limit reference (Jules docs):");
  console.log("- Free: 15 tasks/day, 3 concurrent");
  console.log("- Pro: 100 tasks/day, 15 concurrent");
  console.log("- Ultra: 300 tasks/day, 60 concurrent");
  console.log("Note: Live quota usage endpoints are not exposed in public REST; enforce local budgets in orchestrator.");

  console.log("");
  console.log("Key scope check: PASS");
} catch (error) {
  console.error("Key scope check: FAIL");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

