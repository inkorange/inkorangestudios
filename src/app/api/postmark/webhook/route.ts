import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { readNewsletterEnv } from "@/lib/env";
import { markUnsubscribed } from "@/lib/newsletter/subscribers";

type SubscriptionChange = {
  RecordType?: unknown;
  Recipient?: unknown;
  SuppressSending?: unknown;
  SuppressionReason?: unknown;
};

/** Hash both sides so the buffers are equal length, then compare in constant time. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function authorized(header: string | null, user: string, password: string): boolean {
  if (!header?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const colon = decoded.indexOf(":");
  if (colon < 0) return false;
  // Evaluate both so timing does not reveal which half was wrong.
  const userOk = safeEqual(decoded.slice(0, colon), user);
  const passOk = safeEqual(decoded.slice(colon + 1), password);
  return userOk && passOk;
}

/**
 * Postmark Subscription Change webhook (basic auth). A suppression marks the subscriber
 * unsubscribed; reactivations and other record types are acknowledged and ignored. Postmark
 * retries non-2xx responses, so once authenticated only a failed database write is non-2xx.
 */
export async function POST(req: NextRequest) {
  const { postmarkWebhookUser: user, postmarkWebhookPassword: password } = readNewsletterEnv();
  if (!user || !password) return Response.json({ message: "Postmark webhook is not configured" }, { status: 500 });
  if (!authorized(req.headers.get("authorization"), user, password)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: SubscriptionChange;
  try {
    const json: unknown = await req.json();
    if (typeof json !== "object" || json === null || Array.isArray(json)) throw new Error("not an object");
    body = json as SubscriptionChange;
  } catch {
    return Response.json({ message: "Invalid body" }, { status: 400 });
  }

  if (body.RecordType !== "SubscriptionChange" || body.SuppressSending !== true) return Response.json({ ok: true });
  if (typeof body.Recipient !== "string" || body.Recipient === "") return Response.json({ ok: true });

  const reason = typeof body.SuppressionReason === "string" ? body.SuppressionReason : "Unknown";
  try {
    await markUnsubscribed(body.Recipient.toLowerCase(), reason);
  } catch {
    // Not logged with details: the error may carry the address.
    console.error("Postmark webhook: could not record unsubscribe");
    return Response.json({ message: "Could not record the change" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
