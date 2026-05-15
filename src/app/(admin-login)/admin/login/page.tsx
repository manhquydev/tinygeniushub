import { AdminLoginForm } from "@/components/admin-login-form";
import { requireAdminSession } from "@/modules/admin/admin-auth-service";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";

export async function generateMetadata() {
  const locale = resolveAppLocale(await getLocale());
  return {
    title: translate("admin.login.metadataTitle", undefined, locale),
    robots: "noindex, nofollow",
  };
}

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
