import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv, readNewsletterEnv, type NewsletterEnv } from "@/lib/env";
import { renderIssue } from "@/lib/newsletter/email/render";
import { resolveIssue, type ImageConfig } from "@/lib/newsletter/issue";
import { listSuppressed, sendBatch, sendEmail } from "@/lib/newsletter/postmark";
import { createServiceClient } from "@/lib/supabase/server";
import { DbError, SENDS, BATCHES, fromLine, logFailure, note, runBatches, snapshotBatches } from "./batches";
import { getWriteClient, readIssueForSend, readSettings, type NewsletterSanity } from "./sanityServer";

/*
 * The send engine behind the Studio's newsletter buttons (spec §4). Each request is handled at
 * most once (claimed by inserting its id), each issue is broadcast at most once (claimed by
 * inserting its send row), and each batch is sent at most once (claimed by a conditional update).
 * Webhooks may arrive more than once and concurrently; every claim lives in the database.
 */

export type NewsletterRequest = {
  requestId: string;
  issueId: string;
  kind: "test" | "count" | "broadcast" | "resume";
  revision: string | null;
};

export type Deps = {
  now: () => Date;
  db: SupabaseClient;
  sanity: NewsletterSanity;
  postmark: { sendEmail: typeof sendEmail; sendBatch: typeof sendBatch; listSuppressed: typeof listSuppressed };
  env: NewsletterEnv;
  siteUrl: string;
  images: ImageConfig;
};

const REQUESTS = "studio_newsletter_requests";
const SIGNUPS = "studio_newsletter_signups";
const PAGE = 1000;
const ISSUE_ID = /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,127}$/;
const GENERIC_ERROR = "Something went wrong while handling the request. Check the server logs and try again.";
const NOT_RENDERABLE = "The issue needs a subject and at least one complete section before it can be sent.";

/** Fill in production dependencies for anything a caller (or test) didn't pass. */
function withDefaults(partial: Partial<Deps>): Deps {
  const env = partial.env ?? readNewsletterEnv();
  let sanity = partial.sanity;
  if (!sanity) {
    if (!env.sanityToken) throw new Error("SANITY_API_TOKEN is not set");
    sanity = getWriteClient(env.sanityToken);
  }
  return {
    now: partial.now ?? (() => new Date()),
    db: partial.db ?? createServiceClient(),
    sanity,
    postmark: partial.postmark ?? { sendEmail, sendBatch, listSuppressed },
    env,
    siteUrl: partial.siteUrl ?? publicEnv.siteUrl,
    images: partial.images ?? { projectId: publicEnv.sanityProjectId, dataset: publicEnv.sanityDataset },
  };
}

/**
 * Everyone who should get a broadcast: confirmed signups, each address once (case-insensitive),
 * minus the broadcast stream's suppressions when Postmark can list them (Postmark drops suppressed
 * addresses itself otherwise). Pages by id so no PostgREST row cap can truncate it.
 */
export async function audience(partial: Partial<Deps> = {}): Promise<string[]> {
  const db = partial.db ?? createServiceClient();
  const env = partial.env ?? readNewsletterEnv();
  const postmark = partial.postmark ?? { sendEmail, sendBatch, listSuppressed };
  const suppressed =
    env.postmarkToken && env.broadcastStream
      ? await postmark.listSuppressed(env.postmarkToken, env.broadcastStream)
      : null;

  const seen = new Set<string>();
  const out: string[] = [];
  let after: string | null = null;
  for (;;) {
    let q = db.from(SIGNUPS).select("id, email").eq("status", "confirmed");
    if (after) q = q.gt("id", after);
    const { data, error } = await q.order("id").limit(PAGE);
    if (error) throw new DbError(SIGNUPS, "select confirmed", error);
    const rows = (data ?? []) as { id: string; email: unknown }[];
    if (!rows.length) break;
    for (const row of rows) {
      const address = typeof row.email === "string" ? row.email.trim() : "";
      const key = address.toLowerCase();
      if (!address || seen.has(key) || suppressed?.has(key)) continue;
      seen.add(key);
      out.push(address);
    }
    after = rows[rows.length - 1].id;
  }
  return out;
}

