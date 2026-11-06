import "server-only";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

export type StoreResult = { ok: true; isNew: boolean } | { ok: false };

function fail(table: string, message: string): StoreResult {
  // Never log the row: it holds the submitter's email.
  console.error("[signups] insert failed", table, message);
  return { ok: false };
}

/**
 * Insert a row, leaving an existing one (same `conflict` columns) untouched.
 * `isNew` is false for a duplicate, so callers can stay silent about it.
 */
export async function insertOnce(
  table: string,
  row: Record<string, unknown>,
  conflict: string,
): Promise<StoreResult> {
  try {
    const { data, error } = await createServiceClient()
      .from(table)
      .upsert(row, { onConflict: conflict, ignoreDuplicates: true })
      .select("id");
    if (error) return fail(table, error.message);
    return { ok: true, isNew: (data?.length ?? 0) > 0 };
  } catch (e) {
    return fail(table, e instanceof Error ? e.message : "unknown");
  }
}

/** Plain insert (no uniqueness): every contact message is kept. */
export async function insertAlways(table: string, row: Record<string, unknown>): Promise<StoreResult> {
  try {
    const { error } = await createServiceClient().from(table).insert(row);
    if (error) return fail(table, error.message);
    return { ok: true, isNew: true };
  } catch (e) {
    return fail(table, e instanceof Error ? e.message : "unknown");
  }
}

/** First entry of x-forwarded-for, or undefined. */
export async function remoteIp(): Promise<string | undefined> {
  const hdrs = await headers();
  return (hdrs.get("x-forwarded-for") ?? "").split(",")[0].trim() || undefined;
}
