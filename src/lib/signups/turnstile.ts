import "server-only";

import { CAPTCHA_WIDGET } from "./captchaEnabled";

const DEV = process.env.NODE_ENV === "development";
const SECRET = process.env.TURNSTILE_SECRET_KEY?.trim() || undefined;

/** Both keys set outside a dev server: every submission's token is verified. */
export const CAPTCHA_REQUIRED = CAPTCHA_WIDGET && Boolean(SECRET);

/**
 * Exactly one of the two keys is set outside a dev server. Fail closed: with
 * only the site key the widget renders but its token can't be verified; with
 * only the secret no widget renders, so no token could ever arrive.
 */
export const CAPTCHA_MISCONFIGURED = !DEV && CAPTCHA_WIDGET !== Boolean(SECRET);

let reported = false;

function reportMisconfigured() {
  if (reported) return;
  reported = true;
  console.error(
    "[turnstile] Exactly one of NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY is set. Set both (or neither); until then every form submission is rejected.",
  );
}

/**
 * Verify a Cloudflare Turnstile token. Skipped (true) when no keys are set or on
 * a dev server. Rejected (false) when only one key is set. Otherwise fails
 * CLOSED (false) on any error.
 */
export async function verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  if (CAPTCHA_MISCONFIGURED) {
    reportMisconfigured();
    return false;
  }
  if (!CAPTCHA_REQUIRED || !SECRET) return true;
  if (!token) return false;
  try {
    const form = new URLSearchParams({ secret: SECRET, response: token });
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
