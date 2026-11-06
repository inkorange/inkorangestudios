"use server";

import { verifyTurnstile } from "@/lib/signups/turnstile";
import { insertOnce, remoteIp } from "@/lib/signups/store";
import { rejection, validateNewsletter } from "@/lib/signups/validate";
import type { FormState } from "@/lib/signups/types";

export async function subscribeNewsletter(_prev: FormState, fd: FormData): Promise<FormState> {
  const v = validateNewsletter(fd);
  if (!v.ok) return rejection(v);

  const token = String(fd.get("captchaToken") ?? "");
  if (!(await verifyTurnstile(token, await remoteIp()))) {
    return { status: "error", error: "Please complete the human check and try again." };
  }

  const r = await insertOnce(
    "studio_newsletter_signups",
    { email: v.value.email, source: v.value.source },
    "email",
  );
  if (!r.ok) return { status: "error", error: "Something went wrong. Please try again." };
  return { status: "ok" };
}
