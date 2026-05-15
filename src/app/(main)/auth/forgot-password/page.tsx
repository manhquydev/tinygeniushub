import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { AuthSplitShell } from "@/components/auth-split-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default async function ForgotPasswordPage() {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  return (
    <AuthSplitShell
      badge={translate("auth.forgotPassword.badge", undefined, locale)}
      title={translate("auth.forgotPassword.title", undefined, locale)}
      description={translate("auth.forgotPassword.description", undefined, locale)}
      actionProp="magic"
      backgroundImageSrc="/images/bg/bg_course_space_exploration.png"
      stickerSrc="/kisu-assets/stickers/sticker_hint.png"
    >
      <ForgotPasswordForm />
    </AuthSplitShell>
  );
}
