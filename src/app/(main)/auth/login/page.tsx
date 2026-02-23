import { AuthForm } from "@/components/auth-form";
import { AuthSplitShell } from "@/components/auth-split-shell";

export default function LoginPage() {
  return (
    <AuthSplitShell
      badge="Parent Access"
      title="Chào mừng ba mẹ quay lại hành trình tự học"
      description="Đăng nhập để xem tiến độ học tập, mở bài học hôm nay và đồng hành cùng bé mỗi ngày."
    >
      <AuthForm mode="login" />
    </AuthSplitShell>
  );
}
