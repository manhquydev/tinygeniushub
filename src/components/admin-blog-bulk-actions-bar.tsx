"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type BulkActionButtonVariant = "default" | "outline" | "destructive";

export type AdminBlogBulkAction = {
  value: string;
  label: string;
  variant?: BulkActionButtonVariant;
  requiresConfirm?: boolean;
  confirmMessage?: string;
};

type AdminBlogBulkActionsBarProps = {
  selectedIds: string[];
  actions: AdminBlogBulkAction[];
  onAction: (action: string, ids: string[]) => Promise<void>;
};

export function AdminBlogBulkActionsBar({ selectedIds, actions, onAction }: AdminBlogBulkActionsBarProps) {
  const [runningAction, setRunningAction] = useState<string | null>(null);

  if (selectedIds.length === 0) {
    return null;
  }

  async function triggerAction(action: AdminBlogBulkAction) {
    if (action.requiresConfirm) {
      const approved = window.confirm(
        action.confirmMessage ?? "Are you sure you want to do this for the selected items?",
      );
      if (!approved) {
        return;
      }
    }

    setRunningAction(action.value);
    try {
      await onAction(action.value, selectedIds);
    } finally {
      setRunningAction(null);
    }
  }

  return (
    <div className="sticky bottom-4 z-20 rounded-xl border border-teal-200 bg-teal-50 p-3 shadow-lg">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-teal-800">Selected {selectedIds.length} items</p>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.value}
              type="button"
              size="sm"
              variant={action.variant ?? "default"}
              className={action.variant ? undefined : "bg-teal-600 hover:bg-teal-700"}
              onClick={() => void triggerAction(action)}
              disabled={runningAction !== null}
            >
              {runningAction === action.value ? "Processing..." : action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
