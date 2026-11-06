import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { readRevalidateSecret } from "@/lib/env";

type WebhookBody = { _type?: unknown };

/**
 * Sanity GROQ webhook: POST with the document as the body (projection `{_type, _id}` is enough).
 * The dataset is shared with the portfolio, so only `studio*` types revalidate; their tag is the
 * type name (see TAGS in src/lib/sanity/content.ts). `{ expire: 0 }` expires the data outright, so
 * the first visit after publishing waits for fresh content instead of being served the stale copy
 * ("max" would show the old version once more while revalidating in the background).
 */
export async function POST(req: NextRequest) {
  const secret = readRevalidateSecret();
  // Without a secret parseBody skips signature checks, so never run unconfigured.
  if (!secret) return Response.json({ message: "Revalidation is not configured" }, { status: 500 });

  let parsed: Awaited<ReturnType<typeof parseBody<WebhookBody>>>;
  try {
    parsed = await parseBody<WebhookBody>(req, secret);
  } catch {
    return Response.json({ message: "Invalid body" }, { status: 400 });
  }

  if (parsed.isValidSignature !== true) return Response.json({ message: "Invalid signature" }, { status: 401 });

  const type = parsed.body?._type;
  if (typeof type !== "string" || type === "") return Response.json({ message: "Missing _type" }, { status: 400 });
  if (!type.startsWith("studio")) return Response.json({ revalidated: false });

  revalidateTag(type, { expire: 0 });
  return Response.json({ revalidated: true, tag: type });
}
