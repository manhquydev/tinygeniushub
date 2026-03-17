import { AuthForm } from "@/components/auth-form";
import { AuthSplitShell } from "@/components/auth-split-shell";

interface SignupPageProps {
  searchParams?:
    | Promise<{ next?: string | string[] }>
    | { next?: string | string[] };
}

function readSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = readSingleParam(resolvedSearchParams?.next);

  return (
    <AuthSplitShell
      badge="Mở khóa hành trình học"
      title="Tạo tài khoản để bắt đầu hành trình cùng con"
      description="Tạo tài khoản phụ huynh, xem bài học mẫu và chọn khóa phù hợp cho bé chỉ trong vài bước."
      actionProp="reading"
      backgroundImageSrc="/images/bg/bg_map_math_island.png"
      stickerSrc="/kisu-assets/stickers/sticker_reward_coin.png"
    >
      <AuthForm mode="signup" nextPath={nextPath} />
    </AuthSplitShell>
  );
}
