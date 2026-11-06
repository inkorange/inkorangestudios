/**
 * Whether a human check is required for this build.
 *
 * Both must hold: keys are configured, and this is not a dev server. A
 * Turnstile site key is bound to its registered domains, so on localhost the
 * widget could not be satisfied and the form would be unsubmittable.
 *
 * NODE_ENV is the gate (not a hostname check): `next build` hard-codes it to
 * "production", so this is only false under `next dev` (and in tests).
 *
 * Imported by BOTH the client widget and the server action, so the two never
 * disagree about whether a token is expected.
 */
export const CAPTCHA_REQUIRED =
  process.env.NODE_ENV !== "development" &&
  Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? process.env.TURNSTILE_SECRET_KEY);
