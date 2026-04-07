import { describe, expect, it } from "vitest";

import {
  buildFlowQualityMetrics,
  classifyFlowEndpoint,
  deriveHttpPathFromEntryPointId,
} from "../../scripts/grapuco/grapuco-flow-analysis.mjs";

describe("grapuco-flow-analysis", () => {
  it("derives httpPath from Function node ids", () => {
    expect(
      deriveHttpPathFromEntryPointId("Function:src/app/api/auth/login/route.ts:POST"),
    ).toBe("/api/auth/login");
    expect(
      deriveHttpPathFromEntryPointId("Function:src/app/(main)/courses/[slug]/checkout/route.ts:POST"),
    ).toBe("/courses/:slug/checkout");
  });

  it("classifies api vs non-api flows", () => {
    const apiFlow = classifyFlowEndpoint({
      entryPointId: "Function:src/app/api/courses/[slug]/checkout/route.ts:POST",
    });
    const nonApiFlow = classifyFlowEndpoint({
      entryPointId: "Function:src/app/(main)/courses/[slug]/route.ts:GET",
    });

    expect(apiFlow.kind).toBe("api");
    expect(apiFlow.resolvedHttpPath).toBe("/api/courses/:slug/checkout");
    expect(nonApiFlow.kind).toBe("non-api");
  });

  it("builds flow quality metrics with derived httpPath fallback", () => {
    const flows = [
      { entryPointId: "Function:src/app/api/auth/login/route.ts:POST" },
      { entryPointId: "Function:src/app/(main)/courses/[slug]/route.ts:GET" },
      {
        entryPointId: "Function:src/app/api/courses/[slug]/checkout/route.ts:POST",
        httpPath: "/api/courses/:slug/checkout",
      },
      { entryPointPath: "src/app/api/auth/login/route.ts" },
    ];

    const metrics = buildFlowQualityMetrics(flows, 10);
    expect(metrics.totalFlows).toBe(4);
    expect(metrics.apiFlowCount).toBe(3);
    expect(metrics.nonApiFlowCount).toBe(1);
    expect(metrics.flowsWithHttpPath).toBe(1);
    expect(metrics.flowsWithDerivedHttpPath).toBe(3);
    expect(metrics.flowCoveragePct).toBe(40);
    expect(metrics.apiOnlyCoveragePct).toBe(30);
    expect(metrics.noisePct).toBe(25);
  });
});
