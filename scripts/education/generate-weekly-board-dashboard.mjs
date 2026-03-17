import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const planDir = path.join(root, "plans", "2026-03-17-education-agent-team");
const reportsDir = path.join(planDir, "reports");
const reviewsDir = path.join(planDir, "reviews");

const splitFullPath = path.join(reportsDir, "split-integrity-full.json");
const splitPilotPath = path.join(reportsDir, "split-integrity-pilot.json");
const dbIntegrityPath = path.join(reportsDir, "pilot-db-integrity.json");
const funnelPath = path.join(reportsDir, "pilot-funnel-report.json");
const funnelGatePath = path.join(reportsDir, "pilot-funnel-gate-evaluation.json");
const coursesAbCvrPath = path.join(reportsDir, "courses-ab-cvr-report.json");

const outJsonPath = path.join(reportsDir, "weekly-board-dashboard.json");
const outMdPath = path.join(reviewsDir, "weekly-board-dashboard.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return readJson(filePath);
}

function toStatusLabel(status) {
  if (status === true || status === "pass") return "PASS";
  if (status === "warn") return "WARN";
  return "FAIL";
}

function decideBoard(input) {
  const { g0Pass, funnelGateStatus, checkoutStarted, purchaseSucceeded } = input;
  if (!g0Pass) {
    return {
      decision: "BLOCKED",
      reason: "Data integrity gate (G0) failed.",
      actions: [
        "Fix integrity failures and re-run `pnpm education:pipeline`.",
        "Regenerate board dashboard after integrity passes.",
      ],
    };
  }

  if (checkoutStarted === 0 && purchaseSucceeded === 0) {
    return {
      decision: "HOLD",
      reason: "No pilot traffic yet; funnel metrics are not statistically meaningful.",
      actions: [
        "Start pilot acquisition traffic and ensure checkout events are recorded.",
        "Run weekly pack after at least 1 week of live traffic.",
      ],
    };
  }

  if (funnelGateStatus === "pass") {
    return {
      decision: "SCALE_CANDIDATE",
      reason: "Funnel gates are passing with valid integrity.",
      actions: [
        "Prepare scale experiment for best-performing SKU/channel pairs.",
        "Keep weekly monitoring and stop/go checks.",
      ],
    };
  }

  if (funnelGateStatus === "warn") {
    return {
      decision: "CONTINUE_WITH_FIXES",
      reason: "Funnel is close to target but still below pass thresholds in some metrics.",
      actions: [
        "Improve weak channels/SKUs and run targeted tests.",
        "Re-evaluate next weekly board cycle.",
      ],
    };
  }

  return {
    decision: "REWORK",
    reason: "Funnel gates failed despite available pilot traffic.",
    actions: [
      "Pause scaling plans and run root-cause analysis by SKU/channel.",
      "Revise offer/messaging and re-test before board approval.",
    ],
  };
}

