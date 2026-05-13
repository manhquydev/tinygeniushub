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
      badge="Unlock your learning journey"
      title="Create an account to start your journey with your child"
      description="Create a parent account, view sample lessons and choose the right course for your child in just a few steps."
      actionProp="reading"
      backgroundImageSrc="/images/bg/bg_map_math_island.png"
      stickerSrc="/kisu-assets/stickers/sticker_reward_coin.png"
    >
      <AuthForm mode="signup" nextPath={nextPath} />
    </AuthSplitShell>
  );
}
