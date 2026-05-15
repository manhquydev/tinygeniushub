"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActivityFormState } from "./admin-content-types";

type AdminContentActivityFieldsWordMatchProps = {
  form: ActivityFormState;
  onFormChange: (updater: (current: ActivityFormState) => ActivityFormState) => void;
};

export function AdminContentActivityFieldsWordMatch(props: AdminContentActivityFieldsWordMatchProps) {
  return (
    <div className="grid gap-2 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--admin-text-secondary)]">Word pairs</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() =>
            props.onFormChange((current) => {
              if (current.wordPairs.length >= 4) {
                return current;
              }
              const nextIndex = current.wordPairs.length + 1;
              return {
                ...current,
                wordPairs: [...current.wordPairs, { id: `p${nextIndex}`, left: "", right: "" }],
              };
            })
          }
        >
          + Add pairs
        </Button>
      </div>

      {props.form.wordPairs.map((pair, index) => (
        <div key={pair.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            value={pair.left}
            onChange={(event) =>
              props.onFormChange((current) => ({
                ...current,
                wordPairs: current.wordPairs.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, left: event.target.value } : item,
                ),
              }))
            }
            type="text"
            placeholder="From"
            required
          />
          <Input
            value={pair.right}
            onChange={(event) =>
              props.onFormChange((current) => ({
                ...current,
                wordPairs: current.wordPairs.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, right: event.target.value } : item,
                ),
              }))
            }
            type="text"
            placeholder="Meaning"
            required
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="h-9 w-9"
            onClick={() =>
              props.onFormChange((current) => {
                if (current.wordPairs.length <= 1) return current;
                return { ...current, wordPairs: current.wordPairs.filter((_, itemIndex) => itemIndex !== index) };
              })
            }
          >
            <Trash2 size={13} />
          </Button>
        </div>
      ))}
    </div>
  );
}
