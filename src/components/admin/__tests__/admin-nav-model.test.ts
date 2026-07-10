import { describe, expect, it } from "vitest";
import { buildAdminNavModel } from "@/components/admin-shell-nav";

function findModuleKeys(model: ReturnType<typeof buildAdminNavModel>): string[] {
  return model.groups.flatMap((entry) => entry.modules.map((module) => module.key));
}

describe("buildAdminNavModel", () => {
  it("includes the governance group with all super-admin-only modules for SUPER_ADMIN", () => {
    const model = buildAdminNavModel("SUPER_ADMIN");
    const governanceGroup = model.groups.find((entry) => entry.group.key === "governance");

    expect(governanceGroup).toBeDefined();
    const governanceKeys = governanceGroup!.modules.map((module) => module.key);
    expect(governanceKeys).toEqual(
      expect.arrayContaining([
        "staff",
        "security",
        "audit-log",
        "impersonation",
        "skills-mapping",
        "feature-flags",
        "organizations",
      ]),
    );
  });

  it("excludes superAdminOnly modules and the governance group for a staff role", () => {
    const model = buildAdminNavModel("SUPPORT_AGENT");
    const moduleKeys = findModuleKeys(model);

    expect(model.groups.some((entry) => entry.group.key === "governance")).toBe(false);
    expect(moduleKeys).not.toEqual(
      expect.arrayContaining(["staff", "security", "audit-log", "impersonation", "skills-mapping", "feature-flags", "organizations"]),
    );
  });

  it("keeps the blog module's children for both roles", () => {
    const superAdminModel = buildAdminNavModel("SUPER_ADMIN");
    const staffModel = buildAdminNavModel("SUPPORT_AGENT");

    for (const model of [superAdminModel, staffModel]) {
      const blogModule = model.groups.flatMap((entry) => entry.modules).find((module) => module.key === "blog");
      expect(blogModule?.children?.map((child) => child.key)).toEqual([
        "posts",
        "categories",
        "authors",
        "analytics",
        "comments",
      ]);
    }
  });

  it("never includes a module with a null href and no children", () => {
    const model = buildAdminNavModel("SUPER_ADMIN");
    for (const entry of model.groups) {
      for (const navModule of entry.modules) {
        expect(navModule.href !== null || Boolean(navModule.children?.length)).toBe(true);
      }
    }
  });
});
