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
      badge="Parental access"
      title="Parents, welcome back to your self-study journey"
      description="Log in to view learning progress, open today's lesson and accompany your child every day."
      backgroundImageSrc="/images/bg/bg_hero_cloud_learning.png"
      stickerSrc="/kisu-assets/stickers/sticker_cheer.png"
    >
      <AuthForm mode="login" nextPath={nextPath} />
    </AuthSplitShell>
  );
}
