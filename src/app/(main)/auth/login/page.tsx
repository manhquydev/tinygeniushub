import { AuthForm } from "@/components/auth-form";
import { AuthSplitShell } from "@/components/auth-split-shell";

interface LoginPageProps {
  searchParams?:
    | Promise<{ next?: string | string[] }>
    | { next?: string | string[] };
}

function readSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = readSingleParam(resolvedSearchParams?.next);

  return (
    <AuthSplitShell
      badge="Truy cập phụ huynh"
      title="Chào mừng ba mẹ quay lại hành trình tự học"
      description="Đăng nhập để xem tiến độ học tập, mở bài học hôm nay và đồng hành cùng bé mỗi ngày."
      backgroundImageSrc="/images/bg/bg_hero_cloud_learning.png"
      stickerSrc="/kisu-assets/stickers/sticker_cheer.png"
    >
      <AuthForm mode="login" nextPath={nextPath} />
    </AuthSplitShell>
  );
}
