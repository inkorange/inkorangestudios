import "server-only";

import { patchDelivery, readSettings } from "./sanityServer";
import type { Deps } from "./send";

/*
 * The broadcast batch runner. Every claim is a database statement, never memory: a batch moves
 * pending → in_flight only through a conditional update that returns the row, so two runners
 * (a retry, a resume) can never both send it. A batch that may have reached Postmark is never
 * sent again: it ends `sent` or `uncertain`.
 */

export const SENDS = "studio_newsletter_sends";
export const BATCHES = "studio_newsletter_send_batches";
export const BATCH_SIZE = 500;
const DEFAULT_FROM_NAME = "inkOrange Studios";

type Failure = { code?: string } | null;

/** A database failure. The message carries the table, the operation and the code, never row data. */
export class DbError extends Error {
  constructor(table: string, op: string, error: Failure) {
    super(`${table} ${op} failed (${error?.code ?? "unknown"})`);
    this.name = "DbError";
  }
}

/** Log without addresses, subjects or html: table names, operations and codes only. */
export function logFailure(where: string, e: unknown): void {
  // DbError messages are built here from codes; other errors come from code, never from row data.
  console.error("[newsletter] failed", where, e instanceof Error ? `${e.name}: ${e.message}` : "unknown");
}

/** Best-effort delivery write: the Studio display must never stop a send. */
export async function note(deps: Deps, issueId: string, fields: Record<string, unknown>): Promise<void> {
  try {
    await patchDelivery(deps.sanity, issueId, fields);
  } catch (e) {
    logFailure("studioNewsletterDelivery patch", e);
  }
}

