import { describe, expect, it } from "vitest";

import {
  runCriticalImpactFallback,
  runSemanticSearchFallback,
} from "../../scripts/grapuco/grapuco-fallbacks.mjs";

function toMcpPayload(payload: unknown) {
  return { content: [{ text: JSON.stringify(payload) }] };
}

describe("grapuco-fallbacks", () => {
  it("uses search_code when semantic_search returns empty", async () => {
    const manager = {
      async callTool(_: string, toolName: string) {
        if (toolName === "semantic_search") return toMcpPayload([]);
        if (toolName === "search_code") {
          return toMcpPayload([
            { filePath: "src/app/api/auth/login/route.ts", snippet: "validate credentials" },
          ]);
        }
        return toMcpPayload([]);
      },
    };

    const result = await runSemanticSearchFallback({
      manager,
      repositoryId: "repo_1",
      query: "login",
      limit: 5,
    });

    expect(result.fallbackUsed).toBe(true);
    expect(result.usedTool).toBe("search_code");
    expect(result.results).toHaveLength(1);
  });

  it("keeps semantic_search when it has hits", async () => {
    const manager = {
      async callTool() {
        return toMcpPayload([{ filePath: "src/modules/courses/course-service.ts", score: 0.9 }]);
      },
    };

    const result = await runSemanticSearchFallback({
      manager,
      repositoryId: "repo_1",
      query: "course service",
      limit: 5,
    });

    expect(result.fallbackUsed).toBe(false);
    expect(result.usedTool).toBe("semantic_search");
    expect(result.results).toHaveLength(1);
  });

  it("adds dependency evidence when impact analysis under-reports", async () => {
    const manager = {
      async callTool(_: string, toolName: string, args: { httpPath?: string }) {
        if (toolName === "get_impact_analysis") {
          return toMcpPayload({
            targetFile: "src/app/api/auth/login/route.ts",
            totalFlows: 0,
            allAffectedFiles: [],
          });
        }
        if (toolName === "get_data_flows") {
          if (args.httpPath === "/api/auth/login") {
            return toMcpPayload([
              { id: "flow_1", entryPointId: "Function:src/app/api/auth/login/route.ts:POST" },
            ]);
          }
          return toMcpPayload([]);
        }
        return toMcpPayload([]);
      },
    };

    const result = await runCriticalImpactFallback({
      manager,
      repositoryId: "repo_1",
      filePath: "src/app/api/auth/login/route.ts",
      limit: 5,
    });

    expect(result.fallbackUsed).toBe(true);
    expect(result.derivedHttpPath).toBe("/api/auth/login");
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it("skips fallback when impact analysis already has flows", async () => {
    const manager = {
      async callTool(_: string, toolName: string) {
        if (toolName === "get_impact_analysis") {
          return toMcpPayload({
            targetFile: "src/modules/courses/course-checkout-service.ts",
            totalFlows: 2,
            allAffectedFiles: ["src/app/api/courses/[slug]/checkout/route.ts"],
          });
        }
        return toMcpPayload([]);
      },
    };

    const result = await runCriticalImpactFallback({
      manager,
      repositoryId: "repo_1",
      filePath: "src/modules/courses/course-checkout-service.ts",
      limit: 5,
    });

    expect(result.fallbackUsed).toBe(false);
    expect(result.impact?.totalFlows).toBe(2);
  });
});
