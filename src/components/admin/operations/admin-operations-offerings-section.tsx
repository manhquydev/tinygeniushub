"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type OfferingRow = {
  id: string;
  code: string;
  kind: string;
  catalogKey: string;
  active: boolean;
};

type OfferingsResponse = {
  ok?: boolean;
  error?: { message?: string };
  data?: { offerings?: OfferingRow[]; offering?: OfferingRow };
};

export function AdminOperationsOfferingsSection() {
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function loadOfferings() {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/admin/offerings", { method: "GET", cache: "no-store" });
      const body = (await response.json()) as OfferingsResponse;
      if (!response.ok || !body.ok || !Array.isArray(body.data?.offerings)) {
        setError(body.error?.message ?? "Unable to load offerings.");
        return;
      }
      setOfferings(body.data.offerings);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOfferings();
  }, []);

  async function toggleOffering(offering: OfferingRow) {
    setUpdatingId(offering.id);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`/api/admin/offerings/${encodeURIComponent(offering.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: !offering.active }),
      });
      const body = (await response.json()) as OfferingsResponse;
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Unable to update offering.");
        return;
      }

      const next = body.data?.offering;
      setOfferings((current) =>
        current.map((row) =>
          row.id === offering.id
            ? next ?? { ...row, active: !offering.active }
            : row,
        ),
      );
      setInfo("Updated offering status.");
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unknown error.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <h3 className="text-sm font-semibold text-[var(--admin-text-primary)]">Offerings</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadOfferings()}
          disabled={loading}
          className="h-8 text-xs"
        >
          {loading ? "Loading..." : "Refresh offerings"}
        </Button>
      </div>

      <div className="rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Kind</TableHead>
              <TableHead className="text-xs">Catalog key</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Act</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-xs text-[var(--admin-text-secondary)]">
                  Loading...
                </TableCell>
              </TableRow>
            ) : null}
            {!loading
              ? offerings.map((offering) => (
                  <TableRow key={offering.id}>
                    <TableCell className="text-xs font-mono">{offering.code}</TableCell>
                    <TableCell className="text-xs">{offering.kind}</TableCell>
                    <TableCell className="text-xs font-mono">{offering.catalogKey}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs border",
                          offering.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-800 text-slate-400 border-slate-700",
                        )}
                      >
                        {offering.active ? "ON" : "TURN OFF"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs"
                        variant={offering.active ? "destructive" : "default"}
                        onClick={() => void toggleOffering(offering)}
                        disabled={updatingId === offering.id}
                      >
                        {updatingId === offering.id
                          ? "Updating..."
                          : offering.active
                            ? "Turn off"
                            : "Turn on"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              : null}
            {!loading && offerings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-[var(--admin-text-secondary)] py-6">
                  No offerings yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {info ? <p className="text-sm text-[var(--admin-text-secondary)]">{info}</p> : null}
    </div>
  );
}
