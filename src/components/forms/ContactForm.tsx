"use client";

import { useActionState, useState } from "react";
import { sendContactMessage } from "@/app/actions/contact";
import { Button, FormMessage, Honeypot, Select, Stack, TextArea, TextField, Turnstile } from "@/components/ui";
import { turnstileActive } from "@/components/ui/Turnstile/Turnstile";
import type { FormState } from "@/lib/signups/types";

const TOPICS = [
  { value: "general", label: "General" },
  { value: "support", label: "Player support" },
  { value: "press", label: "Press" },
  { value: "business", label: "Business" },
];

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, { status: "idle" } as FormState);
  // Controlled so a rejected submit keeps what the visitor typed.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("general");
  const [message, setMessage] = useState("");
  const [tokenReady, setTokenReady] = useState(() => !turnstileActive());

  if (state.status === "ok") {
    return <FormMessage status="success">Thanks — your message is on its way. We&apos;ll reply by email.</FormMessage>;
  }

  return (
    <form action={formAction}>
      <Stack gap={5}>
        <TextField label="Name" name="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Select label="Topic" name="topic" options={TOPICS} value={topic} onChange={(e) => setTopic(e.target.value)} />
        <TextArea label="Message" name="message" rows={6} required value={message} onChange={(e) => setMessage(e.target.value)} />
        <Honeypot />
        <Turnstile resetKey={state} onTokenChange={setTokenReady} />
        <div>
          <Button variant="accent" type="submit" disabled={pending || !tokenReady}>
            Send message
          </Button>
        </div>
        {state.status === "error" ? <FormMessage status="error">{state.error}</FormMessage> : null}
      </Stack>
    </form>
  );
}