function missingSetting(kind: NewsletterRequest["kind"], env: NewsletterEnv): string | null {
  if (!env.postmarkToken) return "POSTMARK_SERVER_TOKEN";
  if (!env.fromEmail) return "NEWSLETTER_FROM_EMAIL";
  if ((kind === "broadcast" || kind === "resume") && !env.broadcastStream) return "POSTMARK_BROADCAST_STREAM";
  if (kind === "test" && !env.testEmail) return "NEWSLETTER_TEST_EMAIL";
  return null;
}

/** Handle one Studio request. Never throws: failures are logged and shown on the delivery document. */
export async function handleRequest(req: NewsletterRequest, partial: Partial<Deps> = {}): Promise<void> {
  let deps: Deps;
  try {
    deps = withDefaults(partial);
  } catch (e) {
    logFailure(`${req.kind} setup`, e);
    return;
  }
  const { issueId } = req;
  // A published issue id only: a `drafts.`/`versions.` id would read unpublished content and
  // claim a second send row for the same issue.
  if (!ISSUE_ID.test(issueId) || /^(drafts|versions)\./.test(issueId)) {
    console.error("[newsletter] ignored request: invalid issue id", req.kind);
    return;
  }
  try {
    const claim = await deps.db
      .from(REQUESTS)
      .insert({ request_id: req.requestId, issue_id: issueId, kind: req.kind });
    if (claim.error?.code === "23505") return; // already handled: a webhook retry or replay
    if (claim.error) throw new DbError(REQUESTS, "insert", claim.error);

    const missing = missingSetting(req.kind, deps.env);
    if (missing) {
      await note(deps, issueId, { error: `${missing} is not set` });
      return;
    }
    if (req.kind === "count") await count(deps, issueId);
    else if (req.kind === "test") await sendTest(deps, issueId);
    else if (req.kind === "broadcast") await broadcast(deps, req);
    else if (req.kind === "resume") await resume(deps, issueId);
  } catch (e) {
    logFailure(req.kind, e);
    await note(deps, issueId, { error: GENERIC_ERROR });
  }
}

async function count(deps: Deps, issueId: string): Promise<void> {
  const list = await audience(deps);
  await note(deps, issueId, { audienceCount: list.length, countedAt: deps.now().toISOString() });
}

async function sendTest(deps: Deps, issueId: string): Promise<void> {
  const { raw, revision } = await readIssueForSend(deps.sanity, issueId, { draft: true });
  const issue = resolveIssue(raw, { siteUrl: deps.siteUrl, images: deps.images });
  if (!issue) {
    await note(deps, issueId, { error: NOT_RENDERABLE });
    return;
  }
  const settings = await readSettings(deps.sanity);
  const rendered = renderIssue(issue, {
    siteUrl: deps.siteUrl,
    mailingAddress: settings.mailingAddress ?? "",
    viewInBrowserUrl: null,
    unsubscribe: "note",
  });
  const audienceCount = await audience(deps).then(
    (list) => list.length,
    (e: unknown) => {
      logFailure("test audience", e);
      return undefined;
    },
  );
  const result = await deps.postmark.sendEmail(deps.env.postmarkToken ?? "", {
    to: deps.env.testEmail ?? "",
    from: fromLine(settings.fromName, deps.env.fromEmail ?? ""),
    subject: `[Test] ${rendered.subject}`,
    html: rendered.html,
    text: rendered.text,
    stream: "outbound",
    tag: "newsletter-test",
  });
  if (!result.ok) {
    console.error("[newsletter] test not sent", result.status);
    await note(deps, issueId, { error: `The test email didn't send (Postmark status ${result.status}).` });
    return;
  }
  await note(deps, issueId, {
    lastTest: { at: deps.now().toISOString(), revision },
    ...(audienceCount === undefined ? {} : { audienceCount }),
    error: null,
  });
}

