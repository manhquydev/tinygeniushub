import type { LucideIcon } from "lucide-react";
import {
  BarChart2, BarChart3, BookOpen, BriefcaseBusiness, Building2,
  FileSpreadsheet, Gift, GraduationCap, LayoutDashboard, Link2,
  MessageCircle, Newspaper, PenSquare, ShieldCheck, ShieldUser,
  Sparkles, Tag, ToggleLeft, UserCog, Users,
} from "lucide-react";

export type AdminHealth = "complete" | "partial" | "gap";

export type AdminModuleChild = {
  key: string;
  title: string;
  href: string;
  icon: LucideIcon;
};

export type AdminModule = {
  key: string;
  title: string;
  description: string;
  href: string | null;
  icon: LucideIcon;
  health: AdminHealth;
  superAdminOnly?: boolean;
  operatorVisible?: boolean;
  children?: AdminModuleChild[];
};

export type AdminNavGroup = {
  key: string;
  title: string;
  moduleKeys: string[];
};

export const ADMIN_MODULE_CATALOG: AdminModule[] = [
  {
    key: "overview", title: "Overview",
    description: "Overview KPI, growth trend, health snapshot.",
    href: "/admin/overview", icon: LayoutDashboard, health: "complete",
  },
  {
    key: "analytics", title: "Analytics",
    description: "Learning, retention, operational insight.",
    href: "/admin/analytics", icon: BarChart3, health: "complete",
    operatorVisible: false,
  },
  {
    key: "users", title: "Users",
    description: "Parental management, notes, email, subscription.",
    href: "/admin/users", icon: Users, health: "complete",
  },
  {
    key: "courses", title: "Courses",
    description: "Course catalog, publish state, lesson mapping.",
    href: "/admin/courses", icon: GraduationCap, health: "partial",
    operatorVisible: false,
  },
  {
    key: "content", title: "Content",
    description: "Track/level/unit/lesson/activity + video upload.",
    href: "/admin/content", icon: BookOpen, health: "complete",
  },
  {
    key: "operations", title: "Operations",
    description: "Payments, webhooks, trial toggle, announcements, coupons.",
    href: "/admin/operations", icon: BriefcaseBusiness, health: "partial",
  },
  {
    key: "gift-codes", title: "Gift Codes",
    description: "Generate gift codes and track usage.",
    href: "/admin/gift-codes", icon: Gift, health: "partial",
    operatorVisible: false,
  },
  {
    key: "site-settings", title: "Site Settings",
    description: "Manage social links and site content settings.",
    href: "/admin/site-settings", icon: Link2, health: "complete",
    operatorVisible: false,
  },
  {
    key: "blog", title: "Blog CMS",
    description: "Articles, author, category, moderation.",
    href: "/admin/blog", icon: Newspaper, health: "complete",
    operatorVisible: false,
    children: [
      { key: "posts", title: "Posts", href: "/admin/blog/posts", icon: PenSquare },
      { key: "categories", title: "Categories", href: "/admin/blog/categories", icon: Tag },
      { key: "authors", title: "Authors", href: "/admin/blog/authors", icon: Users },
      { key: "analytics", title: "Analytics", href: "/admin/blog/analytics", icon: BarChart2 },
      { key: "comments", title: "Comments", href: "/admin/blog/comments", icon: MessageCircle },
    ],
  },
  {
    key: "organizations", title: "Organizations",
    description: "Teacher org, member and progress by class.",
    href: "/admin/organizations", icon: Building2, health: "partial",
    superAdminOnly: true, operatorVisible: false,
  },
  {
    key: "staff", title: "Staff",
    description: "Admin account and operating rights.",
    href: "/admin/staff", icon: UserCog, health: "complete",
    superAdminOnly: true, operatorVisible: false,
  },
  {
    key: "security", title: "Security",
    description: "Rate limit, edge export, feature flags.",
    href: "/admin/security", icon: ShieldCheck, health: "partial",
    superAdminOnly: true,
  },
  {
    key: "audit-log", title: "Audit Log",
    description: "Log of administrative operations and incident investigation.",
    href: "/admin/log", icon: FileSpreadsheet, health: "complete",
    superAdminOnly: true,
  },
  {
    key: "impersonation", title: "Impersonation",
    description: "Simulate a parent login session for support or debugging.",
    href: "/admin/impersonation", icon: ShieldUser, health: "complete",
    superAdminOnly: true,
  },
  {
    key: "skills-mapping", title: "Skills Mapping",
    description: "Manage learning skills classification and lesson mapping.",
    href: "/admin/skills", icon: Sparkles, health: "complete",
    superAdminOnly: true, operatorVisible: false,
  },
  {
    key: "feature-flags", title: "Feature Flags",
    description: "Toggle platform feature flags and rollout controls.",
    href: "/admin/feature-flags", icon: ToggleLeft, health: "complete",
    superAdminOnly: true, operatorVisible: false,
  },
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    key: "core-control",
    title: "Core Control",
    moduleKeys: ["overview", "analytics", "users", "courses", "content"],
  },
  {
    key: "operations",
    title: "Operations",
    moduleKeys: ["operations", "gift-codes", "site-settings"],
  },
  {
    key: "publishing",
    title: "Publishing",
    moduleKeys: ["blog"],
  },
  {
    key: "governance",
    title: "Governance",
    moduleKeys: [
      "organizations",
      "staff",
      "security",
      "audit-log",
      "impersonation",
      "skills-mapping",
      "feature-flags",
    ],
  },
];

/** Role is unused: one operator list. Staff stays in catalog (URL-only). */
export function getVisibleAdminModules(_role: string) {
  return ADMIN_MODULE_CATALOG.filter((module) => module.operatorVisible !== false);
}

export type AdminNavModel = {
  groups: { group: AdminNavGroup; modules: AdminModule[] }[];
};

export function buildAdminNavModel(role: string): AdminNavModel {
  const visibleByKey: Record<string, AdminModule> = Object.fromEntries(
    getVisibleAdminModules(role).map((module) => [module.key, module]),
  );
  const groups = ADMIN_NAV_GROUPS.map((group) => ({
    group,
    modules: group.moduleKeys
      .map((key) => visibleByKey[key])
      .filter((module): module is AdminModule =>
        Boolean(module) && (module.href !== null || Boolean(module.children?.length)),
      ),
  })).filter((entry) => entry.modules.length > 0);
  return { groups };
}

export function getAdminModuleByKey(key: string) {
  return ADMIN_MODULE_CATALOG.find((module) => module.key === key);
}
