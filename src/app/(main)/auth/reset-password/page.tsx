import { AuthSplitShell } from "@/components/auth-split-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthSplitShell
      badge="Reset password"
      title="Update the new password to return to the dashboard"
      description="Once completed, you can log back in and continue tracking your child's learning journey."
      actionProp="magic"
      backgroundImageSrc="/images/bg/bg_course_space_exploration.png"
      stickerSrc="/kisu-assets/stickers/sticker_book.png"
    >
      <ResetPasswordForm />
    </AuthSplitShell>
  );
}
