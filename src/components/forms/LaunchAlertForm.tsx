"use client";

import { requestLaunchAlert } from "@/app/actions/launchAlert";
import { EmailSignupForm } from "@/components/ui";

export type LaunchAlertFormProps = {
  game: string;
  platform: string;
};

/** Display label to the slug the server validates: "Android" -> "android". */
function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function LaunchAlertForm({ game, platform }: LaunchAlertFormProps) {
  return (
    <EmailSignupForm
      action={requestLaunchAlert}
      label="Email address"
      placeholder="Email me at launch"
      submitLabel="Notify me"
      tone="on-card"
      hidden={{ game, platform: slugify(platform) }}
      successMessage={`We'll email you when it launches on ${platform}.`}
    />
  );
}
