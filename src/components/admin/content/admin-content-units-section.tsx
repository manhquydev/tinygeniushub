"use client";

import { ChevronRight } from "lucide-react";
import type { LevelRow, TrackRow, UnitRow } from "./admin-content-types";
import { toTrackLabel } from "./admin-content-utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AdminContentUnitsSectionProps = {
  units: UnitRow[];
  loadingUnits: boolean;
  selectedTrack: TrackRow | null;
  selectedLevel: LevelRow | null;
  selectedUnitId: string | null;
  onSelectUnit: (unit: UnitRow) => void;
};

export function AdminContentUnitsSection(props: AdminContentUnitsSectionProps) {
  return (
    <article className="rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-3">
      <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--admin-text-secondary)]">Panel 3 · Units</h2>
      <p className="mt-1 flex items-center gap-1 text-xs text-[var(--admin-text-secondary)]">
        <span>{props.selectedTrack ? toTrackLabel(props.selectedTrack.code) : "Track"}</span>
        <ChevronRight size={12} className="shrink-0" />
        <span>{props.selectedLevel ? `Level ${props.selectedLevel.orderNo}` : "Level"}</span>
        <ChevronRight size={12} className="shrink-0" />
        <span>Units</span>
      </p>
      <div className="mt-3 rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="text-xs w-10">#</TableHead>
              <TableHead className="text-xs">Unit name</TableHead>
              <TableHead className="text-xs">Lessons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.units.map((unit) => (
              <TableRow
                key={unit.id}
                onClick={() => props.onSelectUnit(unit)}
                className={cn("cursor-pointer", props.selectedUnitId === unit.id && "bg-teal-50/60 hover:bg-teal-50/60")}
              >
                <TableCell className="text-xs">{unit.orderNo}</TableCell>
                <TableCell className="text-xs">{unit.title}</TableCell>
                <TableCell className="text-xs">{unit._count.lessons}</TableCell>
              </TableRow>
            ))}
            {props.loadingUnits && (
              <TableRow><TableCell colSpan={3} className="text-xs text-[var(--admin-text-secondary)]">Loading units...</TableCell></TableRow>
            )}
            {!props.loadingUnits && props.units.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-xs text-[var(--admin-text-secondary)]">{props.selectedLevel ? "No units yet." : "Select level to view units."}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </article>
  );
}
