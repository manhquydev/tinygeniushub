"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActivityFormState } from "./admin-content-types";

type AdminContentActivityFieldsFillBlankProps = {
  form: ActivityFormState;
  onFormChange: (updater: (current: ActivityFormState) => ActivityFormState) => void;
};

export function AdminContentActivityFieldsFillBlank(props: AdminContentActivityFieldsFillBlankProps) {
  return (
    <div className="grid gap-2 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-3">
      <div className="grid gap-1.5">
        <Label htmlFor="fill-sentence">Câu có chỗ trống (dùng ___)</Label>
        <Input
          id="fill-sentence"
          value={props.form.fillSentence}
          onChange={(event) => props.onFormChange((current) => ({ ...current, fillSentence: event.target.value }))}
          type="text"
          placeholder="Con mèo có ___ chân"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="fill-answer">Đáp án</Label>
        <Input
          id="fill-answer"
          value={props.form.fillAnswer}
          onChange={(event) => props.onFormChange((current) => ({ ...current, fillAnswer: event.target.value }))}
          type="text"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="fill-hint">Gợi ý</Label>
        <Input
          id="fill-hint"
          value={props.form.fillHint}
          onChange={(event) => props.onFormChange((current) => ({ ...current, fillHint: event.target.value }))}
          type="text"
        />
      </div>
    </div>
  );
}
