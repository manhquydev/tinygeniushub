import { AuthSplitShell } from "@/components/auth-split-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthSplitShell
      badge="Account recovery"
      title="Retrieve your password to continue accompanying your baby"
      description="Don't worry, just one step to verify your email and you can return to the dashboard and continue your learning journey."
      actionProp="magic"
      backgroundImageSrc="/images/bg/bg_course_space_exploration.png"
      stickerSrc="/kisu-assets/stickers/sticker_hint.png"
    >
      <ForgotPasswordForm />
    </AuthSplitShell>
  );
}
