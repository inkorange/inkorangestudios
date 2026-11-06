import type { NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";
import { UNSUBSCRIBE_PLACEHOLDER } from "@/lib/newsletter/email/render";
import { createServiceClient } from "@/lib/supabase/server";

const ISSUE_ID = /^[A-Za-z0-9._-]{1,128}$/;

const notFound = () => new Response("Not found", { status: 404, headers: { "x-robots-tag": "noindex" } });

/**
 * "View in browser" target: the exact html that was sent, minus Postmark's per-recipient
 * unsubscribe placeholder, which has no meaning outside an email (it points at the signup form).
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await ctx.params;
  if (!ISSUE_ID.test(issueId)) return notFound();

  const { data, error } = await createServiceClient()
    .from("studio_newsletter_sends")
    .select("html")
    .eq("issue_id", issueId)
    .eq("status", "sent")
    .maybeSingle();
  if (error || !data || typeof data.html !== "string") return notFound();

  const html = data.html.split(UNSUBSCRIBE_PLACEHOLDER).join(`${publicEnv.siteUrl}/#newsletter`);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
      "cache-control": "public, max-age=300",
    },
  });
}
