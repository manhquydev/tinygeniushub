import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reviewsDir = path.join(root, "plans", "2026-03-17-education-agent-team", "reviews");
const reportsDir = path.join(root, "plans", "2026-03-17-education-agent-team", "reports");
const thresholdsPath = path.join(reviewsDir, "pilot-kpi-thresholds.json");
const funnelPath = path.join(reportsDir, "pilot-funnel-report.json");
const outPath = path.join(reportsDir, "pilot-funnel-gate-evaluation.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function scoreMetric(value, thresholds) {
  if (typeof value !== "number") return "fail";
  if (value >= thresholds.passGte) return "pass";
  if (value >= thresholds.warnGte) return "warn";
  return "fail";
}

function aggregateGateStatus(statuses) {
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("warn")) return "warn";
  return "pass";
}

function mergeThresholdBlock(base, override) {
  return {
    checkoutToPurchaseRatePct: {
      passGte: override?.checkoutToPurchaseRatePct?.passGte ?? base?.checkoutToPurchaseRatePct?.passGte ?? 0,
      warnGte: override?.checkoutToPurchaseRatePct?.warnGte ?? base?.checkoutToPurchaseRatePct?.warnGte ?? 0,
    },
    minCheckouts: {
      passGte: override?.minCheckouts?.passGte ?? base?.minCheckouts?.passGte ?? 0,
      warnGte: override?.minCheckouts?.warnGte ?? base?.minCheckouts?.warnGte ?? 0,
    },
  };
}

function resolveSkuChannelThreshold(thresholds, slug, channel) {
  const channelBase = thresholds.channelOverrides?.[channel] ?? thresholds.channelOverrides?.unknown;
  const skuDefault = thresholds.perSkuChannelDefault ?? null;
  const skuWildcardOverride = thresholds.perSkuChannelOverrides?.[slug]?.all ?? null;
  const skuChannelOverride = thresholds.perSkuChannelOverrides?.[slug]?.[channel] ?? null;

  const withSkuDefault = skuDefault ? mergeThresholdBlock(channelBase, skuDefault) : channelBase;
  const withWildcardOverride = skuWildcardOverride
    ? mergeThresholdBlock(withSkuDefault, skuWildcardOverride)
    : withSkuDefault;
  const finalThreshold = skuChannelOverride
    ? mergeThresholdBlock(withWildcardOverride, skuChannelOverride)
    : withWildcardOverride;

  if (!finalThreshold?.checkoutToPurchaseRatePct || !finalThreshold?.minCheckouts) {
    return null;
  }

  return finalThreshold;
}

function evaluateGlobal(funnel, thresholds) {
  const totals = funnel.summary?.totals ?? {};
  const checkoutToPurchaseStatus = scoreMetric(
    Number(totals.checkoutToPurchaseRatePct ?? 0),
    thresholds.global.checkoutToPurchaseRatePct,
  );
  const purchaseToActiveStatus = scoreMetric(
    Number(totals.purchaseToActiveLearnerRatePct ?? 0),
    thresholds.global.purchaseToActiveLearnerRatePct,
  );
  const minCheckoutStatus = scoreMetric(
    Number(totals.checkoutStarted ?? 0),
    thresholds.global.minCheckouts,
  );

  const gateStatus = aggregateGateStatus([
    checkoutToPurchaseStatus,
    purchaseToActiveStatus,
    minCheckoutStatus,
  ]);

  return {
    gateStatus,
    metrics: {
      checkoutToPurchase: {
        value: Number(totals.checkoutToPurchaseRatePct ?? 0),
        status: checkoutToPurchaseStatus,
        threshold: thresholds.global.checkoutToPurchaseRatePct,
      },
      purchaseToActiveLearner: {
        value: Number(totals.purchaseToActiveLearnerRatePct ?? 0),
        status: purchaseToActiveStatus,
        threshold: thresholds.global.purchaseToActiveLearnerRatePct,
      },
      minCheckouts: {
        value: Number(totals.checkoutStarted ?? 0),
        status: minCheckoutStatus,
        threshold: thresholds.global.minCheckouts,
      },
    },
  };
}

