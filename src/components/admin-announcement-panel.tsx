"use client";

import { useEffect, useMemo, useState } from "react";

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
  return `Lịch: ${day}/${month}/${year} ${hours}:${minutes}`;
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
        setError(body.error?.message ?? "Không tải được thông báo hệ thống.");
        return;
      }

      setAnnouncements(body.data.announcements as AnnouncementRow[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnnouncements();
  }, []);

  async function handleCreate() {
    if (message.trim().length === 0) {
      setError("Vui lòng nhập nội dung thông báo.");
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
        setError(body.error?.message ?? "Không tạo được thông báo hệ thống.");
        return;
      }

      setMessage("");
      setType("INFO");
      setScheduledAt("");
      setEndsAt("");
      setInfo("Đã đăng thông báo mới.");
      await loadAnnouncements();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Lỗi không xác định.");
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
        setError(body.error?.message ?? "Không cập nhật được trạng thái thông báo.");
        return;
      }

      setInfo(item.active ? "Đã tắt thông báo." : "Đã bật thông báo.");
      await loadAnnouncements();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Lỗi không xác định.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="card page-stack">
      <h3>Thông báo hệ thống</h3>

      <div className="admin-controls">
        <label className="stack-field">
          Nội dung thông báo (tối đa 200 ký tự)
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, 200))}
            type="text"
            maxLength={200}
            placeholder="Ví dụ: Hệ thống bảo trì vào 22:00 tối nay."
          />
          <span className="muted-text">Còn lại {remainingChars} ký tự</span>
        </label>
      </div>

      <div className="admin-controls">
        <label>
          Loại
          <select value={type} onChange={(event) => setType(event.target.value as AnnouncementType)}>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="SUCCESS">SUCCESS</option>
          </select>
        </label>
        <label>
          Lập lịch (tùy chọn, để trống = đăng ngay)
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
        </label>
        <label>
          Kết thúc (tùy chọn)
          <input
            type="date"
            min={toDateInputValue(new Date())}
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
        </label>
        <button type="button" className="solid-button" onClick={() => void handleCreate()} disabled={submitting}>
          {submitting ? "Đang đăng..." : "Đăng thông báo"}
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nội dung</th>
              <th>Loại</th>
              <th>Lập lịch</th>
              <th>Hết hạn</th>
              <th>Trạng thái</th>
              <th>Tạo bởi</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`announcement-skeleton-${index}`}>
                    <td colSpan={7}>Đang tải...</td>
                  </tr>
                ))
              : null}
            {!loading
              ? announcements.map((item) => (
                  <tr key={item.id}>
                    <td>{item.message}</td>
                    <td>{item.type}</td>
                    <td>{formatSchedule(item.scheduledAt)}</td>
                    <td>{item.endsAt ? new Date(item.endsAt).toLocaleDateString("vi-VN") : "Không giới hạn"}</td>
                    <td>{item.active ? "Đang bật" : "Đang tắt"}</td>
                    <td>{item.createdBy}</td>
                    <td>
                      <button
                        type="button"
                        className={item.active ? "danger-button" : "ghost-button"}
                        onClick={() => void toggleAnnouncementActive(item)}
                        disabled={updatingId === item.id}
                      >
                        {updatingId === item.id ? "Đang cập nhật..." : item.active ? "Tắt" : "Bật"}
                      </button>
                    </td>
                  </tr>
                ))
              : null}
            {!loading && announcements.length === 0 ? (
              <tr>
                <td colSpan={7}>Chưa có thông báo hệ thống.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {info ? <p className="muted-text">{info}</p> : null}
    </section>
  );
}
