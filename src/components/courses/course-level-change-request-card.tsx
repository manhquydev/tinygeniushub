"use client";

import { FormEvent, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import {
  COURSE_LEVEL_CHANGE_REASON_CODES,
  COURSE_LEVEL_CHANGE_REASON_LABELS,
  type CourseLevelChangeReasonCode,
} from "@/modules/courses/course-level-change-request-constants";

type SubmitState = "idle" | "loading" | "success" | "error";

type Props = {
  courseSlug: string;
};

export function CourseLevelChangeRequestCard({ courseSlug }: Props) {
  const [reasonCode, setReasonCode] = useState<CourseLevelChangeReasonCode>("pace_mismatch");
  const [fromLevelId, setFromLevelId] = useState("");
  const [toLevelId, setToLevelId] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [feedback, setFeedback] = useState("");

  const submitDisabled = useMemo(() => {
    if (status === "loading") return true;
    if (note.trim().length < 10) return true;
    return false;
  }, [note, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitDisabled) return;

    setStatus("loading");
    setFeedback("");

    try {
      const response = await fetch("/api/courses/level-change-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          courseSlug,
          reasonCode,
          fromLevelId: fromLevelId.trim() || undefined,
          toLevelId: toLevelId.trim() || undefined,
          note: note.trim(),
        }),
      });

      const payload = (await response.json()) as
        | { ok?: true; data?: { requestId?: string; reused?: boolean } }
        | { error?: { message?: string } };

      if (!response.ok) {
        const message = "error" in payload ? payload.error?.message : undefined;
        throw new Error(message ?? "Requests cannot be submitted at this time.");
      }

      const requestId = "data" in payload ? payload.data?.requestId : undefined;
      const reused = "data" in payload ? Boolean(payload.data?.reused) : false;

      setStatus("success");
      setFeedback(
        reused
          ? "The previous request is still being processed. The team will respond soon."
          : "Request to change level/change course has been sent. The team will respond soon.",
      );
      if (!reused && requestId) {
        trackEvent("level_change_request_created", {
          request_id: requestId,
          course_slug: courseSlug,
          reason_code: reasonCode,
          reason_family: reasonCode === "other" ? "other" : "wrong_level",
          request_channel: "ui",
        });
      }
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "An error has occurred. Please try again.");
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">Request to change level/change key after purchase</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        If the current key does not match, you can submit a request for support according to policy.
      </p>

      <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
        <label className="grid gap-1.5 text-sm text-slate-700">
          Main reason
          <select
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
            value={reasonCode}
            onChange={(event) => setReasonCode(event.target.value as CourseLevelChangeReasonCode)}
          >
            {COURSE_LEVEL_CHANGE_REASON_CODES.map((code) => (
              <option key={code} value={code}>
                {COURSE_LEVEL_CHANGE_REASON_LABELS[code]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm text-slate-700">
            Current level (optional)
            <input
              type="text"
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
              value={fromLevelId}
              onChange={(event) => setFromLevelId(event.target.value)}
              placeholder="For example: Level 2"
              maxLength={80}
            />
          </label>
          <label className="grid gap-1.5 text-sm text-slate-700">
            Requested level (optional)
            <input
              type="text"
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
              value={toLevelId}
              onChange={(event) => setToLevelId(event.target.value)}
              placeholder="For example: Level 1"
              maxLength={80}
            />
          </label>
        </div>

        <label className="grid gap-1.5 text-sm text-slate-700">
          Detailed description
          <textarea
            className="min-h-[110px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Describe why you want to change level/switch course (minimum 10 characters)"
            minLength={10}
            maxLength={500}
            required
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="solid-button" disabled={submitDisabled}>
            {status === "loading" ? "Sending..." : "Send request"}
          </button>
          {feedback ? (
            <p className={status === "error" ? "text-sm text-red-600" : "text-sm text-emerald-700"}>{feedback}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
