"use client";

import { ChevronRight } from "lucide-react";
import type { LevelRow, TrackRow } from "./admin-content-types";
import { toTrackLabel } from "./admin-content-utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AdminContentTrackLevelSectionsProps = {
  tracks: TrackRow[];
  levels: LevelRow[];
  loadingTracks: boolean;
  loadingLevels: boolean;
  selectedTrack: TrackRow | null;
  selectedTrackId: string | null;
  selectedLevelId: string | null;
  onSelectTrack: (track: TrackRow) => void;
  onSelectLevel: (level: LevelRow) => void;
};

export function AdminContentTrackLevelSections(props: AdminContentTrackLevelSectionsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <article className="rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--admin-text-secondary)]">Panel 1 · Tracks</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {props.tracks.map((track) => {
            const active = props.selectedTrackId === track.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => props.onSelectTrack(track)}
                className={`rounded-xl border p-3 text-left transition ${
                  active ? "border-teal-300 bg-teal-50" : "border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] hover:border-[var(--admin-card-border)]"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--admin-text-secondary)]">{track.code}</p>
                <p className="mt-1 text-sm font-bold text-[var(--admin-text-primary)]">{toTrackLabel(track.code)}</p>
                <p className="mt-2 text-xs text-[var(--admin-text-secondary)]">
                  {track._count.levels} cấp độ · {track._count.units} đơn vị · {track._count.lessons} bài
                </p>
              </button>
            );
          })}
          {props.loadingTracks ? <p className="text-sm text-[var(--admin-text-secondary)]">Đang tải tracks...</p> : null}
        </div>
      </article>

      <article className="rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--admin-text-secondary)]">Panel 2 · Levels</h2>
        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--admin-text-secondary)]">
          <span>{props.selectedTrack ? toTrackLabel(props.selectedTrack.code) : "Chưa chọn lộ trình"}</span>
          <ChevronRight size={12} className="shrink-0" />
          <span>Levels</span>
        </p>
        <div className="mt-3 rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
                <TableHead className="text-xs w-10">#</TableHead>
                <TableHead className="text-xs">Tên cấp độ</TableHead>
                <TableHead className="text-xs">Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.levels.map((level) => (
                <TableRow
                  key={level.id}
                  onClick={() => props.onSelectLevel(level)}
                  className={cn("cursor-pointer", props.selectedLevelId === level.id && "bg-teal-50/60 hover:bg-teal-50/60")}
                >
                  <TableCell className="text-xs">{level.orderNo}</TableCell>
                  <TableCell className="text-xs">{level.title}</TableCell>
                  <TableCell className="text-xs">{level._count.units}</TableCell>
                </TableRow>
              ))}
              {props.loadingLevels && (
                <TableRow><TableCell colSpan={3} className="text-xs text-[var(--admin-text-secondary)]">Đang tải levels...</TableCell></TableRow>
              )}
              {!props.loadingLevels && props.levels.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-xs text-[var(--admin-text-secondary)]">{props.selectedTrack ? "Chưa có cấp độ." : "Chọn lộ trình để xem cấp độ."}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </article>
    </div>
  );
}
