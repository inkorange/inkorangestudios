"use client";

import { useActionState, useState } from "react";
import { sendContactMessage } from "@/app/actions/contact";
import { Button, FormMessage, Honeypot, Select, Stack, TextArea, TextField, Turnstile, turnstileActive } from "@/components/ui";
import type { FormState } from "@/lib/signups/types";

const TOPICS = [
  { value: "general", label: "General" },
  { value: "support", label: "Player support" },
  { value: "press", label: "Press" },
  { value: "business", label: "Business" },
];

export function ContactForm() {
  const [attempt, setAttempt] = useState(0);
  const [state, formAction, pending] = useActionState(async (prev: FormState, data: FormData) => {
    const result = await sendContactMessage(prev, data);
    setAttempt((n) => n + 1);
    return result;
  }, { status: "idle" } as FormState);
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
        {/* Remounted per result: React resets the form after the action, and a select keeps no value of its own. */}
        <Select key={attempt} label="Topic" name="topic" options={TOPICS} defaultValue={topic} onChange={setTopic} />
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
