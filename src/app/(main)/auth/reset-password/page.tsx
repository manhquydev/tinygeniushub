import { getLocale } from "next-intl/server";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { AuthSplitShell } from "@/components/auth-split-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default async function ResetPasswordPage() {
  const rawLocale = await getLocale();
  const locale = resolveAppLocale(rawLocale);

  return (
    <AuthSplitShell
      badge={translate("auth.resetPassword.badge", undefined, locale)}
      title={translate("auth.resetPassword.title", undefined, locale)}
      description={translate("auth.resetPassword.description", undefined, locale)}
      actionProp="magic"
      backgroundImageSrc="/images/bg/bg_course_space_exploration.png"
      stickerSrc="/kisu-assets/stickers/sticker_book.png"
    >
      <ResetPasswordForm />
    </AuthSplitShell>
  );
}