function evaluateChannels(funnel, thresholds) {
  const channelRows = funnel.summary?.channelTotals ?? [];
  const evaluations = [];

  for (const row of channelRows) {
    const channel = String(row.channel);
    const override = thresholds.channelOverrides?.[channel] ?? thresholds.channelOverrides?.unknown;
    if (!override) {
      continue;
    }

    const cvrStatus = scoreMetric(
      Number(row.checkoutToPurchaseRatePct ?? 0),
      override.checkoutToPurchaseRatePct,
    );
    const volumeStatus = scoreMetric(Number(row.checkoutStarted ?? 0), override.minCheckouts);
    const gateStatus = aggregateGateStatus([cvrStatus, volumeStatus]);

    evaluations.push({
      channel,
      gateStatus,
      metrics: {
        checkoutToPurchase: {
          value: Number(row.checkoutToPurchaseRatePct ?? 0),
          status: cvrStatus,
          threshold: override.checkoutToPurchaseRatePct,
        },
        minCheckouts: {
          value: Number(row.checkoutStarted ?? 0),
          status: volumeStatus,
          threshold: override.minCheckouts,
        },
      },
    });
  }

  return evaluations;
}

function evaluateSkuChannels(funnel, thresholds) {
  const rows = Array.isArray(funnel.channelRows) ? funnel.channelRows : [];
  const evaluations = [];

  for (const row of rows) {
    const slug = String(row.slug ?? "");
    const channel = String(row.channel ?? "unknown");
    if (!slug) continue;

    const resolvedThreshold = resolveSkuChannelThreshold(thresholds, slug, channel);
    if (!resolvedThreshold) {
      continue;
    }

    const cvrStatus = scoreMetric(
      Number(row.checkoutToPurchaseRatePct ?? 0),
      resolvedThreshold.checkoutToPurchaseRatePct,
    );
    const volumeStatus = scoreMetric(Number(row.checkoutStarted ?? 0), resolvedThreshold.minCheckouts);
    const gateStatus = aggregateGateStatus([cvrStatus, volumeStatus]);

    evaluations.push({
      slug,
      channel,
      gateStatus,
      metrics: {
        checkoutToPurchase: {
          value: Number(row.checkoutToPurchaseRatePct ?? 0),
          status: cvrStatus,
          threshold: resolvedThreshold.checkoutToPurchaseRatePct,
        },
        minCheckouts: {
          value: Number(row.checkoutStarted ?? 0),
          status: volumeStatus,
          threshold: resolvedThreshold.minCheckouts,
        },
      },
    });
  }

  return evaluations;
}

function main() {
  const thresholds = readJson(thresholdsPath);
  const funnel = readJson(funnelPath);

  const globalEvaluation = evaluateGlobal(funnel, thresholds);
  const channelEvaluations = evaluateChannels(funnel, thresholds);
  const skuChannelEvaluations = evaluateSkuChannels(funnel, thresholds);
  const channelOverall = aggregateGateStatus(channelEvaluations.map((item) => item.gateStatus));
  const skuChannelOverall = aggregateGateStatus(skuChannelEvaluations.map((item) => item.gateStatus));
  const overallStatus = aggregateGateStatus([
    globalEvaluation.gateStatus,
    channelOverall,
    skuChannelOverall,
  ]);

  const output = {
    generatedAt: new Date().toISOString(),
    source: {
      thresholds: path.relative(root, thresholdsPath).replaceAll("\\", "/"),
      funnel: path.relative(root, funnelPath).replaceAll("\\", "/"),
    },
    status: overallStatus,
    globalEvaluation,
    channelEvaluations,
    skuChannelEvaluations,
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(`Pilot funnel gate status: ${overallStatus.toUpperCase()}`);
}

main();
