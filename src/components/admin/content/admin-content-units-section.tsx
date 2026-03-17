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
    <article className="rounded-2xl border border-slate-200 bg-white p-3">
      <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-600">Panel 3 · Units</h2>
      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <span>{props.selectedTrack ? toTrackLabel(props.selectedTrack.code) : "Track"}</span>
        <ChevronRight size={12} className="shrink-0" />
        <span>{props.selectedLevel ? `Level ${props.selectedLevel.orderNo}` : "Level"}</span>
        <ChevronRight size={12} className="shrink-0" />
        <span>Units</span>
      </p>
      <div className="mt-3 rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs w-10">#</TableHead>
              <TableHead className="text-xs">Tên đơn vị</TableHead>
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
              <TableRow><TableCell colSpan={3} className="text-xs text-slate-500">Đang tải units...</TableCell></TableRow>
            )}
            {!props.loadingUnits && props.units.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-xs text-slate-500">{props.selectedLevel ? "Chưa có đơn vị." : "Chọn cấp độ để xem đơn vị."}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </article>
  );
}
