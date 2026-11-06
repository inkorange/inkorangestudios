"use client";

import { useState } from "react";
import { joinBeta } from "@/app/actions/beta";
import { EmailSignupForm, Select } from "@/components/ui";

export type BetaFormProps = {
  game: string;
  platforms: string[];
};

const PLATFORM_LABELS: Record<string, string> = { ios: "iOS", android: "Android" };

export function BetaForm({ game, platforms }: BetaFormProps) {
  // Controlled so the choice survives a rejected submit (React resets uncontrolled fields).
  const [platform, setPlatform] = useState(platforms[0] ?? "");
  const choose = platforms.length > 1;
  const hidden: Record<string, string> = { game, source: "callout" };
  if (!choose && platforms[0]) hidden.platform = platforms[0];

  return (
    <EmailSignupForm
      action={joinBeta}
      label="Email address"
      placeholder="you@example.com"
      submitLabel="Join the beta"
      tone="on-accent"
      hidden={hidden}
      successMessage="Thanks! We'll email you when a beta spot opens."
      extraFields={
        choose ? (
          <Select
            label="Platform"
            hideLabel
            name="platform"
            tone="on-accent"
            options={platforms.map((p) => ({ value: p, label: PLATFORM_LABELS[p] ?? p }))}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          />
        ) : null
      }
    />
  );
}
