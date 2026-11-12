"use client";

import { useState } from "react";
import { joinBeta } from "@/app/actions/beta";
import { EmailSignupForm, Select } from "@/components/ui";
import { betaPlatformLabel } from "@/lib/games";
import type { FormState } from "@/lib/signups/types";

export type BetaFormProps = {
  game: string;
  platforms: string[];
  /**
   * Where the signup happened, named in the owner's email: the home page "callout", a "game-page" or the
   * game's tester page ("beta-page", which adds the page's `?from=` link tag, e.g. "beta-page-terraforge").
   */
  source?: "callout" | "game-page" | "beta-page";
  tone?: "on-accent" | "on-dark";
  layout?: "inline" | "responsive";
  label?: string;
  placeholder?: string;
  submitLabel?: string;
  successMessage?: string;
};

/** The `?from=` tag on the tester page's URL, when it is a plain slug. */
function linkTag(): string | null {
  const from = new URLSearchParams(window.location.search).get("from")?.trim().toLowerCase() ?? "";
  return /^[a-z0-9-]{1,40}$/.test(from) ? from : null;
}

export function BetaForm({
  game,
  platforms,
  source = "callout",
  tone = "on-accent",
  layout = "inline",
  label = "Email address",
  placeholder = "you@example.com",
  submitLabel = "Join the beta",
  successMessage = "Thanks! We'll email you when a beta spot opens.",
}: BetaFormProps) {
  // React resets the form after each submit: remember the choice and remount the select per result.
  const [platform, setPlatform] = useState(platforms[0] ?? "");
  const [attempt, setAttempt] = useState(0);
  const action = async (prev: FormState, data: FormData) => {
    if (source === "beta-page") {
      const tag = linkTag();
      if (tag) data.set("source", `beta-page-${tag}`);
    }
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
      label={label}
      placeholder={placeholder}
      submitLabel={submitLabel}
      tone={tone}
      layout={layout}
      hidden={hidden}
      successMessage={successMessage}
      extraFields={
        choose ? (
          <Select
            key={attempt}
            label="Platform"
            hideLabel
            name="platform"
            tone={tone === "on-dark" ? "on-dark" : "on-accent"}
            options={platforms.map((p) => ({ value: p, label: betaPlatformLabel(p) }))}
            defaultValue={platform}
            onChange={setPlatform}
          />
        ) : null
      }
    />
  );
}
