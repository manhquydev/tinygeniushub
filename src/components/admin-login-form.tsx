"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Shield, Loader2, KeyRound } from "lucide-react";

const ADMIN_ERROR_KEYS: Record<string, string> = {
    "Login failed. Please check the information again.": "errors.loginFailed",
    "Login failed. Please check your details and try again.": "errors.loginFailed",
    "Connection error. Please try again.": "errors.connection",
};

const GLOBAL_ERROR_KEYS: Record<string, string> = {
    "Invalid credentials": "invalidCredentials",
    "Invalid credentials.": "invalidCredentials",
    "Too many login attempts. Please retry later.": "loginRateLimited",
    "Invalid request payload": "invalidPayload",
    "Invalid JSON payload": "invalidJson",
};

function isLikelyEnglishOnlyMessage(message: string) {
    return /^[\x20-\x7E\u2013\u2014\u2026]+$/.test(message);
}

export function AdminLoginForm() {
    const t = useTranslations("admin.login.form");
    const tErrors = useTranslations("errors");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const unknownError = tErrors("unknown");

    function resolveErrorMessage(message: string | undefined) {
        if (!message) {
            return t("errors.loginFailed");
        }
        const localKey = ADMIN_ERROR_KEYS[message];
        if (localKey) {
            return t(localKey);
        }
        const globalKey = GLOBAL_ERROR_KEYS[message];
        if (globalKey) {
            return tErrors(globalKey);
        }
        if (!isLikelyEnglishOnlyMessage(message)) {
            return message;
        }
        return unknownError;
    }

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
                setError(resolveErrorMessage(data?.error?.message));
                setIsLoading(false);
                return;
            }
        } catch {
            setError(t("errors.connection"));
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
                <h1 className="mt-4 text-2xl font-bold tracking-tight">{t("title")}</h1>
                <p className="mt-2 text-center text-sm text-slate-400">{t("subtitle")}</p>
            </div>

            <div className="p-8">
                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">{t("emailLabel")}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                            placeholder={t("emailPlaceholder")}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">{t("passwordLabel")}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                            placeholder={t("passwordPlaceholder")}
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
                        <span>{isLoading ? t("submitLoading") : t("submit")}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
