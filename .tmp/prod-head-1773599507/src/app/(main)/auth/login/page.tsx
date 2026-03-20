import { AuthForm } from "@/components/auth-form";
import { AuthSplitShell } from "@/components/auth-split-shell";

export default function LoginPage() {
  return (
    <AuthSplitShell
      badge="Parent Access"
      title="Chào mừng ba mẹ quay lại hành trình tự học"
      description="Đăng nhập để xem tiến độ học tập, mở bài học hôm nay và đồng hành cùng bé mỗi ngày."
      backgroundImageSrc="/images/bg/bg_hero_cloud_learning.png"
      stickerSrc="/kisu-assets/stickers/sticker_cheer.png"
    >
      <AuthForm mode="login" />
    </AuthSplitShell>
  );
}
