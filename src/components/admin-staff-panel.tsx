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
            setError(getErrorMessage(err, "Failed to load staff list. Ensure you are a SUPER_ADMIN."));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Äang táº£i danh sÃ¡ch nhÃ¢n sá»±...</div>;
    if (error) return <div className="p-8 text-center text-rose-600">{error}</div>;

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quáº£n lÃ½ NhÃ¢n sá»±</h1>
                    <p className="text-sm text-slate-500">Danh sÃ¡ch tÃ i khoáº£n Admin vÃ  quyá»n háº¡n trong há»‡ thá»‘ng.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                >
                    <Plus size={16} /> ThÃªm nhÃ¢n sá»±
                </button>
            </header>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-xs uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-3 font-semibold">TÃ i khoáº£n</th>
                            <th className="px-4 py-3 font-semibold">Vai trÃ²</th>
                            <th className="px-4 py-3 font-semibold">Tráº¡ng thÃ¡i</th>
                            <th className="px-4 py-3 font-semibold text-right">Thao tÃ¡c</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3">
                                    <p className="font-semibold text-slate-900">{u.displayName}</p>
                                    <p className="text-xs text-slate-500">{u.email}</p>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {u.isActive ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                                            <ShieldCheck size={14} /> Hoáº¡t Ä‘á»™ng
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                                            <ShieldAlert size={14} /> VÃ´ hiá»‡u hÃ³a
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => setEditingUser(u)}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline"
                                    >
                                        <Pencil size={14} /> Chá»‰nh sá»­a
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-sm text-slate-500">
                                    ChÆ°a cÃ³ tÃ i khoáº£n quáº£n trá»‹ nÃ o.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isCreateModalOpen && (
                <CreateStaffModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => { setIsCreateModalOpen(false); loadData(); }}
                />
            )}

            {editingUser && (
                <EditStaffModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={() => { setEditingUser(null); loadData(); }}
                />
            )}
        </div>
    );
}

function CreateStaffModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [role, setRole] = useState<AdminRole>("SUPPORT_AGENT");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await createAdminStaff({ email, password, displayName, role });
            alert("Táº¡o tÃ i khoáº£n thÃ nh cÃ´ng!");
            onSuccess();
        } catch (err: unknown) {
            alert(getErrorMessage(err, "Có lỗi xảy ra"));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">ThÃªm nhÃ¢n sá»± quáº£n trá»‹</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">TÃªn hiá»ƒn thá»‹</label>
                        <input
                            required value={displayName} onChange={e => setDisplayName(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Email Ä‘Äƒng nháº­p</label>
                        <input
                            required type="email" value={email} onChange={e => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Máº­t kháº©u (tá»‘i thiá»ƒu 8 kÃ½ tá»±)</label>
                        <input
                            required type="text" minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Chá»©c vá»¥ (Vai trÃ²)</label>
                        <select
                            value={role} onChange={e => setRole(e.target.value as AdminRole)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        >
                            <option value="SUPPORT_AGENT">Há»— trá»£ khÃ¡ch hÃ ng (SUPPORT_AGENT)</option>
                            <option value="CONTENT_EDITOR">BiÃªn táº­p ná»™i dung (CONTENT_EDITOR)</option>
                            <option value="SUPER_ADMIN">Quáº£n trá»‹ viÃªn cáº¥p cao (SUPER_ADMIN)</option>
                        </select>
                    </div>
                    <div className="pt-2">
                        <button
                            type="submit" disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Táº¡o tÃ i khoáº£n"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditStaffModal({ user, onClose, onSuccess }: { user: AdminUserRow, onClose: () => void, onSuccess: () => void }) {
    const [displayName, setDisplayName] = useState(user.displayName);
    const [role, setRole] = useState<AdminRole>(user.role);
    const [isActive, setIsActive] = useState(user.isActive);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await updateAdminStaff({ id: user.id, displayName, role, isActive });
            alert("Cáº­p nháº­t thÃ nh cÃ´ng!");
            onSuccess();
        } catch (err: unknown) {
            alert(getErrorMessage(err, "Có lỗi xảy ra"));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">Thiáº¿t láº­p tÃ i khoáº£n</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="rounded-lg bg-slate-50 p-3 text-sm">
                        <span className="text-slate-500">Äang chá»‰nh sá»­a:</span> <span className="font-semibold text-slate-900">{user.email}</span>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">TÃªn hiá»ƒn thá»‹</label>
                        <input
                            required value={displayName} onChange={e => setDisplayName(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Chá»©c vá»¥ (Vai trÃ²)</label>
                        <select
                            value={role} onChange={e => setRole(e.target.value as AdminRole)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        >
                            <option value="SUPPORT_AGENT">Há»— trá»£ khÃ¡ch hÃ ng (SUPPORT_AGENT)</option>
                            <option value="CONTENT_EDITOR">BiÃªn táº­p ná»™i dung (CONTENT_EDITOR)</option>
                            <option value="SUPER_ADMIN">Quáº£n trá»‹ viÃªn cáº¥p cao (SUPER_ADMIN)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <input
                            type="checkbox"
                            id="isActiveCheckbox"
                            checked={isActive}
                            onChange={e => setIsActive(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                        />
                        <label htmlFor="isActiveCheckbox" className="text-sm font-medium text-slate-700 cursor-pointer">
                            TÃ i khoáº£n Ä‘ang hoáº¡t Ä‘á»™ng
                        </label>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit" disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "LÆ°u thay Ä‘á»•i"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