async function broadcast(deps: Deps, req: NewsletterRequest): Promise<void> {
  const { issueId } = req;
  const refuse = (error: string) => note(deps, issueId, { error });

  const { raw, revision, hasDraft } = await readIssueForSend(deps.sanity, issueId, { draft: false });
  if (!revision) return refuse("Publish the issue before sending it.");
  if (hasDraft) return refuse("Publish your changes first: the issue has unpublished edits.");
  if (revision !== req.revision) return refuse("The issue changed after you confirmed. Check it and send again.");
  const settings = await readSettings(deps.sanity);
  if (!settings.mailingAddress) return refuse("Add the mailing address in Settings → Newsletter before sending.");
  const issue = resolveIssue(raw, { siteUrl: deps.siteUrl, images: deps.images });
  if (!issue) return refuse(NOT_RENDERABLE);

  // Rendered before the claim so the claim row holds exactly what was sent ("view in browser").
  const rendered = renderIssue(issue, {
    siteUrl: deps.siteUrl,
    mailingAddress: settings.mailingAddress,
    viewInBrowserUrl: `${deps.siteUrl.replace(/\/+$/, "")}/newsletter/issue/${issueId}`,
    unsubscribe: "placeholder",
  });
  const recipients = await audience(deps);
  if (!recipients.length) return refuse("There are no confirmed subscribers to send to yet.");

  const at = deps.now().toISOString();
  const claim = await deps.db.from(SENDS).insert({
    issue_id: issueId,
    request_id: req.requestId,
    status: "sending",
    subject: rendered.subject,
    html: rendered.html,
    text_body: rendered.text,
    started_at: at,
    updated_at: at,
  });
  if (claim.error?.code === "23505") return; // this issue is already being (or has been) sent
  if (claim.error) throw new DbError(SENDS, "insert", claim.error);

  await note(deps, issueId, { status: "sending", error: null });
  await snapshotBatches(deps, issueId, recipients);
  await runBatches(deps, issueId);
}

type SendState = {
  status: string;
  recipient_count: number | null;
  failed_count: number | null;
  uncertain_count: number | null;
  finished_at: string | null;
  error: string | null;
};

async function readSend(deps: Deps, issueId: string): Promise<SendState | null> {
  const res = await deps.db
    .from(SENDS)
    .select("status, recipient_count, failed_count, uncertain_count, finished_at, error")
    .eq("issue_id", issueId)
    .maybeSingle();
  if (res.error) throw new DbError(SENDS, "select", res.error);
  return res.data as SendState | null;
}

/**
 * Copy the send row (the source of truth) onto the delivery document. Resume on a send that can't
 * be reopened lands here, so a delivery status left wrong by a lost or late Sanity write is fixed.
 */
function mirror(deps: Deps, issueId: string, row: SendState): Promise<void> {
  return note(deps, issueId, {
    status: row.status,
    sentAt: row.finished_at,
    recipientCount: row.recipient_count,
    failedCount: row.failed_count,
    uncertainCount: row.uncertain_count,
    error: row.error,
  });
}

async function resume(deps: Deps, issueId: string): Promise<void> {
  const { db } = deps;
  const at = deps.now().toISOString();
  const row = await readSend(deps, issueId);
  if (!row) return; // never started: nothing to resume
  if (row.status !== "sending" && row.status !== "failed") return mirror(deps, issueId, row);

  // Written before reopening, so it can't land after a concurrent runner's final "sent".
  await note(deps, issueId, { status: "sending", error: null });
  const reopened = await db
    .from(SENDS)
    .update({ status: "sending", error: null, updated_at: at })
    .eq("issue_id", issueId)
    .in("status", ["sending", "failed"])
    .select("issue_id");
  if (reopened.error) throw new DbError(SENDS, "reopen", reopened.error);
  if (!reopened.data?.length) {
    // Finished meanwhile: show what the send row says, not our "sending".
    const now = await readSend(deps, issueId);
    if (now) await mirror(deps, issueId, now);
    return;
  }

  // A batch left in flight may or may not have reached Postmark: never send it again.
  const stale = await db
    .from(BATCHES)
    .update({ status: "uncertain", updated_at: at })
    .eq("issue_id", issueId)
    .eq("status", "in_flight");
  if (stale.error) throw new DbError(BATCHES, "update uncertain", stale.error);

  // The first run may have stopped between claiming the issue and storing its batches. With no
  // batches nobody has been sent anything, so snapshotting the audience now is safe.
  const any = await db.from(BATCHES).select("id").eq("issue_id", issueId).limit(1);
  if (any.error) throw new DbError(BATCHES, "select", any.error);
  if (!any.data?.length) await snapshotBatches(deps, issueId, await audience(deps));

  await runBatches(deps, issueId);
}
