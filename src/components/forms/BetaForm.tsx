"use client";

import { useState } from "react";
import { joinBeta } from "@/app/actions/beta";
import { EmailSignupForm, Select } from "@/components/ui";
import { betaPlatformLabel } from "@/lib/games";
import type { FormState } from "@/lib/signups/types";

export type BetaFormProps = {
  game: string;
  platforms: string[];
  /** Where the signup happened, named in the owner's email: the home page "callout" or a "game-page". */
  source?: "callout" | "game-page";
};

export function BetaForm({ game, platforms, source = "callout" }: BetaFormProps) {
  // React resets the form after each submit: remember the choice and remount the select per result.
  const [platform, setPlatform] = useState(platforms[0] ?? "");
  const [attempt, setAttempt] = useState(0);
  const action = async (prev: FormState, data: FormData) => {
    const result = await joinBeta(prev, data);
    setAttempt((n) => n + 1);
    return result;
  };
  const choose = platforms.length > 1;
  const hidden: Record<string, string> = { game, source };
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
            options={platforms.map((p) => ({ value: p, label: betaPlatformLabel(p) }))}
            defaultValue={platform}
            onChange={setPlatform}
          />
        ) : null
      }
    />
  );
}
