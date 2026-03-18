"use client";

import { useEffect, useState } from "react";
import { listAdminStaff, createAdminStaff, updateAdminStaff } from "@/modules/admin/admin-staff-service";
import { AdminRole } from "@prisma/client";
import { ShieldAlert, ShieldCheck, Plus, X, Pencil, Loader2 } from "lucide-react";

type AdminUserRow = {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export function AdminStaffPanel() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const data = await listAdminStaff();
      setUsers(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không tải được danh sách nhân sự. Kiểm tra quyền SUPER_ADMIN."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-[var(--admin-text-secondary)]">
        <Loader2 size={20} className="mr-2 animate-spin text-teal-500" />
        Đang tải danh sách nhân sự...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--admin-text-primary)]">
            Quản lý Nhân sự
          </h1>
          <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">
            Danh sách tài khoản Admin và quyền hạn trong hệ thống.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          <Plus size={16} />
          Thêm nhân sự
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)]">
            <tr className="text-xs uppercase tracking-wider text-[var(--admin-text-secondary)]">
              <th className="px-4 py-3 font-semibold">Tài khoản</th>
              <th className="px-4 py-3 font-semibold">Vai trò</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Lần cuối đăng nhập</th>
              <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-card-border)]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[var(--admin-sidebar-accent)]/50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-[var(--admin-text-primary)]">{u.displayName}</p>
                  <p className="text-xs text-[var(--admin-text-secondary)]">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3">
                  {u.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                      <ShieldCheck size={13} />
                      Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                      <ShieldAlert size={13} />
                      Vô hiệu hóa
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--admin-text-secondary)]">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleString("vi-VN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditingUser(u)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    <Pencil size={13} />
                    Chỉnh sửa
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-sm text-[var(--admin-text-secondary)]"
                >
                  Chưa có tài khoản quản trị nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen && (
        <CreateStaffModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            void loadData();
          }}
        />
      )}

      {editingUser && (
        <EditStaffModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            void loadData();
          }}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: AdminRole }) {
  const styles: Record<string, string> = {
    SUPER_ADMIN: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    SUPPORT_AGENT: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    CONTENT_EDITOR: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  };

  const labels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    SUPPORT_AGENT: "Hỗ trợ",
    CONTENT_EDITOR: "Biên tập",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${styles[role] ?? "bg-[var(--admin-sidebar-accent)] text-[var(--admin-text-secondary)]"}`}
    >
      {labels[role] ?? role}
    </span>
  );
}

function CreateStaffModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<AdminRole>("SUPPORT_AGENT");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    try {
      setIsSubmitting(true);
      await createAdminStaff({ email, password, displayName, role });
      onSuccess();
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Có lỗi xảy ra khi tạo tài khoản."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell title="Thêm nhân sự quản trị" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Tên hiển thị">
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Email đăng nhập">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Mật khẩu (tối thiểu 8 ký tự)">
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Vai trò">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="form-input"
          >
            <option value="SUPPORT_AGENT">Hỗ trợ khách hàng (SUPPORT_AGENT)</option>
            <option value="CONTENT_EDITOR">Biên tập nội dung (CONTENT_EDITOR)</option>
            <option value="SUPER_ADMIN">Quản trị viên cấp cao (SUPER_ADMIN)</option>
          </select>
        </FormField>
        {errorMsg ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {errorMsg}
          </p>
        ) : null}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Tạo tài khoản"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditStaffModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUserRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [role, setRole] = useState<AdminRole>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    try {
      setIsSubmitting(true);
      await updateAdminStaff({ id: user.id, displayName, role, isActive });
      onSuccess();
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Có lỗi xảy ra khi cập nhật."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell title="Thiết lập tài khoản" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-[var(--admin-sidebar-accent)] px-3 py-2 text-sm">
          <span className="text-[var(--admin-text-secondary)]">Đang chỉnh sửa: </span>
          <span className="font-semibold text-[var(--admin-text-primary)]">{user.email}</span>
        </div>
        <FormField label="Tên hiển thị">
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Vai trò">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="form-input"
          >
            <option value="SUPPORT_AGENT">Hỗ trợ khách hàng (SUPPORT_AGENT)</option>
            <option value="CONTENT_EDITOR">Biên tập nội dung (CONTENT_EDITOR)</option>
            <option value="SUPER_ADMIN">Quản trị viên cấp cao (SUPER_ADMIN)</option>
          </select>
        </FormField>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActiveCheckbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--admin-card-border)] text-teal-600 focus:ring-teal-600"
          />
          <label
            htmlFor="isActiveCheckbox"
            className="cursor-pointer text-sm font-medium text-[var(--admin-text-secondary)]"
          >
            Tài khoản đang hoạt động
          </label>
        </div>
        {errorMsg ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {errorMsg}
          </p>
        ) : null}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-[var(--admin-card-bg)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--admin-card-border)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--admin-text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--admin-text-muted)] hover:bg-[var(--admin-sidebar-accent)] hover:text-[var(--admin-text-secondary)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-[var(--admin-text-secondary)]">{label}</label>
      {children}
    </div>
  );
}
