import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AdminLoadingSkeletonProps = {
  variant?: "stat-row" | "table" | "card-grid";
  count?: number;
  className?: string;
};

export function AdminLoadingSkeleton({ variant = "table", count = 5, className }: AdminLoadingSkeletonProps) {
  if (variant === "stat-row") {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "card-grid") {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  // table rows
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-2.5 rounded-lg border border-slate-100">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
