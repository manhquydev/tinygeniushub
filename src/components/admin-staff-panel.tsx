"use client";

import { useEffect, useState } from "react";
import {
  listAdminStaff,
  createAdminStaff,
  updateAdminStaff,
  type AdminRole,
  type AdminUserRow,
} from "@/modules/admin/admin-staff-service";
import { ShieldAlert, ShieldCheck, Plus, X, Pencil, Loader2 } from "lucide-react";

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
      setError(getErrorMessage(err, "Unable to download personnel list. Check SUPER_ADMIN permissions."));
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
        Loading personnel list...
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
            Human Resources Management
          </h1>
          <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">
            List of Admin accounts and rights in the system.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          <Plus size={16} />
          More personnel
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--admin-card-border)] bg-[var(--admin-sidebar-accent)]">
            <tr className="text-xs uppercase tracking-wider text-[var(--admin-text-secondary)]">
              <th className="px-4 py-3 font-semibold">Account</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Last login</th>
              <th className="px-4 py-3 text-right font-semibold">Operation</th>
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
                      Work
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                      <ShieldAlert size={13} />
                      Disable
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
                    Edit
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
                  There are no admin accounts yet.
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
    SUPPORT_AGENT: "Support",
    CONTENT_EDITOR: "Editor",
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
      setErrorMsg(getErrorMessage(err, "An error occurred while creating the account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell title="Add administrative staff" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Display name">
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Login email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Password (minimum 8 characters)">
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Role">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="form-input"
          >
            <option value="SUPPORT_AGENT">Customer Support (SUPPORT_AGENT)</option>
            <option value="CONTENT_EDITOR">Content editor (CONTENT_EDITOR)</option>
            <option value="SUPER_ADMIN">Super Administrator (SUPER_ADMIN)</option>
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
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Create an account"}
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
      setErrorMsg(getErrorMessage(err, "An error occurred while updating."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell title="Set up an account" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-[var(--admin-sidebar-accent)] px-3 py-2 text-sm">
          <span className="text-[var(--admin-text-secondary)]">Editing:</span>
          <span className="font-semibold text-[var(--admin-text-primary)]">{user.email}</span>
        </div>
        <FormField label="Display name">
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Role">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="form-input"
          >
            <option value="SUPPORT_AGENT">Customer Support (SUPPORT_AGENT)</option>
            <option value="CONTENT_EDITOR">Content editor (CONTENT_EDITOR)</option>
            <option value="SUPER_ADMIN">Super Administrator (SUPER_ADMIN)</option>
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
            Account is active
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
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Save changes"}
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
