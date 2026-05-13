"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AnnouncementType = "INFO" | "WARNING" | "SUCCESS";

type AnnouncementRow = {
  id: string;
  message: string;
  type: AnnouncementType;
  active: boolean;
  scheduledAt: string | null;
  endsAt: string | null;
  createdAt: string;
  createdBy: string;
};

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSchedule(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `Calendar:${day}/${month}/${year} ${hours}:${minutes}`;
}

export function AdminAnnouncementPanel() {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AnnouncementType>("INFO");
  const [scheduledAt, setScheduledAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const remainingChars = useMemo(() => 200 - message.length, [message.length]);

  async function loadAnnouncements() {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/admin/announcements", {
        method: "GET",
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok || !body.ok || !Array.isArray(body.data?.announcements)) {
        setError(body.error?.message ?? "Unable to load system notifications.");
        return;
      }

      setAnnouncements(body.data.announcements as AnnouncementRow[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnnouncements();
  }, []);

  async function handleCreate() {
    if (message.trim().length === 0) {
      setError("Please enter notification content.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          type,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          endsAt: endsAt ? new Date(`${endsAt}T23:59:59.000Z`).toISOString() : null,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok || !body.data?.announcement) {
        setError(body.error?.message ?? "Unable to create system notification.");
        return;
      }

      setMessage("");
      setType("INFO");
      setScheduledAt("");
      setEndsAt("");
      setInfo("New announcement posted.");
      await loadAnnouncements();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unknown error.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAnnouncementActive(item: AnnouncementRow) {
    setUpdatingId(item.id);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`/api/admin/announcements/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          active: !item.active,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok || !body.data?.announcement) {
        setError(body.error?.message ?? "Unable to update notification status.");
        return;
      }

      setInfo(item.active ? "Notifications turned off." : "Notifications enabled.");
      await loadAnnouncements();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unknown error.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--admin-text-secondary)]">System notifications</h3>

      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="ann-message">Notification content (maximum 200 characters)</Label>
          <Input
            id="ann-message"
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, 200))}
            type="text"
            maxLength={200}
            placeholder="For example: System maintenance at 22:00 tonight."
          />
          <span className="text-xs text-[var(--admin-text-secondary)]">Remaining {remainingChars} characters</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as AnnouncementType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="WARNING">WARNING</SelectItem>
                <SelectItem value="SUCCESS">SUCCESS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ann-scheduled">Schedule (optional, leave blank = post now)</Label>
            <Input id="ann-scheduled" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ann-ends">Finish (optional)</Label>
            <Input id="ann-ends" type="date" min={toDateInputValue(new Date())} value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
          </div>
        </div>

        <Button type="button" className="w-fit bg-teal-600 hover:bg-teal-700" onClick={() => void handleCreate()} disabled={submitting}>
          {submitting ? "Posting..." : "Post an announcement"}
        </Button>
      </div>

      <div className="rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="text-xs">Content</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Make a schedule</TableHead>
              <TableHead className="text-xs">Expired</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Created by</TableHead>
              <TableHead className="text-xs">Act</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={`announcement-skeleton-${index}`}>
                <TableCell colSpan={7} className="text-xs text-[var(--admin-text-secondary)]">Loading...</TableCell>
              </TableRow>
            )) : null}
            {!loading ? announcements.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-xs max-w-xs">{item.message}</TableCell>
                <TableCell className="text-xs">{item.type}</TableCell>
                <TableCell className="text-xs">{formatSchedule(item.scheduledAt)}</TableCell>
                <TableCell className="text-xs">{item.endsAt ? new Date(item.endsAt).toLocaleDateString("vi-VN") : "Unlimited"}</TableCell>
                <TableCell className="text-xs">{item.active ? "On" : "Turning off"}</TableCell>
                <TableCell className="text-xs">{item.createdBy}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs"
                    variant={item.active ? "destructive" : "outline"}
                    onClick={() => void toggleAnnouncementActive(item)}
                    disabled={updatingId === item.id}
                  >
                    {updatingId === item.id ? "Updating..." : item.active ? "Turn off" : "Turn on"}
                  </Button>
                </TableCell>
              </TableRow>
            )) : null}
            {!loading && announcements.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-xs text-[var(--admin-text-secondary)]">There are no system notifications yet.</TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {info ? <p className="text-xs text-[var(--admin-text-secondary)]">{info}</p> : null}
    </div>
  );
}
