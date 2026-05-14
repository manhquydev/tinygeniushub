import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { AuthForm } from "@/components/auth-form";
import { AuthSplitShell } from "@/components/auth-split-shell";

interface SignupPageProps {
  searchParams?:
    | Promise<{ next?: string | string[] }>
    | { next?: string | string[] };
}

function readSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = readSingleParam(resolvedSearchParams?.next);
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  return (
    <AuthSplitShell
      badge={translate("auth.signup.badge", undefined, locale)}
      title={translate("auth.signup.title", undefined, locale)}
      description={translate("auth.signup.description", undefined, locale)}
      actionProp="reading"
      backgroundImageSrc="/images/bg/bg_map_math_island.png"
      stickerSrc="/kisu-assets/stickers/sticker_reward_coin.png"
    >
      <AuthForm mode="signup" nextPath={nextPath} />
    </AuthSplitShell>
  );
}
