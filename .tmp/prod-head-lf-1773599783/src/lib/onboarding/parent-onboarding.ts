import { prisma } from "@/lib/db";

export interface ParentOnboardingState {
  childCount: number;
  hasChildProfile: boolean;
  requiresSetup: boolean;
}

export async function getParentOnboardingState(parentId: string): Promise<ParentOnboardingState> {
  const childCount = await prisma.childProfile.count({
    where: { parentId },
  });

  return {
    childCount,
    hasChildProfile: childCount > 0,
    requiresSetup: childCount === 0,
  };
}

export function isSetupRequired(state: Pick<ParentOnboardingState, "requiresSetup">) {
  return state.requiresSetup;
}
