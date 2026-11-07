import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { publicEnv, readNewsletterEnv } from "@/lib/env";
import { renderConfirmation } from "@/lib/newsletter/email/render";
import { SETTINGS_QUERY } from "@/lib/newsletter/issue";
import { deleteSuppression, fromLine, sendEmail } from "@/lib/newsletter/postmark";
import { sanityFetch } from "@/lib/sanity/client";
import { createServiceClient } from "@/lib/supabase/server";

export const CONFIRM_TTL_DAYS = 7;
export const RESEND_THROTTLE_MINUTES = 10;

const TABLE = "studio_newsletter_signups";
const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

/** Postmark's reason for a spam complaint: such an address is never revived by the form (R12). */
const SPAM_COMPLAINT = "SpamComplaint";

type Row = {
  id: string;
  email?: string;
  status?: string;
  confirm_sent_at?: string | null;
  unsubscribe_reason?: string | null;
};
type Failure = { message: string } | null;

function fail(op: string, error: Failure | unknown): void {
  // Never log the row or token: they hold the subscriber's email.
  const message = error instanceof Error ? error.message : (error as Failure)?.message ?? "unknown";
  console.error("[newsletter] failed", TABLE, op, message);
}

function newToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Send the confirmation email. True only when Postmark accepted it; unset config or a failed
 * send leaves the row unstamped so the next signup retries immediately.
 */
async function sendConfirmation(email: string, token: string): Promise<boolean> {
  const { postmarkToken, fromEmail } = readNewsletterEnv();
  if (!postmarkToken || !fromEmail) return false;

  type Settings = { mailingAddress?: string | null; fromName?: string | null };
  let settings: Settings | null = null;
  try {
    settings = await sanityFetch<Settings | null>(SETTINGS_QUERY, {}, ["studioSettings"]);
  } catch {
    settings = null;
  }
  const { siteUrl } = publicEnv;
  const rendered = renderConfirmation({
    confirmUrl: `${siteUrl}/newsletter/confirm?token=${token}`,
    siteUrl,
    mailingAddress: settings?.mailingAddress?.trim() || null,
  });
  const result = await sendEmail(postmarkToken, {
    to: email,
    from: fromLine(settings?.fromName, fromEmail),
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    stream: "outbound",
    tag: "newsletter-confirm",
  });
  return result.ok;
}

/**
 * Send the confirmation and stamp `confirm_sent_at` once Postmark accepts it. The stamp is keyed
 * on the token hash, so a newer token issued meanwhile is never marked as sent.
 */
async function deliver(email: string, token: string, hash: string, now: Date): Promise<void> {
  if (!(await sendConfirmation(email, token))) return;
  const { error } = await createServiceClient()
    .from(TABLE)
    .update({ confirm_sent_at: now.toISOString() })
    .eq("confirm_token_hash", hash);
  if (error) fail("stamp", error);
}

/**
 * Double opt-in signup. Returns ok for every outcome so the form never reveals membership;
 * not ok only when the database fails.
 */
export async function subscribe(email: string, source: string, now: Date = new Date()): Promise<{ ok: boolean }> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from(TABLE)
      .select("id, status, confirm_sent_at, unsubscribe_reason")
      .eq("email", email)
      .maybeSingle();
    if (error) {
      fail("lookup", error);
      return { ok: false };
    }
    const row = data as Row | null;
    const { token, hash } = newToken();

    if (!row) {
      const { error: insertError } = await db
        .from(TABLE)
        .insert({ email, source, status: "pending", confirm_token_hash: hash });
      if (insertError) {
        // A concurrent signup won the unique index: the other request sends the email.
        if ((insertError as { code?: string }).code === "23505") return { ok: true };
        fail("insert", insertError);
        return { ok: false };
      }
      await deliver(email, token, hash, now);
      return { ok: true };
    }

    if (row.status === "confirmed") return { ok: true };
    // A spam complaint isn't undone by whoever types the address: same answer, nothing sent.
    if (row.status === "unsubscribed" && row.unsubscribe_reason === SPAM_COMPLAINT) return { ok: true };

    if (row.status === "pending" && row.confirm_sent_at) {
      const age = now.getTime() - new Date(row.confirm_sent_at).getTime();
      if (age < RESEND_THROTTLE_MINUTES * MINUTE_MS) return { ok: true };
    }

    const patch: Record<string, unknown> = { confirm_token_hash: hash, confirm_sent_at: null };
    if (row.status === "unsubscribed") {
      // unsubscribe_reason stays set so confirming knows to lift the Postmark suppression.
      patch.status = "pending";
      patch.unsubscribed_at = null;
    }
    const { error: updateError } = await db.from(TABLE).update(patch).eq("id", row.id);
    if (updateError) {
      fail("update", updateError);
      return { ok: false };
    }
    await deliver(email, token, hash, now);
    return { ok: true };
  } catch (e) {
    fail("subscribe", e);
    return { ok: false };
  }
}

/**
 * Lift the broadcast-stream suppression of a re-subscriber (R12). Best effort: skipped without
 * the Postmark env, and a failure never fails the confirm.
 */
async function liftSuppression(email: string | undefined): Promise<void> {
  const { postmarkToken, broadcastStream } = readNewsletterEnv();
  if (!email || !postmarkToken || !broadcastStream) return;
  await deleteSuppression(postmarkToken, broadcastStream, email);
}

/**
 * Confirm by token. A token whose email was never accepted by Postmark counts as expired. The
 * update is keyed on the token hash as well as the id, so a row that changed meanwhile (a newer
 * token, an unsubscribe) is left alone and the link reads as invalid.
 */
export async function confirmSubscription(
  token: string,
  now: Date = new Date(),
): Promise<"confirmed" | "expired" | "invalid"> {
  if (!token) return "invalid";
  try {
    const db = createServiceClient();
    const hash = hashToken(token);
    const { data, error } = await db
      .from(TABLE)
      .select("id, email, confirm_sent_at, unsubscribe_reason")
      .eq("confirm_token_hash", hash)
      .maybeSingle();
    if (error) {
      fail("confirm lookup", error);
      return "invalid";
    }
    const row = data as Row | null;
    if (!row) return "invalid";
    if (!row.confirm_sent_at || now.getTime() - new Date(row.confirm_sent_at).getTime() > CONFIRM_TTL_DAYS * DAY_MS) {
      return "expired";
    }
    const { data: updated, error: updateError } = await db
      .from(TABLE)
      .update({ status: "confirmed", confirmed_at: now.toISOString(), confirm_token_hash: null, unsubscribe_reason: null })
      .eq("id", row.id)
      .eq("confirm_token_hash", hash)
      .select("id");
    if (updateError) {
      fail("confirm update", updateError);
      return "invalid";
    }
    if (!Array.isArray(updated) || updated.length === 0) return "invalid";
    if (row.unsubscribe_reason) await liftSuppression(row.email);
    return "confirmed";
  } catch (e) {
    fail("confirm", e);
    return "invalid";
  }
}

/** Mark an address unsubscribed (Postmark suppression webhook). Unknown addresses are a no-op. */
export async function markUnsubscribed(email: string, reason: string, now: Date = new Date()): Promise<void> {
  const { error } = await createServiceClient()
    .from(TABLE)
    .update({
      status: "unsubscribed",
      unsubscribed_at: now.toISOString(),
      unsubscribe_reason: reason,
      confirm_token_hash: null,
    })
    .eq("email", email.trim().toLowerCase());
  if (error) throw new Error(error.message);
}
