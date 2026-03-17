"use client";

import { BookOpen } from "lucide-react";
import { AdminContentActivityModalForm } from "./admin/content/admin-content-activity-modal-form";
import { AdminContentLessonModalForm } from "./admin/content/admin-content-lesson-modal-form";
import { AdminContentLessonsSection } from "./admin/content/admin-content-lessons-section";
import { AdminContentTrackLevelSections } from "./admin/content/admin-content-track-level-sections";
import { AdminContentUnitsSection } from "./admin/content/admin-content-units-section";
import { useAdminContentBrowser } from "./admin/content/use-admin-content-browser";
import { useAdminContentEditing } from "./admin/content/use-admin-content-editing";

export function AdminContentPanel() {
  const browserVm = useAdminContentBrowser();
  const editingVm = useAdminContentEditing({
    selectedUnitId: browserVm.selectedUnitId,
    lessons: browserVm.lessons,
    fetchJson: browserVm.fetchJson,
    loadLessons: browserVm.loadLessons,
    loadActivitiesForLesson: browserVm.loadActivitiesForLesson,
    setLessons: browserVm.setLessons,
    setActivitiesByLessonId: browserVm.setActivitiesByLessonId,
    setError: browserVm.setError,
    setInfo: browserVm.setInfo,
  });

  return (
    <div className="space-y-4">

      <AdminContentTrackLevelSections
        tracks={browserVm.tracks}
        levels={browserVm.levels}
        loadingTracks={browserVm.loadingTracks}
        loadingLevels={browserVm.loadingLevels}
        selectedTrack={browserVm.selectedTrack}
        selectedTrackId={browserVm.selectedTrackId}
        selectedLevelId={browserVm.selectedLevelId}
        onSelectTrack={browserVm.selectTrack}
        onSelectLevel={browserVm.selectLevel}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
        <AdminContentUnitsSection
          units={browserVm.units}
          loadingUnits={browserVm.loadingUnits}
          selectedTrack={browserVm.selectedTrack}
          selectedLevel={browserVm.selectedLevel}
          selectedUnitId={browserVm.selectedUnitId}
          onSelectUnit={browserVm.selectUnit}
        />
        <AdminContentLessonsSection
          lessons={browserVm.lessons}
          activitiesByLessonId={browserVm.activitiesByLessonId}
          loadingLessons={browserVm.loadingLessons}
          loadingActivitiesLessonId={browserVm.loadingActivitiesLessonId}
          selectedTrack={browserVm.selectedTrack}
          selectedLevel={browserVm.selectedLevel}
          selectedUnit={browserVm.selectedUnit}
          expandedLessonId={browserVm.expandedLessonId}
          onToggleLessonExpanded={browserVm.toggleLessonExpanded}
          onOpenCreateLessonModal={editingVm.openCreateLessonModal}
          onOpenEditLessonModal={editingVm.openEditLessonModal}
          onToggleTrial={editingVm.handleToggleTrial}
          onDeleteLesson={editingVm.handleDeleteLesson}
          onOpenCreateActivityModal={editingVm.openCreateActivityModal}
          onOpenEditActivityModal={editingVm.openEditActivityModal}
          onDeleteActivity={editingVm.handleDeleteActivity}
        />
      </div>

      {browserVm.error ? <p className="text-sm text-rose-600">{browserVm.error}</p> : null}
      {browserVm.info ? <p className="text-sm text-slate-500">{browserVm.info}</p> : null}

      <AdminContentLessonModalForm
        open={editingVm.lessonModalOpen}
        title={editingVm.lessonModalTitle}
        mode={editingVm.lessonModalMode}
        editingLessonId={editingVm.editingLessonId}
        editingLesson={editingVm.editingLesson}
        editingLessonBunny={editingVm.editingLessonBunny}
        form={editingVm.lessonForm}
        submitting={editingVm.lessonSubmitting}
        onClose={editingVm.closeLessonModal}
        onSubmit={editingVm.submitLessonForm}
        onFormChange={(updater) => editingVm.setLessonForm(updater)}
        onEditingLessonBunnyChange={(updater) => editingVm.setEditingLessonBunny(updater)}
        onCreateBunnyVideo={editingVm.handleCreateBunnyVideo}
      />

      <AdminContentActivityModalForm
        open={editingVm.activityModalOpen}
        title={editingVm.activityModalTitle}
        mode={editingVm.activityModalMode}
        form={editingVm.activityForm}
        submitting={editingVm.activitySubmitting}
        onClose={editingVm.closeActivityModal}
        onSubmit={editingVm.submitActivityForm}
        onFormChange={(updater) => editingVm.setActivityForm(updater)}
      />
    </div>
  );
}
