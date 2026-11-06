"use server";

import { verifyTurnstile } from "@/lib/signups/turnstile";
import { insertOnce, remoteIp } from "@/lib/signups/store";
import { rejection, validateLaunchAlert } from "@/lib/signups/validate";
import type { FormState } from "@/lib/signups/types";

export async function requestLaunchAlert(_prev: FormState, fd: FormData): Promise<FormState> {
  const v = validateLaunchAlert(fd);
  if (!v.ok) return rejection(v);

  const token = String(fd.get("captchaToken") ?? "");
  if (!(await verifyTurnstile(token, await remoteIp()))) {
    return { status: "error", error: "Please complete the human check and try again." };
  }

  const r = await insertOnce(
    "studio_launch_alerts",
    { email: v.value.email, game: v.value.game, platform: v.value.platform },
    "email,game,platform",
  );
  if (!r.ok) return { status: "error", error: "Something went wrong. Please try again." };
  return { status: "ok" };
}
