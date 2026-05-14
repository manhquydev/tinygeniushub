import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { AuthForm } from "@/components/auth-form";
import { AuthSplitShell } from "@/components/auth-split-shell";

interface LoginPageProps {
  searchParams?:
    | Promise<{ next?: string | string[] }>
    | { next?: string | string[] };
}

function readSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = readSingleParam(resolvedSearchParams?.next);
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  return (
    <AuthSplitShell
      badge={translate("auth.login.badge", undefined, locale)}
      title={translate("auth.login.title", undefined, locale)}
      description={translate("auth.login.description", undefined, locale)}
      backgroundImageSrc="/images/bg/bg_hero_cloud_learning.png"
      stickerSrc="/kisu-assets/stickers/sticker_cheer.png"
    >
      <AuthForm mode="login" nextPath={nextPath} />
    </AuthSplitShell>
  );
}
