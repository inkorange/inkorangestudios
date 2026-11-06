"use server";

import { notifyOwner } from "@/lib/signups/notify";
import { verifyTurnstile } from "@/lib/signups/turnstile";
import { insertOnce, remoteIp } from "@/lib/signups/store";
import { validateBeta } from "@/lib/signups/validate";
import type { FormState } from "@/lib/signups/types";

export async function joinBeta(_prev: FormState, fd: FormData): Promise<FormState> {
  const v = validateBeta(fd);
  if (!v.ok) return v.error === "spam" ? { status: "ok" } : { status: "error", error: v.error };
  const { email, game, platform, source } = v.value;

  const token = String(fd.get("captchaToken") ?? "");
  if (!(await verifyTurnstile(token, await remoteIp()))) {
    return { status: "error", error: "Please complete the human check and try again." };
  }

  const r = await insertOnce("studio_beta_signups", { email, game, platform, source }, "email,game");
  if (!r.ok) return { status: "error", error: "Something went wrong. Please try again." };

  // Only for a new row: a repeat signup must not mail the owner again.
  if (r.isNew) {
    try {
      await notifyOwner({
        subject: `New beta tester: ${email} (${game})`,
        replyTo: email,
        lines: [
          `Email: ${email}`,
          `Game: ${game}`,
          `Platform: ${platform ?? "not specified"}`,
          `Signed up from: ${source}`,
          "",
          "Reply to this email to send them the beta invite.",
        ],
      });
    } catch {
      // notifyOwner never throws by contract; the row is saved either way.
    }
  }
  return { status: "ok" };
}
