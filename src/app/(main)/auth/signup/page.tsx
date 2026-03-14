import { AuthForm } from "@/components/auth-form";
import { AuthSplitShell } from "@/components/auth-split-shell";

export default function SignupPage() {
  return (
    <AuthSplitShell
      badge="7-Day Trial"
      title="Tạo tài khoản để bắt đầu chặng học mới cùng bé"
      description="Mở ngay 7 ngày dùng thử, cá nhân hóa hành trình học và nhận báo cáo tiến bộ trực quan mỗi tuần."
      actionProp="reading"
      backgroundImageSrc="/images/bg/bg_map_math_island.png"
      stickerSrc="/kisu-assets/stickers/sticker_reward_coin.png"
    >
      <AuthForm mode="signup" />
    </AuthSplitShell>
  );
}
