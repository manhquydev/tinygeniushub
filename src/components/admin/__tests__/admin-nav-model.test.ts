import { describe, expect, it } from "vitest";
import { buildAdminNavModel, type AdminNavModel } from "@/components/admin/admin-module-catalog";

const OPERATOR_KEYS = [
  "audit-log",
  "content",
  "impersonation",
  "operations",
  "overview",
  "security",
  "users",
];

const HIDDEN_KEYS = [
  "analytics",
  "blog",
  "courses",
  "feature-flags",
  "gift-codes",
  "organizations",
  "site-settings",
  "skills-mapping",
  "staff",
];

function findModuleKeys(model: AdminNavModel): string[] {
  return model.groups.flatMap((entry) => entry.modules.map((module) => module.key));
}

describe("buildAdminNavModel", () => {
  it("uses the same operator list for SUPER_ADMIN and staff roles", () => {
    const superKeys = findModuleKeys(buildAdminNavModel("SUPER_ADMIN")).sort();
    const staffKeys = findModuleKeys(buildAdminNavModel("SUPPORT_AGENT")).sort();

    expect(superKeys).toEqual(OPERATOR_KEYS);
    expect(staffKeys).toEqual(OPERATOR_KEYS);
  });

  it("hides blog, organizations, gift-codes, courses, and staff from primary nav", () => {
    const keys = findModuleKeys(buildAdminNavModel("SUPER_ADMIN"));
    for (const key of HIDDEN_KEYS) {
      expect(keys).not.toContain(key);
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
