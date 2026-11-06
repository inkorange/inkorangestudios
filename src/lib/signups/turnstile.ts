import "server-only";

import { CAPTCHA_REQUIRED } from "./captchaEnabled";

/**
 * Verify a Cloudflare Turnstile token. Skipped when no check was required of
 * the visitor in the first place (no keys configured, or a dev server).
 * Otherwise fails CLOSED (false) on any error.
 */
export async function verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  if (!CAPTCHA_REQUIRED) return true;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const form = new URLSearchParams({ secret, response: token });
    if (remoteIp) form.set("remoteip", remoteIp);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}
