"use client";

import { useEffect, useState } from "react";
import { Funnel, TrendingDown, TrendingUp } from "lucide-react";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FunnelStep {
  name: string;
  count: number;
}

interface FunnelData {
  name: string;
  period: string;
  steps: FunnelStep[];
  conversionRates: Record<string, number>;
  totalConversionRate: number;
  dropOffRates: Record<string, number>;
}

// Simple progress bar component since shadcn Progress isn't available
function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("w-full bg-gray-200 rounded-full overflow-hidden", className)}>
      <div
        className="bg-teal-500 h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function FunnelChart() {
  const [funnelType, setFunnelType] = useState<"checkout" | "trial" | "referral">("checkout");
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/admin/analytics/funnels?funnel=${funnelType}&days=30`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error("Invalid response format");
        }
        
        setData(result.data);
      } catch (err) {
        console.error("Failed to fetch funnel data:", err);
        setError(err instanceof Error ? err.message : "Failed to load funnel data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [funnelType]);

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading funnel data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No funnel data available
      </div>
    );
  }

  const maxCount = data.steps[0]?.count || 1;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button 
          variant={funnelType === "checkout" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFunnelType("checkout")}
          className={funnelType === "checkout" ? "bg-teal-600 hover:bg-teal-700" : ""}
        >
          Checkout
        </Button>
        <Button 
          variant={funnelType === "trial" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFunnelType("trial")}
          className={funnelType === "trial" ? "bg-teal-600 hover:bg-teal-700" : ""}
        >
          Trial → Paid
        </Button>
        <Button 
          variant={funnelType === "referral" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFunnelType("referral")}
          className={funnelType === "referral" ? "bg-teal-600 hover:bg-teal-700" : ""}
        >
          Referral
        </Button>
      </div>

      <AdminSectionCard title={data.name} icon={<Funnel size={16} />}>
        <div className="space-y-4">
          {data.steps.map((step, index) => {
            const prevStep = index > 0 ? data.steps[index - 1] : null;
            const conversionRate = prevStep ? data.conversionRates[step.name] : 100;
            const dropOffRate = prevStep ? data.dropOffRates[step.name] : 0;
            
            return (
              <div key={step.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--admin-text-primary)]">
                      {index + 1}. {step.name}
                    </span>
                    {index > 0 && (
                      <span className={cn(
                        "text-sm flex items-center gap-1",
                        conversionRate >= 50 ? "text-green-600" : "text-red-600"
                      )}>
                        {conversionRate >= 50 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {conversionRate}%
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-[var(--admin-text-primary)]">
                    {step.count.toLocaleString()}
                  </span>
                </div>
                <Progress value={(step.count / maxCount) * 100} className="h-2" />
                {index > 0 && dropOffRate > 0 && (
                  <p className="text-xs text-[var(--admin-text-secondary)]">
                    {dropOffRate}% drop-off from previous step
                  </p>
                )}
              </div>
            );
          })}
          
          <div className="pt-4 border-t border-[var(--admin-card-border)]">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[var(--admin-text-primary)]">
                Total Conversion Rate
              </span>
              <span className={cn(
                "text-2xl font-bold",
                data.totalConversionRate >= 10 ? "text-green-600" : "text-teal-600"
              )}>
                {data.totalConversionRate}%
              </span>
            </div>
          </div>
        </div>
      </AdminSectionCard>
    </div>
  );
}
