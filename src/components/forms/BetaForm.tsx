"use client";

import { useState } from "react";
import { joinBeta } from "@/app/actions/beta";
import { EmailSignupForm, Select } from "@/components/ui";
import type { FormState } from "@/lib/signups/types";

export type BetaFormProps = {
  game: string;
  platforms: string[];
};

const PLATFORM_LABELS: Record<string, string> = { ios: "iOS", android: "Android" };

export function BetaForm({ game, platforms }: BetaFormProps) {
  // React resets the form after each submit: remember the choice and remount the select per result.
  const [platform, setPlatform] = useState(platforms[0] ?? "");
  const [attempt, setAttempt] = useState(0);
  const action = async (prev: FormState, data: FormData) => {
    const result = await joinBeta(prev, data);
    setAttempt((n) => n + 1);
    return result;
  };
  const choose = platforms.length > 1;
  const hidden: Record<string, string> = { game, source: "callout" };
  if (!choose && platforms[0]) hidden.platform = platforms[0];

  return (
    <EmailSignupForm
      action={action}
      label="Email address"
      placeholder="you@example.com"
      submitLabel="Join the beta"
      tone="on-accent"
      hidden={hidden}
      successMessage="Thanks! We'll email you when a beta spot opens."
      extraFields={
        choose ? (
          <Select
            key={attempt}
            label="Platform"
            hideLabel
            name="platform"
            tone="on-accent"
            options={platforms.map((p) => ({ value: p, label: PLATFORM_LABELS[p] ?? p }))}
            defaultValue={platform}
            onChange={(e) => setPlatform(e.target.value)}
          />
        ) : null
      }
    />
  );
}
