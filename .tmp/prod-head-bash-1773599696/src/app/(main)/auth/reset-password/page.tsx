import { AuthSplitShell } from "@/components/auth-split-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthSplitShell
      badge="Reset Password"
      title="Cập nhật mật khẩu mới để quay lại dashboard"
      description="Sau khi hoàn tất, bạn có thể đăng nhập lại và tiếp tục theo dõi lộ trình học tập của bé."
      actionProp="magic"
      backgroundImageSrc="/images/bg/bg_course_space_exploration.png"
      stickerSrc="/kisu-assets/stickers/sticker_book.png"
    >
      <ResetPasswordForm />
    </AuthSplitShell>
  );
}
