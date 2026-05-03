"use client";

import { InstallationOnboarding } from "@/components/behar/installation-onboarding";
import { useBeharStore } from "@/lib/behar-store";

export function InstallationGate() {
  const onboardingCompleted = useBeharStore((s) => s.onboardingCompleted);
  return <InstallationOnboarding open={!onboardingCompleted} />;
}