export function fromLine(fromName: string | null, fromEmail: string): string {
  const name = fromName ?? DEFAULT_FROM_NAME;
  const safe = /[",<>@:;()[\]\\]/.test(name) ? `"${name.replace(/["\\]/g, "\\$&")}"` : name;
  return `${safe} <${fromEmail}>`;
}

/**
 * Store the audience as `pending` batches (seq 0…n) in one insert, so a send has all of its
 * batches or none. False when another runner already stored them.
 */
export async function snapshotBatches(deps: Deps, issueId: string, recipients: string[]): Promise<boolean> {
  const rows = [];
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    rows.push({ issue_id: issueId, seq: rows.length, recipients: recipients.slice(i, i + BATCH_SIZE) });
  }
  if (rows.length) {
    const { error } = await deps.db.from(BATCHES).insert(rows);
    if (error?.code === "23505") return false;
    if (error) throw new DbError(BATCHES, "insert", error);
  }
  const { error } = await deps.db
    .from(SENDS)
    .update({ recipient_count: recipients.length, updated_at: deps.now().toISOString() })
    .eq("issue_id", issueId);
  if (error) throw new DbError(SENDS, "update recipient_count", error);
  await note(deps, issueId, { recipientCount: recipients.length });
  return true;
}

type SendRow = { subject: string; html: string; text_body: string };
type BatchRow = { id: string; seq: number; recipients: string[]; status: string; failed_count: number };
type Stop = { kind: "uncertain"; count: number } | { kind: "rejected"; status: number } | null;

async function setBatch(deps: Deps, id: string, fields: Record<string, unknown>): Promise<void> {
  const { error } = await deps.db
    .from(BATCHES)
    .update({ ...fields, updated_at: deps.now().toISOString() })
    .eq("id", id)
    .eq("status", "in_flight");
  if (error) throw new DbError(BATCHES, `update ${String(fields.status)}`, error);
}

/**
 * Send every pending batch this runner can claim, in seq order, then finish the send if nothing
 * is left. A rejected batch (Postmark answered 4xx) goes back to pending and stops the run; a batch
 * that may have reached Postmark (status 0) becomes uncertain and stops the run, so an outage
 * leaves the rest pending for Resume instead of turning every batch uncertain.
 */
export async function runBatches(deps: Deps, issueId: string): Promise<void> {
  const { db, env, postmark } = deps;
  const sendRes = await db.from(SENDS).select("subject, html, text_body").eq("issue_id", issueId).maybeSingle();
  if (sendRes.error) throw new DbError(SENDS, "select", sendRes.error);
  const send = sendRes.data as SendRow | null;
  if (!send) return;

  const settings = await readSettings(deps.sanity);
  const from = fromLine(settings.fromName, env.fromEmail ?? "");
  const pendingRes = await db
    .from(BATCHES)
    .select("id, seq, recipients")
    .eq("issue_id", issueId)
    .eq("status", "pending")
    .order("seq");
  if (pendingRes.error) throw new DbError(BATCHES, "select pending", pendingRes.error);

  let stop: Stop = null;
  for (const batch of (pendingRes.data ?? []) as BatchRow[]) {
    const claim = await db
      .from(BATCHES)
      .update({ status: "in_flight", updated_at: deps.now().toISOString() })
      .eq("id", batch.id)
      .eq("status", "pending")
      .select("id");
    if (claim.error) throw new DbError(BATCHES, "claim", claim.error);
    if (!claim.data?.length) continue; // another runner has it

    const result = await postmark.sendBatch(
      env.postmarkToken ?? "",
      batch.recipients.map((to) => ({
        to,
        from,
        subject: send.subject,
        html: send.html,
        text: send.text_body,
        stream: env.broadcastStream ?? "",
        tag: `issue-${issueId}`,
      })),
    );
    if (result.ok) {
      await setBatch(deps, batch.id, {
        status: "sent",
        failed_count: result.results.filter((r) => r.errorCode !== 0).length,
      });
      continue;
    }
    if (result.status === 0) {
      await setBatch(deps, batch.id, { status: "uncertain" });
      stop = { kind: "uncertain", count: batch.recipients.length };
    } else {
      await setBatch(deps, batch.id, { status: "pending" });
      stop = { kind: "rejected", status: result.status };
    }
    console.error("[newsletter] batch not sent", BATCHES, batch.seq, result.status);
    break;
  }
  await finish(deps, issueId, stop);
}

/** Close the send when every batch is sent or uncertain; otherwise record why this run stopped. */
async function finish(deps: Deps, issueId: string, stop: Stop): Promise<void> {
  const { db } = deps;
  const res = await db.from(BATCHES).select("status, recipients, failed_count").eq("issue_id", issueId);
  if (res.error) throw new DbError(BATCHES, "select all", res.error);
  const all = (res.data ?? []) as BatchRow[];
  let recipientCount = 0;
  let failedCount = 0;
  let uncertainCount = 0;
  for (const b of all) {
    recipientCount += b.recipients.length;
    if (b.status === "sent") failedCount += b.failed_count;
    if (b.status === "uncertain") uncertainCount += b.recipients.length;
  }
  const at = deps.now().toISOString();

  if (all.every((b) => b.status === "sent" || b.status === "uncertain")) {
    const done = await db
      .from(SENDS)
      .update({
        status: "sent",
        finished_at: at,
        updated_at: at,
        recipient_count: recipientCount,
        failed_count: failedCount,
        uncertain_count: uncertainCount,
        error: null,
      })
      .eq("issue_id", issueId)
      .eq("status", "sending")
      .select("issue_id");
    if (done.error) throw new DbError(SENDS, "update sent", done.error);
    if (done.data?.length) {
      await note(deps, issueId, { status: "sent", sentAt: at, recipientCount, failedCount, uncertainCount, error: null });
    }
    return;
  }
  if (!stop) return; // batches still in flight belong to another runner, which finishes the send

  const error =
    stop.kind === "rejected"
      ? `Postmark rejected a batch (HTTP ${stop.status}). Nobody in it was sent the issue; Resume sending retries it.`
      : `Postmark didn't answer for one batch (${stop.count} recipients may or may not have it; they won't be sent it again). Resume sending sends the rest.`;
  const failed = await db
    .from(SENDS)
    .update({ status: "failed", error, updated_at: at, failed_count: failedCount, uncertain_count: uncertainCount })
    .eq("issue_id", issueId)
    .eq("status", "sending");
  if (failed.error) throw new DbError(SENDS, "update failed", failed.error);
  await note(deps, issueId, { status: "failed", error, failedCount, uncertainCount });
}
