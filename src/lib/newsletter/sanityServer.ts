import "server-only";

import { createClient, type SanityClient } from "next-sanity";
import { publicEnv } from "@/lib/env";
import { apiVersion } from "@/lib/sanity/client";
import { ISSUE_QUERY, SETTINGS_QUERY } from "./issue";

/** The parts of the Sanity client the newsletter uses; tests pass a fake. */
export type NewsletterSanity = Pick<SanityClient, "fetch" | "transaction">;

export type NewsletterSettings = { mailingAddress: string | null; fromName: string | null };

export const deliveryId = (issueId: string) => `newsletter.delivery.${issueId}`;

/**
 * Token-authenticated client for draft reads and delivery writes. No CDN and the raw perspective,
 * so `drafts.<id>` and `newsletter.*` documents are visible and every read is fresh.
 */
export function getWriteClient(token: string): SanityClient {
  if (!publicEnv.sanityProjectId) {
    throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set; cannot create the Sanity client.");
  }
  return createClient({
    projectId: publicEnv.sanityProjectId,
    dataset: publicEnv.sanityDataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: "raw",
  });
}

/*
 * One query per read, so the content and its revision come from the same snapshot: a publish
 * landing between two queries can't pair new content with the old revision.
 */
const READ_QUERY = /* groq */ `{
  "issue": ${ISSUE_QUERY},
  "revision": *[_type == "studioNewsletterIssue" && _id == $id][0]._rev,
  "hasDraft": count(*[_id == $draftId]) > 0
}`;

type ReadResult = { issue: unknown; revision: string | null; hasDraft: boolean } | null;

const NO_STORE = { cache: "no-store" } as const;

/**
 * The issue as the send engine sees it: the draft when `draft` is set and one exists, else the
 * published document. `revision` is that document's `_rev` ("" when there is no such document).
 */
export async function readIssueForSend(
  client: NewsletterSanity,
  issueId: string,
  opts: { draft: boolean },
): Promise<{ raw: unknown; revision: string; hasDraft: boolean }> {
  const draftId = `drafts.${issueId}`;
  if (opts.draft) {
    const d = await client.fetch<ReadResult>(READ_QUERY, { id: draftId, draftId }, NO_STORE);
    if (d?.revision) return { raw: d.issue, revision: d.revision, hasDraft: true };
  }
  const p = await client.fetch<ReadResult>(READ_QUERY, { id: issueId, draftId }, NO_STORE);
  return { raw: p?.issue ?? null, revision: p?.revision ?? "", hasDraft: Boolean(p?.hasDraft) };
}

/** Published newsletter settings (blank values become null). */
export async function readSettings(client: NewsletterSanity): Promise<NewsletterSettings> {
  const s = await client.fetch<{ mailingAddress?: unknown; fromName?: unknown } | null>(
    SETTINGS_QUERY,
    {},
    NO_STORE,
  );
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return { mailingAddress: text(s?.mailingAddress), fromName: text(s?.fromName) };
}

/**
 * Write delivery fields for an issue, creating its delivery document on first use. A `null`
 * value clears the field. Never touches the issue document itself.
 */
export async function patchDelivery(
  client: NewsletterSanity,
  issueId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const _id = deliveryId(issueId);
  const set: Record<string, unknown> = {};
  const unset: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) unset.push(key);
    else set[key] = value;
  }
  await client
    .transaction()
    .createIfNotExists({ _id, _type: "studioNewsletterDelivery", status: "idle" })
    .patch(_id, { ...(Object.keys(set).length ? { set } : {}), ...(unset.length ? { unset } : {}) })
    .commit();
}
