import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  FileSpreadsheet,
  Gift,
  GraduationCap,
  LayoutDashboard,
  MousePointerClick,
  Newspaper,
  ShieldCheck,
  ShieldUser,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";

export type AdminHealth = "complete" | "partial" | "gap";

export type AdminModule = {
  key: string;
  title: string;
  description: string;
  href: string | null;
  icon: LucideIcon;
  health: AdminHealth;
  superAdminOnly?: boolean;
};

export type AdminNavGroup = {
  key: string;
  title: string;
  moduleKeys: string[];
};

export const ADMIN_MODULE_CATALOG: AdminModule[] = [
  {
    key: "overview",
    title: "Overview",
    description: "Overview KPI, growth trend, health snapshot.",
    href: "/admin/overview",
    icon: LayoutDashboard,
    health: "complete",
  },
  {
    key: "analytics",
    title: "Analytics",
    description: "Learning, retention, operational insight.",
    href: "/admin/analytics",
    icon: BarChart3,
    health: "complete",
  },
  {
    key: "clarity",
    title: "User Behavior",
    description: "Microsoft Clarity heatmaps & recordings",
    href: "/admin/analytics/clarity",
    icon: MousePointerClick,
    health: "complete",
  },
  {
    key: "users",
    title: "Users",
    description: "Parental management, notes, email, subscription.",
    href: "/admin/users",
    icon: Users,
    health: "complete",
  },
  {
    key: "courses",
    title: "Courses",
    description: "Course catalog, publish state, lesson mapping.",
    href: "/admin/courses",
    icon: GraduationCap,
    health: "partial",
  },
  {
    key: "content",
    title: "Content",
    description: "Track/level/unit/lesson/activity + video upload.",
    href: "/admin/content",
    icon: BookOpen,
    health: "complete",
  },
  {
    key: "operations",
    title: "Operations",
    description: "Payments, webhooks, trial toggle, announcements, coupons.",
    href: "/admin/operations",
    icon: BriefcaseBusiness,
    health: "partial",
  },
  {
    key: "gift-codes",
    title: "Gift Codes",
    description: "Generate gift codes and track usage.",
    href: "/admin/gift-codes",
    icon: Gift,
    health: "partial",
  },
  {
    key: "blog",
    title: "Blog CMS",
    description: "Articles, author, category, newsletter, moderation.",
    href: "/admin/blog",
    icon: Newspaper,
    health: "complete",
  },
  {
    key: "organizations",
    title: "Organizations",
    description: "Teacher org, member and progress by class.",
    href: "/admin/organizations",
    icon: Building2,
    health: "partial",
    superAdminOnly: true,
  },
  {
    key: "staff",
    title: "Staff",
    description: "Admin account and operating rights.",
    href: "/admin/staff",
    icon: UserCog,
    health: "complete",
    superAdminOnly: true,
  },
  {
    key: "security",
    title: "Security",
    description: "Rate limit, edge export, feature flags.",
    href: "/admin/security",
    icon: ShieldCheck,
    health: "partial",
    superAdminOnly: true,
  },
  {
    key: "audit-log",
    title: "Audit Log",
    description: "Log of administrative operations and incident investigation.",
    href: "/admin/log",
    icon: FileSpreadsheet,
    health: "complete",
    superAdminOnly: true,
  },
  {
    key: "impersonation",
    title: "Impersonation",
    description: "API available, no dedicated operating screen yet.",
    href: null,
    icon: ShieldUser,
    health: "gap",
    superAdminOnly: true,
  },
  {
    key: "skills-mapping",
    title: "Skills Mapping",
    description: "Skills/lesson mapping API does not yet have a dedicated UI.",
    href: null,
    icon: Sparkles,
    health: "gap",
    superAdminOnly: true,
  },
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    key: "core-control",
    title: "Core Control",
    moduleKeys: ["overview", "analytics", "clarity", "users", "courses", "content"],
  },
  {
    key: "operations",
    title: "Operations",
    moduleKeys: ["operations", "gift-codes"],
  },
  {
    key: "publishing",
    title: "Publishing",
    moduleKeys: ["blog"],
  },
  {
    key: "governance",
    title: "Governance",
    moduleKeys: ["organizations", "staff", "security", "audit-log", "impersonation", "skills-mapping"],
  },
];

export function getVisibleAdminModules(role: string) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  return ADMIN_MODULE_CATALOG.filter((module) => !module.superAdminOnly || isSuperAdmin);
}

export function getAdminModuleByKey(key: string) {
  return ADMIN_MODULE_CATALOG.find((module) => module.key === key);
}
