"use server";

import { notifyOwner } from "@/lib/signups/notify";
import { verifyTurnstile } from "@/lib/signups/turnstile";
import { insertAlways, remoteIp } from "@/lib/signups/store";
import { validateContact } from "@/lib/signups/validate";
import type { FormState } from "@/lib/signups/types";

export async function sendContactMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  const v = validateContact(fd);
  if (!v.ok) return v.error === "spam" ? { status: "ok" } : { status: "error", error: v.error };
  const { name, email, topic, message } = v.value;

  const token = String(fd.get("captchaToken") ?? "");
  if (!(await verifyTurnstile(token, await remoteIp()))) {
    return { status: "error", error: "Please complete the human check and try again." };
  }

  const r = await insertAlways("studio_contact_messages", { name, email, topic, message });
  if (!r.ok) return { status: "error", error: "Something went wrong. Please try again." };

  try {
    await notifyOwner({
      subject: `Contact (${topic}): ${name}`,
      replyTo: email,
      lines: [`From: ${name} <${email}>`, `Topic: ${topic}`, "", message],
    });
  } catch {
    // notifyOwner never throws by contract; the row is saved either way.
  }
  return { status: "ok" };
}
