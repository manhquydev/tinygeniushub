"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActivityRow, ApiResponse, LevelRow, LessonRow, TrackRow, UnitRow } from "./admin-content-types";

export function useAdminContentBrowser() {
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [activitiesByLessonId, setActivitiesByLessonId] = useState<Record<string, ActivityRow[]>>({});
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loadingActivitiesLessonId, setLoadingActivitiesLessonId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const selectedTrack = useMemo(() => tracks.find((t) => t.id === selectedTrackId) ?? null, [selectedTrackId, tracks]);
  const selectedLevel = useMemo(() => levels.find((l) => l.id === selectedLevelId) ?? null, [levels, selectedLevelId]);
  const selectedUnit = useMemo(() => units.find((u) => u.id === selectedUnitId) ?? null, [selectedUnitId, units]);

  const fetchJson = useCallback(async <TData,>(url: string, init?: RequestInit) => {
    const response = await fetch(url, init);
    const body = (await response.json()) as ApiResponse<TData>;
    if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Unable to download data.");
    return body.data;
  }, []);

  const loadTracks = useCallback(async () => {
    setLoadingTracks(true); setError(null);
    try { const data = await fetchJson<{ tracks: TrackRow[] }>("/api/admin/content/tracks", { method: "GET", cache: "no-store" }); setTracks(data.tracks); }
    catch (e) { setError(e instanceof Error ? e.message : "Unknown error."); }
    finally { setLoadingTracks(false); }
  }, [fetchJson]);

  async function loadLevels(trackId: string) {
    setLoadingLevels(true); setError(null);
    try { const data = await fetchJson<{ levels: LevelRow[] }>(`/api/admin/content/levels?${new URLSearchParams({ trackId }).toString()}`, { method: "GET", cache: "no-store" }); setLevels(data.levels); }
    catch (e) { setError(e instanceof Error ? e.message : "Unknown error."); setLevels([]); }
    finally { setLoadingLevels(false); }
  }
  async function loadUnits(levelId: string) {
    setLoadingUnits(true); setError(null);
    try { const data = await fetchJson<{ units: UnitRow[] }>(`/api/admin/content/units?${new URLSearchParams({ levelId }).toString()}`, { method: "GET", cache: "no-store" }); setUnits(data.units); }
    catch (e) { setError(e instanceof Error ? e.message : "Unknown error."); setUnits([]); }
    finally { setLoadingUnits(false); }
  }
  async function loadLessons(unitId: string) {
    setLoadingLessons(true); setError(null);
    try { const data = await fetchJson<{ lessons: LessonRow[] }>(`/api/admin/content/lessons?${new URLSearchParams({ unitId }).toString()}`, { method: "GET", cache: "no-store" }); setLessons(data.lessons); }
    catch (e) { setError(e instanceof Error ? e.message : "Unknown error."); setLessons([]); }
    finally { setLoadingLessons(false); }
  }
  async function loadActivitiesForLesson(lessonId: string) {
    setLoadingActivitiesLessonId(lessonId); setError(null);
    try { const data = await fetchJson<{ activities: ActivityRow[] }>(`/api/admin/content/activities?${new URLSearchParams({ lessonId }).toString()}`, { method: "GET", cache: "no-store" }); setActivitiesByLessonId((current) => ({ ...current, [lessonId]: data.activities })); }
    catch (e) { setError(e instanceof Error ? e.message : "Unknown error."); }
    finally { setLoadingActivitiesLessonId(null); }
  }

  useEffect(() => { void loadTracks(); }, [loadTracks]);
  function selectTrack(track: TrackRow) { setSelectedTrackId(track.id); setSelectedLevelId(null); setSelectedUnitId(null); setLevels([]); setUnits([]); setLessons([]); setExpandedLessonId(null); setActivitiesByLessonId({}); void loadLevels(track.id); }
  function selectLevel(level: LevelRow) { setSelectedLevelId(level.id); setSelectedUnitId(null); setUnits([]); setLessons([]); setExpandedLessonId(null); setActivitiesByLessonId({}); void loadUnits(level.id); }
  function selectUnit(unit: UnitRow) { setSelectedUnitId(unit.id); setLessons([]); setExpandedLessonId(null); setActivitiesByLessonId({}); void loadLessons(unit.id); }
  function toggleLessonExpanded(lesson: LessonRow) { const next = expandedLessonId === lesson.id ? null : lesson.id; setExpandedLessonId(next); if (next && !activitiesByLessonId[next]) void loadActivitiesForLesson(next); }

  return {
    tracks, levels, units, lessons, activitiesByLessonId, loadingTracks, loadingLevels, loadingUnits, loadingLessons, loadingActivitiesLessonId,
    selectedTrack, selectedLevel, selectedUnit, selectedTrackId, selectedLevelId, selectedUnitId, expandedLessonId, error, info, fetchJson,
    setLessons, setActivitiesByLessonId, setError, setInfo, setExpandedLessonId,
    loadLessons, loadActivitiesForLesson, selectTrack, selectLevel, selectUnit, toggleLessonExpanded,
  };
}