function makeMarkdown(input) {
  const lines = [];
  lines.push("# Weekly Board Dashboard");
  lines.push("");
  lines.push(`Generated at: ${input.generatedAt}`);
  lines.push("");
  lines.push("## Gate Snapshot");
  lines.push(`- G0 Full split integrity: ${toStatusLabel(input.gates.g0.fullSplitPass)}`);
  lines.push(`- G0 Pilot split integrity: ${toStatusLabel(input.gates.g0.pilotSplitPass)}`);
  lines.push(`- G0 Pilot DB integrity: ${toStatusLabel(input.gates.g0.pilotDbPass)}`);
  lines.push(`- G0 Overall: ${toStatusLabel(input.gates.g0.overall)}`);
  lines.push(`- Funnel Gate: ${toStatusLabel(input.gates.funnel.status)}`);
  lines.push("");
  lines.push("## Funnel Totals (Window)");
  lines.push(`- Checkout started: ${input.funnel.totals.checkoutStarted}`);
  lines.push(`- Purchase succeeded: ${input.funnel.totals.purchaseSucceeded}`);
  lines.push(`- Enrollments: ${input.funnel.totals.enrollments}`);
  lines.push(`- Lesson completed events: ${input.funnel.totals.lessonCompleted}`);
  lines.push(`- Active learners: ${input.funnel.totals.activeLearners}`);
  lines.push(`- Checkout -> Purchase: ${input.funnel.totals.checkoutToPurchaseRatePct}%`);
  lines.push(`- Purchase -> Active learner: ${input.funnel.totals.purchaseToActiveLearnerRatePct}%`);
  lines.push("");
  lines.push("## Channel Gates");
  if (input.gates.funnel.channelEvaluations.length === 0) {
    lines.push("- No channel gate rows yet (likely no attributed pilot traffic in window).");
  } else {
    lines.push("| Channel | Status | Checkout->Purchase | Min checkouts |");
    lines.push("|---|---|---:|---:|");
    for (const row of input.gates.funnel.channelEvaluations) {
      lines.push(
        `| ${row.channel} | ${toStatusLabel(row.gateStatus)} | ${row.metrics.checkoutToPurchase.value}% | ${row.metrics.minCheckouts.value} |`,
      );
    }
  }
  lines.push("");
  lines.push("## SKU x Channel Gates");
  if (input.gates.funnel.skuChannelEvaluations.length === 0) {
    lines.push("- No SKU x channel gate rows yet.");
  } else {
    lines.push("| SKU | Channel | Status | Checkout->Purchase | Min checkouts |");
    lines.push("|---|---|---|---:|---:|");
    for (const row of input.gates.funnel.skuChannelEvaluations) {
      lines.push(
        `| ${row.slug} | ${row.channel} | ${toStatusLabel(row.gateStatus)} | ${row.metrics.checkoutToPurchase.value}% | ${row.metrics.minCheckouts.value} |`,
      );
    }
  }
  lines.push("");
  lines.push("## A/B Courses Variant");
  if (!input.abCourses || !Array.isArray(input.abCourses.variantRows) || input.abCourses.variantRows.length === 0) {
    lines.push("- No A/B variant rows yet for this window.");
  } else {
    lines.push("| Variant | Checkout started | Purchase succeeded | Checkout->Purchase |");
    lines.push("|---|---:|---:|---:|");
    for (const row of input.abCourses.variantRows) {
      lines.push(
        `| ${row.variant} | ${row.checkoutStarted} | ${row.purchaseSucceeded} | ${row.checkoutToPurchaseRatePct}% |`,
      );
    }
  }
  lines.push("");
  lines.push("## Board Decision");
  lines.push(`- Decision: **${input.decision.decision}**`);
  lines.push(`- Reason: ${input.decision.reason}`);
  lines.push("");
  lines.push("## Required Actions");
  input.decision.actions.forEach((action, index) => {
    lines.push(`${index + 1}. ${action}`);
  });
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function main() {
  const full = readJson(splitFullPath);
  const pilot = readJson(splitPilotPath);
  const db = readJson(dbIntegrityPath);
  const funnel = readJson(funnelPath);
  const funnelGate = readJson(funnelGatePath);
  const abCourses = readJsonIfExists(coursesAbCvrPath);

  const g0 = {
    fullSplitPass: Boolean(full?.summary?.allPassed),
    pilotSplitPass: Boolean(pilot?.summary?.allPassed),
    pilotDbPass: Boolean(db?.summary?.allPassed),
  };
  g0.overall = g0.fullSplitPass && g0.pilotSplitPass && g0.pilotDbPass;

  const totals = funnel?.summary?.totals ?? {
    checkoutStarted: 0,
    purchaseSucceeded: 0,
    enrollments: 0,
    lessonCompleted: 0,
    activeLearners: 0,
    checkoutToPurchaseRatePct: 0,
    purchaseToActiveLearnerRatePct: 0,
  };

  const boardDecision = decideBoard({
    g0Pass: g0.overall,
    funnelGateStatus: String(funnelGate?.status ?? "fail"),
    checkoutStarted: Number(totals.checkoutStarted ?? 0),
    purchaseSucceeded: Number(totals.purchaseSucceeded ?? 0),
  });

  const output = {
    generatedAt: new Date().toISOString(),
    windowDays: Number(funnel?.periodDays ?? 14),
    gates: {
      g0,
      funnel: {
        status: String(funnelGate?.status ?? "fail"),
        globalEvaluation: funnelGate?.globalEvaluation ?? null,
        channelEvaluations: Array.isArray(funnelGate?.channelEvaluations)
          ? funnelGate.channelEvaluations
          : [],
        skuChannelEvaluations: Array.isArray(funnelGate?.skuChannelEvaluations)
          ? funnelGate.skuChannelEvaluations
          : [],
      },
    },
    funnel: {
      totals,
      coursesFound: Number(funnel?.summary?.totalCoursesFound ?? 0),
    },
    decision: boardDecision,
    abCourses: abCourses
      ? {
          summary: abCourses.summary ?? null,
          variantRows: Array.isArray(abCourses.variantRows) ? abCourses.variantRows : [],
        }
      : null,
    sources: {
      splitFull: path.relative(root, splitFullPath).replaceAll("\\", "/"),
      splitPilot: path.relative(root, splitPilotPath).replaceAll("\\", "/"),
      dbIntegrity: path.relative(root, dbIntegrityPath).replaceAll("\\", "/"),
      funnel: path.relative(root, funnelPath).replaceAll("\\", "/"),
      funnelGate: path.relative(root, funnelGatePath).replaceAll("\\", "/"),
      coursesAbCvr: fs.existsSync(coursesAbCvrPath)
        ? path.relative(root, coursesAbCvrPath).replaceAll("\\", "/")
        : null,
    },
  };

  fs.writeFileSync(outJsonPath, JSON.stringify(output, null, 2));
  fs.writeFileSync(outMdPath, makeMarkdown(output));

  console.log(`Wrote ${outJsonPath}`);
  console.log(`Wrote ${outMdPath}`);
  console.log(`Weekly board decision: ${output.decision.decision}`);
}

main();
