"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FormEvent } from "react";
import { AdminContentActivityFieldsFillBlank } from "./admin-content-activity-fields-fill-blank";
import { AdminContentActivityFieldsMcq } from "./admin-content-activity-fields-mcq";
import { AdminContentActivityFieldsTrueFalse } from "./admin-content-activity-fields-true-false";
import { AdminContentActivityFieldsWordMatch } from "./admin-content-activity-fields-word-match";
import { AdminContentModalShell } from "./admin-content-modal-shell";
import type { ActivityFormState, ActivityType } from "./admin-content-types";

type AdminContentActivityModalFormProps = {
  open: boolean;
  title: string;
  mode: "create" | "edit";
  form: ActivityFormState;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onFormChange: (updater: (current: ActivityFormState) => ActivityFormState) => void;
};

export function AdminContentActivityModalForm(props: AdminContentActivityModalFormProps) {
  return (
    <AdminContentModalShell title={props.title} open={props.open} onClose={props.onClose}>
      <form className="grid gap-3" onSubmit={(event) => void props.onSubmit(event)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Activity type</Label>
            <Select
              value={props.form.type}
              onValueChange={(value) => props.onFormChange((current) => ({ ...current, type: value as ActivityType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MCQ">4-choice multiple choice (MCQ)</SelectItem>
                <SelectItem value="TRUE_FALSE">True / False</SelectItem>
                <SelectItem value="WORD_MATCH">Connect words</SelectItem>
                <SelectItem value="FILL_BLANK">Fill in the blanks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="activity-pass">Reach threshold (%)</Label>
            <Input
              id="activity-pass"
              value={props.form.passCriteria}
              onChange={(event) => props.onFormChange((current) => ({ ...current, passCriteria: event.target.value }))}
              type="number"
              min={0}
              max={100}
              required
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="activity-prompt">Question/topic</Label>
          <Textarea
            id="activity-prompt"
            value={props.form.prompt}
            onChange={(event) => props.onFormChange((current) => ({ ...current, prompt: event.target.value }))}
            rows={3}
            required
          />
        </div>

        {props.form.type === "MCQ" ? <AdminContentActivityFieldsMcq form={props.form} onFormChange={props.onFormChange} /> : null}
        {props.form.type === "TRUE_FALSE" ? <AdminContentActivityFieldsTrueFalse form={props.form} onFormChange={props.onFormChange} /> : null}
        {props.form.type === "WORD_MATCH" ? <AdminContentActivityFieldsWordMatch form={props.form} onFormChange={props.onFormChange} /> : null}
        {props.form.type === "FILL_BLANK" ? <AdminContentActivityFieldsFillBlank form={props.form} onFormChange={props.onFormChange} /> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={props.onClose}>Cancel</Button>
          <Button type="submit" disabled={props.submitting} className="bg-teal-600 hover:bg-teal-700">
            {props.submitting ? "Saving..." : props.mode === "create" ? "Create questions" : "Save updates"}
          </Button>
        </div>
      </form>
    </AdminContentModalShell>
  );
}
