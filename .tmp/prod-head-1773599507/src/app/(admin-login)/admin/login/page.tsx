import { AdminLoginForm } from "@/components/admin-login-form";
import { requireAdminSession } from "@/modules/admin/admin-auth-service";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Admin Login - Cùng Con Tự Học",
    robots: "noindex, nofollow",
};

export default async function AdminLoginPage() {
    const session = await requireAdminSession().catch(() => null);

    if (session) {
        redirect("/admin");
    }

    return (
        <main className="w-full max-w-sm">
            <AdminLoginForm />
        </main>
    );
}
