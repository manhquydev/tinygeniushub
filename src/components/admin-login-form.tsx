"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Shield, Loader2, KeyRound } from "lucide-react";

export function AdminLoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setError(data?.error?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
                setIsLoading(false);
                return;
            }
        } catch {
            setError("Lỗi kết nối. Vui lòng thử lại.");
            setIsLoading(false);
            return;
        }

        router.push("/admin/overview");
        router.refresh();
    }

    return (
        <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <div className="flex flex-col items-center justify-center bg-slate-900 p-8 text-white">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-400">
                    <Shield size={32} />
                </div>
                <h1 className="mt-4 text-2xl font-bold tracking-tight">Cổng Nội Bộ</h1>
                <p className="mt-2 text-center text-sm text-slate-400">
                    Hệ thống dành riêng cho Ban Quản Trị Cùng Con Tự Học
                </p>
            </div>

            <div className="p-8">
                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Email quản trị</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                            placeholder="admin@cungcontuhoc.vn"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-70"
                    >
                        {isLoading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <KeyRound size={18} />
                        )}
                        <span>{isLoading ? "Đang xác thực..." : "Đăng nhập an toàn"}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
