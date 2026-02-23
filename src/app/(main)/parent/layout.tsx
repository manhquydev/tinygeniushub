import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireParent } from "@/lib/auth/require-parent";
import { getParentOnboardingState, isSetupRequired } from "@/lib/onboarding/parent-onboarding";

interface ParentAreaLayoutProps {
  children: ReactNode;
}

export default async function ParentAreaLayout({ children }: ParentAreaLayoutProps) {
  const parent = await requireParent();
  const onboardingState = await getParentOnboardingState(parent.id);

  if (isSetupRequired(onboardingState)) {
    redirect("/setup");
  }

  return <>{children}</>;
}
