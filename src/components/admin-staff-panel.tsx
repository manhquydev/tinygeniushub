"use client";

import { useEffect, useState } from "react";
import { listAdminStaff, createAdminStaff, updateAdminStaff } from "@/modules/admin/admin-staff-service";
import { AdminRole } from "@prisma/client";
import { Shield, ShieldAlert, ShieldCheck, Plus, X, Pencil, Loader2 } from "lucide-react";

type AdminUserRow = {
    id: string;
    email: string;
    displayName: string;
    role: AdminRole;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
};

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
        } catch (err: any) {
            setError(err.message || "Failed to load staff list. Ensure you are a SUPER_ADMIN.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Đang tải danh sách nhân sự...</div>;
    if (error) return <div className="p-8 text-center text-rose-600">{error}</div>;

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Nhân sự</h1>
                    <p className="text-sm text-slate-500">Danh sách tài khoản Admin và quyền hạn trong hệ thống.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                >
                    <Plus size={16} /> Thêm nhân sự
                </button>
            </header>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-xs uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-3 font-semibold">Tài khoản</th>
                            <th className="px-4 py-3 font-semibold">Vai trò</th>
                            <th className="px-4 py-3 font-semibold">Trạng thái</th>
                            <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
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
                                            <ShieldCheck size={14} /> Hoạt động
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                                            <ShieldAlert size={14} /> Vô hiệu hóa
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => setEditingUser(u)}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline"
                                    >
                                        <Pencil size={14} /> Chỉnh sửa
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-sm text-slate-500">
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
            alert("Tạo tài khoản thành công!");
            onSuccess();
        } catch (err: any) {
            alert(err.message || "Có lỗi xảy ra");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">Thêm nhân sự quản trị</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Tên hiển thị</label>
                        <input
                            required value={displayName} onChange={e => setDisplayName(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Email đăng nhập</label>
                        <input
                            required type="email" value={email} onChange={e => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Mật khẩu (tối thiểu 8 ký tự)</label>
                        <input
                            required type="text" minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Chức vụ (Vai trò)</label>
                        <select
                            value={role} onChange={e => setRole(e.target.value as AdminRole)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        >
                            <option value="SUPPORT_AGENT">Hỗ trợ khách hàng (SUPPORT_AGENT)</option>
                            <option value="CONTENT_EDITOR">Biên tập nội dung (CONTENT_EDITOR)</option>
                            <option value="SUPER_ADMIN">Quản trị viên cấp cao (SUPER_ADMIN)</option>
                        </select>
                    </div>
                    <div className="pt-2">
                        <button
                            type="submit" disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Tạo tài khoản"}
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
            alert("Cập nhật thành công!");
            onSuccess();
        } catch (err: any) {
            alert(err.message || "Có lỗi xảy ra");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">Thiết lập tài khoản</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="rounded-lg bg-slate-50 p-3 text-sm">
                        <span className="text-slate-500">Đang chỉnh sửa:</span> <span className="font-semibold text-slate-900">{user.email}</span>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Tên hiển thị</label>
                        <input
                            required value={displayName} onChange={e => setDisplayName(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Chức vụ (Vai trò)</label>
                        <select
                            value={role} onChange={e => setRole(e.target.value as AdminRole)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        >
                            <option value="SUPPORT_AGENT">Hỗ trợ khách hàng (SUPPORT_AGENT)</option>
                            <option value="CONTENT_EDITOR">Biên tập nội dung (CONTENT_EDITOR)</option>
                            <option value="SUPER_ADMIN">Quản trị viên cấp cao (SUPER_ADMIN)</option>
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
                            Tài khoản đang hoạt động
                        </label>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit" disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
