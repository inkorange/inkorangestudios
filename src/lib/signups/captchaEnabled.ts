/**
 * Whether the Turnstile widget renders, i.e. a token must be earned before submit.
 *
 * Both must hold: a site key is configured, and this is not a dev server. A
 * Turnstile site key is bound to its registered domains, so on localhost the
 * widget could not be satisfied and the form would be unsubmittable.
 *
 * NODE_ENV is the gate (not a hostname check): `next build` hard-codes it to
 * "production", so this is only false under `next dev` (and in tests).
 *
 * Imported by BOTH the client widget and the server (`turnstile.ts`). Only the
 * site key is visible in the browser; whether the server also has the secret
 * (and so verifies, or fails closed when exactly one key is set) is decided in
 * `turnstile.ts` as `CAPTCHA_REQUIRED` / `CAPTCHA_MISCONFIGURED`.
 */
export const CAPTCHA_WIDGET =
  process.env.NODE_ENV !== "development" && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
