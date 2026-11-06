import { z } from "zod";

/** Treat empty strings (unset-but-declared vars) as undefined. */
const optional = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional(),
);

const required = (name: string) =>
  z.string({ error: `${name} is required` }).min(1, `${name} is required`);

const serverSchema = z.object({
  SUPABASE_URL: required("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),
  SANITY_API_TOKEN: optional,
  POSTMARK_SERVER_TOKEN: optional,
  FEEDBACK_FROM_EMAIL: optional,
  FEEDBACK_NOTIFY_EMAIL: optional,
  TURNSTILE_SECRET_KEY: optional,
  SANITY_REVALIDATE_SECRET: optional,
});

export type ServerEnv = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SANITY_API_TOKEN?: string;
  POSTMARK_SERVER_TOKEN?: string;
  FEEDBACK_FROM_EMAIL?: string;
  FEEDBACK_NOTIFY_EMAIL?: string;
  TURNSTILE_SECRET_KEY?: string;
  SANITY_REVALIDATE_SECRET?: string;
};

/**
 * Server-only secrets. Call from server code at request time (not module load)
 * so a missing optional integration never breaks a build.
 * SUPABASE_URL falls back to NEXT_PUBLIC_SUPABASE_URL.
 */
export function readServerEnv(): ServerEnv {
  const source = {
    ...process.env,
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  };
  const parsed = serverSchema.safeParse(source);
  if (!parsed.success) {
    const names = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing or invalid environment variables: ${names}`);
  }
  return parsed.data;
}

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

/**
 * The Sanity webhook secret alone, read at request time. Separate from `readServerEnv` so the
 * revalidate route doesn't depend on unrelated (Supabase) variables.
 */
export function readRevalidateSecret(): string | undefined {
  return clean(process.env.SANITY_REVALIDATE_SECRET);
}

export type NewsletterEnv = {
  postmarkToken?: string;
  fromEmail?: string;
  testEmail?: string;
  broadcastStream?: string;
  webhookSecret?: string;
  postmarkWebhookUser?: string;
  postmarkWebhookPassword?: string;
  sanityToken?: string;
};

/**
 * Newsletter settings, read at call time. Independent of the Supabase vars so routes that only
 * need Postmark/Sanity values never fail on unrelated configuration. Blank values are undefined.
 */
export function readNewsletterEnv(): NewsletterEnv {
  return {
    postmarkToken: clean(process.env.POSTMARK_SERVER_TOKEN),
    fromEmail: clean(process.env.NEWSLETTER_FROM_EMAIL),
    testEmail: clean(process.env.NEWSLETTER_TEST_EMAIL),
    broadcastStream: clean(process.env.POSTMARK_BROADCAST_STREAM),
    webhookSecret: clean(process.env.NEWSLETTER_WEBHOOK_SECRET),
    postmarkWebhookUser: clean(process.env.POSTMARK_WEBHOOK_USER),
    postmarkWebhookPassword: clean(process.env.POSTMARK_WEBHOOK_PASSWORD),
    sanityToken: clean(process.env.SANITY_API_TOKEN),
  };
}

// Public values live in a zod-free module so client components can import them; re-exported for server code.
export { publicEnv, type PublicEnv } from "./env-public";
