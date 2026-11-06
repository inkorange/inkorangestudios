"use client";

import { requestLaunchAlert } from "@/app/actions/launchAlert";
import { EmailSignupForm } from "@/components/ui";

export type LaunchAlertFormProps = {
  game: string;
  platform: string;
};

export function LaunchAlertForm({ game, platform }: LaunchAlertFormProps) {
  return (
    <EmailSignupForm
      action={requestLaunchAlert}
      label="Email address"
      placeholder="Email me at launch"
      submitLabel="Notify me"
      tone="on-card"
      hidden={{ game, platform }}
      successMessage={`We'll email you when it launches on ${platform}.`}
    />
  );
}
