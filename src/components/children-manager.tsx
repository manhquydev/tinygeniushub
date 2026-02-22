"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { PlayCircle, Pencil, Trash2, PlusCircle, Check, X } from "lucide-react";

type AgeBand = "2-3" | "3-4" | "4-5" | "5-6";
type ChildSummary = {
  id: string;
  nickname: string;
  ageBand: string;
};

interface ChildrenManagerProps {
  initialChildren: ChildSummary[];
  childLimit: number;
}

const ageBandOptions: AgeBand[] = ["2-3", "3-4", "4-5", "5-6"];

export function ChildrenManager({ initialChildren, childLimit }: ChildrenManagerProps) {
  const [children, setChildren] = useState(initialChildren);
  const [nickname, setNickname] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("3-4");
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState("");
  const [editAgeBand, setEditAgeBand] = useState<AgeBand>("3-4");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reachedLimit = useMemo(() => children.length >= childLimit, [children.length, childLimit]);

  function beginEdit(child: ChildSummary) {
    const safeAgeBand = ageBandOptions.includes(child.ageBand as AgeBand) ? (child.ageBand as AgeBand) : "3-4";
    setEditingChildId(child.id);
    setEditNickname(child.nickname);
    setEditAgeBand(safeAgeBand);
    setError(null);
    setInfo(null);
  }

  function cancelEdit() {
    setEditingChildId(null);
    setEditNickname("");
    setEditAgeBand("3-4");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/children", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname, ageBand }),
      });

      const body = await response.json();
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể tạo hồ sơ bé");
        return;
      }

      const created = body.data.child as ChildSummary;
      setChildren((current) => [...current, created]);
      setNickname("");
      setAgeBand("3-4");
      setInfo("Đã tạo hồ sơ bé thành công.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingChildId) {
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`/api/children/${editingChildId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname: editNickname, ageBand: editAgeBand }),
      });

      const body = await response.json();
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể cập nhật hồ sơ bé");
        return;
      }

      const updated = body.data.child as ChildSummary;
      setChildren((current) => current.map((child) => (child.id === updated.id ? updated : child)));
      cancelEdit();
      setInfo("Đã cập nhật hồ sơ bé.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(childId: string) {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: "DELETE",
      });

      const body = await response.json();
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể xóa hồ sơ bé");
        return;
      }

      setChildren((current) => current.filter((child) => child.id !== childId));
      if (editingChildId === childId) {
        cancelEdit();
      }
      setInfo("Đã xóa hồ sơ bé.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Hồ sơ bé ({children.length}/{childLimit})</h2>
      <p className="muted-text">Gói hiện tại giới hạn {childLimit} hồ sơ. Family+ cho phép tối đa 5 hồ sơ.</p>

      <ul className="list-grid">
        {children.map((child) => {
          const isEditing = editingChildId === child.id;

          return (
            <li key={child.id} className="list-item stack-item">
              {isEditing ? (
                <form className="inline-form" onSubmit={handleUpdate}>
                  <input
                    value={editNickname}
                    onChange={(event) => setEditNickname(event.target.value)}
                    required
                    disabled={loading}
                    placeholder="Tên gọi ở nhà"
                  />
                  <select
                    value={editAgeBand}
                    onChange={(event) => setEditAgeBand(event.target.value as AgeBand)}
                    disabled={loading}
                  >
                    {ageBandOptions.map((option) => (
                      <option value={option} key={option}>
                        {option} tuổi
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="solid-button" disabled={loading} style={{ minWidth: "44px", padding: 0 }} title="Lưu">
                    {loading ? "..." : <Check size={18} />}
                  </button>
                  <button type="button" className="ghost-button" onClick={cancelEdit} disabled={loading} style={{ minWidth: "44px", padding: 0 }} title="Hủy">
                    <X size={18} />
                  </button>
                </form>
              ) : (
                <div className="section-header">
                  <div>
                    <strong>{child.nickname}</strong>
                    <p className="muted-text">Độ tuổi: {child.ageBand}</p>
                  </div>
                  <div className="hero-actions" style={{ gap: "0.5rem" }}>
                    <Link href={`/kid/today?childId=${encodeURIComponent(child.id)}`} className="ghost-button" style={{ minWidth: "44px", padding: 0 }} title="Vào mission">
                      <PlayCircle size={18} />
                    </Link>
                    <button className="ghost-button" onClick={() => beginEdit(child)} disabled={loading} style={{ minWidth: "44px", padding: 0 }} title="Sửa">
                      <Pencil size={18} />
                    </button>
                    <button className="danger-button" onClick={() => handleDelete(child.id)} disabled={loading} style={{ minWidth: "44px", padding: 0 }} title="Xóa">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <form className="inline-form" onSubmit={handleCreate}>
        <input
          placeholder="Tên gọi ở nhà"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          required
          disabled={reachedLimit || loading}
        />

        <select
          value={ageBand}
          onChange={(event) => setAgeBand(event.target.value as AgeBand)}
          disabled={reachedLimit || loading}
        >
          {ageBandOptions.map((option) => (
            <option value={option} key={option}>
              {option} tuổi
            </option>
          ))}
        </select>

        <button type="submit" className="solid-button" disabled={reachedLimit || loading}>
          {reachedLimit ? "Đã chạm giới hạn" : <><PlusCircle size={18} style={{ marginRight: '0.5rem' }} /> Thêm hồ sơ</>}
        </button>
      </form>

      {error ? <p className="error-text">{error}</p> : null}
      {info ? <p className="muted-text">{info}</p> : null}
    </section>
  );
}
