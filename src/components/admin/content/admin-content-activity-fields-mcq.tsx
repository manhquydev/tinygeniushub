"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ActivityFormState } from "./admin-content-types";

type AdminContentActivityFieldsMcqProps = {
  form: ActivityFormState;
  onFormChange: (updater: (current: ActivityFormState) => ActivityFormState) => void;
};

export function AdminContentActivityFieldsMcq(props: AdminContentActivityFieldsMcqProps) {
  return (
    <div className="grid gap-2 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--admin-text-secondary)]">4 options</p>
      <RadioGroup
        value={props.form.mcqCorrectChoiceId}
        onValueChange={(value) => props.onFormChange((current) => ({ ...current, mcqCorrectChoiceId: value }))}
      >
        {props.form.mcqChoices.map((choice, index) => (
          <div key={choice.id} className="grid items-center gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              value={choice.text}
              onChange={(event) =>
                props.onFormChange((current) => ({
                  ...current,
                  mcqChoices: current.mcqChoices.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, text: event.target.value } : item,
                  ),
                }))
              }
              type="text"
              placeholder={`Select${index + 1}`}
              required
            />
            <div className="flex items-center gap-2">
              <RadioGroupItem value={choice.id} id={`mcq-${choice.id}`} />
              <Label htmlFor={`mcq-${choice.id}`} className="text-xs font-semibold text-[var(--admin-text-secondary)] cursor-pointer">Correct answer</Label>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
