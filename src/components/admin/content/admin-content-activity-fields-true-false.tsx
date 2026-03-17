"use client";

import type { ActivityFormState } from "./admin-content-types";

type AdminContentActivityFieldsTrueFalseProps = {
  form: ActivityFormState;
  onFormChange: (updater: (current: ActivityFormState) => ActivityFormState) => void;
};

export function AdminContentActivityFieldsTrueFalse(props: AdminContentActivityFieldsTrueFalseProps) {
  return (
    <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Đáp án đúng</p>
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => props.onFormChange((current) => ({ ...current, trueFalseAnswer: true }))}
          className={`rounded-md px-3 py-1 text-sm font-semibold ${
            props.form.trueFalseAnswer ? "bg-emerald-100 text-emerald-700" : "text-slate-600"
          }`}
        >
          Đúng
        </button>
        <button
          type="button"
          onClick={() => props.onFormChange((current) => ({ ...current, trueFalseAnswer: false }))}
          className={`rounded-md px-3 py-1 text-sm font-semibold ${
            !props.form.trueFalseAnswer ? "bg-rose-100 text-rose-700" : "text-slate-600"
          }`}
        >
          Sai
        </button>
      </div>
    </div>
  );
}
