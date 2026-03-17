import Link from "next/link";
import type { AdminModule, AdminHealth } from "./admin-module-catalog";
import { Card, CardContent } from "@/components/ui/card";
import { AdminStatusBadge } from "./ui/admin-status-badge";

const HEALTH_LABEL: Record<AdminHealth, string> = {
  complete: "Complete",
  partial: "Partial",
  gap: "Gap",
};

type AdminModuleHealthGridProps = {
  modules: AdminModule[];
};

function ModuleCard({ module }: { module: AdminModule }) {
  const Icon = module.icon;
  return (
    <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <span className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Icon size={16} />
          </span>
          <h3 className="text-sm font-semibold text-slate-800 leading-tight pt-1">{module.title}</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{module.description}</p>
        <AdminStatusBadge status={HEALTH_LABEL[module.health]} variant="health" />
      </CardContent>
    </Card>
  );
}

export function AdminModuleHealthGrid({ modules }: AdminModuleHealthGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {modules.map((module) => {
        if (!module.href) {
          return (
            <div key={module.key} className="opacity-60">
              <ModuleCard module={module} />
            </div>
          );
        }
        return (
          <Link key={module.key} href={module.href} className="block">
            <ModuleCard module={module} />
          </Link>
        );
      })}
    </div>
  );
}
