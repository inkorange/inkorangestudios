"use client";

import { useActionState, useState, type ReactNode } from "react";
import type { FormState } from "@/lib/signups/types";
import { Button } from "../Button/Button";
import { FormMessage } from "../FormMessage/FormMessage";
import { TextField } from "../TextField/TextField";
import { Turnstile, turnstileActive } from "../Turnstile/Turnstile";
import styles from "./EmailSignupForm.module.scss";

export type EmailSignupFormProps = {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  label: string;
  placeholder: string;
  submitLabel: string;
  tone: "on-dark" | "on-card" | "on-accent";
  /** `responsive`: stacked on a phone, one row from `md`. */
  layout?: "inline" | "stacked" | "responsive";
  hidden?: Record<string, string>;
  successMessage: string;
  /** Extra controls rendered inside the form, before the submit button. */
  extraFields?: ReactNode;
};

const FIELD_TONE = { "on-dark": "on-dark", "on-card": "on-card", "on-accent": "on-light" } as const;
const BUTTON_VARIANT = { "on-dark": "accent", "on-card": "ink", "on-accent": "ink" } as const;

export function EmailSignupForm({
  action,
  label,
  placeholder,
  submitLabel,
  tone,
  layout = "inline",
  hidden,
  successMessage,
  extraFields,
}: EmailSignupFormProps) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as FormState);
  // Controlled so a rejected submit keeps what the visitor typed.
  const [email, setEmail] = useState("");
  // When a human check is on, hold submit until it has produced a token.
  const [tokenReady, setTokenReady] = useState(() => !turnstileActive());

  if (state.status === "ok") {
    return (
      <div className={styles.root} data-tone={tone}>
        <FormMessage status="success">{successMessage}</FormMessage>
      </div>
    );
  }

  return (
    <form className={styles.root} data-tone={tone} data-layout={layout} data-extra={extraFields ? "true" : "false"} action={formAction}>
      <div className={styles.row}>
        <div className={styles.field}>
          <TextField
            label={label}
            hideLabel
            name="email"
            type="email"
            placeholder={placeholder}
            required
            autoComplete="email"
            tone={FIELD_TONE[tone]}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {extraFields}
        <Button variant={BUTTON_VARIANT[tone]} type="submit" disabled={pending || !tokenReady} block={layout === "stacked"}>
          {submitLabel}
        </Button>
      </div>
      {hidden
        ? Object.entries(hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)
        : null}
      <Turnstile resetKey={state} onTokenChange={setTokenReady} />
      {state.status === "error" ? <FormMessage status="error">{state.error}</FormMessage> : null}
    </form>
  );
}
