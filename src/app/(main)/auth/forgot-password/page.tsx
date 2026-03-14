import { AuthSplitShell } from "@/components/auth-split-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthSplitShell
      badge="Recovery"
      title="Lấy lại mật khẩu để tiếp tục đồng hành cùng bé"
      description="Đừng lo, chỉ cần một bước xác minh email là bạn có thể quay lại dashboard và tiếp tục hành trình học tập."
      actionProp="magic"
      backgroundImageSrc="/images/bg/bg_course_space_exploration.png"
      stickerSrc="/kisu-assets/stickers/sticker_hint.png"
    >
      <ForgotPasswordForm />
    </AuthSplitShell>
  );
}
