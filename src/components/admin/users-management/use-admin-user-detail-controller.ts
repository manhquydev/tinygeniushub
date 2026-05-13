"use client";

import { useEffect, useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { AdminNote, AdminUserDetail, ApiResponse } from "./admin-users-management-types";

type UseAdminUserDetailControllerInput = {
  selectedParentId: string | null;
  router: AppRouterInstance;
};

export function useAdminUserDetailController(input: UseAdminUserDetailControllerInput) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailReloadToken, setDetailReloadToken] = useState(0);
  const [impersonateLoading, setImpersonateLoading] = useState(false);
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState(false);
  const [subscriptionActionFeedback, setSubscriptionActionFeedback] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState("30");
  const [manualEmailSubject, setManualEmailSubject] = useState("");
  const [manualEmailBody, setManualEmailBody] = useState("");
  const [manualEmailLoading, setManualEmailLoading] = useState(false);
  const [manualEmailFeedback, setManualEmailFeedback] = useState<string | null>(null);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [notesReloadToken, setNotesReloadToken] = useState(0);

  useEffect(() => {
    if (!input.selectedParentId) { setDetail(null); setDetailError(null); setSubscriptionActionFeedback(null); setManualEmailFeedback(null); setManualEmailSubject(""); setManualEmailBody(""); return; }
    const selectedParentId = input.selectedParentId;
    setSubscriptionActionFeedback(null); setManualEmailFeedback(null); setManualEmailSubject(""); setManualEmailBody("");
    const controller = new AbortController();
    void (async () => {
      setDetailLoading(true); setDetailError(null);
      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(selectedParentId)}`, { method: "GET", signal: controller.signal, cache: "no-store" });
        const body = (await response.json()) as ApiResponse<{ detail?: AdminUserDetail }>;
        if (!response.ok || !body.ok || !body.data?.detail) { setDetailError(body.error?.message ?? "Unable to download detailed information."); setDetail(null); return; }
        setDetail(body.data.detail);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setDetailError(e instanceof Error ? e.message : "Unknown error."); setDetail(null);
      } finally { setDetailLoading(false); }
    })();
    return () => controller.abort();
  }, [detailReloadToken, input.selectedParentId]);

  useEffect(() => {
    if (!input.selectedParentId) { setNotes([]); setNotesError(null); setNoteDraft(""); return; }
    const selectedParentId = input.selectedParentId;
    const controller = new AbortController();
    void (async () => {
      setNotesLoading(true); setNotesError(null);
      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(selectedParentId)}/notes`, { method: "GET", signal: controller.signal, cache: "no-store" });
        const body = (await response.json()) as ApiResponse<{ notes?: AdminNote[] }>;
        if (!response.ok || !body.ok) { setNotesError(body.error?.message ?? "Unable to load internal notes."); setNotes([]); return; }
        setNotes(body.data?.notes ?? []);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setNotesError(e instanceof Error ? e.message : "Unknown error."); setNotes([]);
      } finally { setNotesLoading(false); }
    })();
    return () => controller.abort();
  }, [notesReloadToken, input.selectedParentId]);

  async function handleImpersonate(parentId: string) {
    if (!window.confirm("Start watching as this user?")) return;
    setImpersonateLoading(true); setDetailError(null);
    try {
      const response = await fetch("/api/admin/impersonate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ parentId }) });
      const body = (await response.json()) as ApiResponse<{ redirectTo?: string }>;
      if (!response.ok || !body.ok) { setDetailError(body.error?.message ?? "Unable to switch to user view."); return; }
      const redirectTo = body.data?.redirectTo ?? "/parent/dashboard";
      input.router.push(redirectTo); input.router.refresh();
    } catch (e) { setDetailError(e instanceof Error ? e.message : "Unknown error."); }
    finally { setImpersonateLoading(false); }
  }

  async function handleCreateNote() {
    if (!input.selectedParentId) return;
    const note = noteDraft.trim();
    if (note.length === 0) { setNotesError("Please enter note content."); return; }
    setNoteSubmitting(true); setNotesError(null);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(input.selectedParentId)}/notes`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ note }) });
      const body = (await response.json()) as ApiResponse<{ note?: AdminNote }>;
      if (!response.ok || !body.ok) { setNotesError(body.error?.message ?? "Cannot add notes."); return; }
      setNoteDraft(""); setNotesReloadToken((v) => v + 1);
    } catch (e) { setNotesError(e instanceof Error ? e.message : "Unknown error."); }
    finally { setNoteSubmitting(false); }
  }

  async function handleSubscriptionAction(action: "extend" | "cancel" | "activate") {
    if (!input.selectedParentId) return;
    if (!detail?.currentSubscription) { setSubscriptionActionFeedback("The user does not have a subscription package to work with."); return; }
    const parsedDays = Number.parseInt(extendDays, 10);
    const days = Number.isFinite(parsedDays) ? parsedDays : 30;
    setSubscriptionActionLoading(true); setSubscriptionActionFeedback(null);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(input.selectedParentId)}/subscription`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, days }) });
      const body = (await response.json()) as ApiResponse<{ subscription?: unknown }>;
      if (!response.ok || !body.ok) { setSubscriptionActionFeedback(body.error?.message ?? "Unable to update subscription."); return; }
      setSubscriptionActionFeedback("Subscriptions updated."); setDetailReloadToken((v) => v + 1);
    } catch (e) { setSubscriptionActionFeedback(e instanceof Error ? e.message : "Unknown error."); }
    finally { setSubscriptionActionLoading(false); }
  }

  async function handleSendManualEmail() {
    if (!input.selectedParentId) return;
    const subject = manualEmailSubject.trim();
    const bodyText = manualEmailBody.trim();
    if (!subject || !bodyText) { setManualEmailFeedback("Please enter email subject and content."); return; }
    setManualEmailLoading(true); setManualEmailFeedback(null);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(input.selectedParentId)}/email`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject, body: bodyText }) });
      const payload = (await response.json()) as ApiResponse<{ sent?: boolean; provider?: string }>;
      if (!response.ok || !payload.ok) { setManualEmailFeedback(payload.error?.message ?? "Unable to send email."); return; }
      setManualEmailFeedback(`Email sent successfully (${payload.data?.provider ?? "unknown"}).`);
      setManualEmailSubject(""); setManualEmailBody("");
    } catch (e) { setManualEmailFeedback(e instanceof Error ? e.message : "Unknown error."); }
    finally { setManualEmailLoading(false); }
  }

  return {
    detail, detailLoading, detailError, impersonateLoading, subscriptionActionLoading, subscriptionActionFeedback, extendDays, manualEmailSubject, manualEmailBody,
    manualEmailLoading, manualEmailFeedback, notes, notesLoading, notesError, noteDraft, noteSubmitting,
    setExtendDays, setManualEmailSubject, setManualEmailBody, setNoteDraft,
    handleImpersonate, handleCreateNote, handleSubscriptionAction, handleSendManualEmail,
  };
}
