"use client";

import type { ActivityFormState } from "./admin-content-types";
import { useTranslations } from "next-intl";

type AdminContentActivityFieldsTrueFalseProps = {
  form: ActivityFormState;
  onFormChange: (updater: (current: ActivityFormState) => ActivityFormState) => void;
};

export function AdminContentActivityFieldsTrueFalse(props: AdminContentActivityFieldsTrueFalseProps) {
  const t = useTranslations("admin.contentActivity.trueFalse");

  return (
    <div className="grid gap-2 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--admin-text-secondary)]">{t("heading")}</p>
      <div className="inline-flex rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-1">
        <button
          type="button"
          onClick={() => props.onFormChange((current) => ({ ...current, trueFalseAnswer: true }))}
          className={`rounded-md px-3 py-1 text-sm font-semibold ${
            props.form.trueFalseAnswer ? "bg-emerald-100 text-emerald-700" : "text-[var(--admin-text-secondary)]"
          }`}
        >
          {t("correct")}
        </button>
        <button
          type="button"
          onClick={() => props.onFormChange((current) => ({ ...current, trueFalseAnswer: false }))}
          className={`rounded-md px-3 py-1 text-sm font-semibold ${
            !props.form.trueFalseAnswer ? "bg-rose-100 text-rose-700" : "text-[var(--admin-text-secondary)]"
          }`}
        >
          {t("incorrect")}
        </button>
      </div>
    </div>
  );
}
