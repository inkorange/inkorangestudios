"use client";

import { subscribeNewsletter } from "@/app/actions/newsletter";
import { EmailSignupForm } from "@/components/ui";

export type NewsletterFormProps = {
  tone: "on-dark";
  source: string;
};

export function NewsletterForm({ tone, source }: NewsletterFormProps) {
  return (
    <EmailSignupForm
      action={subscribeNewsletter}
      label="Email address"
      placeholder="you@example.com"
      submitLabel="Subscribe"
      tone={tone}
      hidden={{ source }}
      successMessage="You're on the list. Watch your inbox for news."
    />
  );
}
