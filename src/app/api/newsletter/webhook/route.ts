import { after, type NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { readNewsletterEnv } from "@/lib/env";
import { handleRequest, type NewsletterRequest } from "@/lib/newsletter/send";

export const maxDuration = 300;

const KINDS: readonly NewsletterRequest["kind"][] = ["test", "count", "broadcast", "resume"];
const ID_PREFIX = "newsletter.request.";

type WebhookBody = { _id?: unknown; issueId?: unknown; kind?: unknown; revision?: unknown };

/**
 * Sanity GROQ webhook fired when a `studioNewsletterRequest` document is created by a Studio
 * button. Authenticated by signature; the work runs after the 202 so Sanity is not kept waiting.
 */
export async function POST(req: NextRequest) {
  const secret = readNewsletterEnv().webhookSecret;
  // Without a secret parseBody skips signature checks, so never run unconfigured.
  if (!secret) return Response.json({ message: "Newsletter webhook is not configured" }, { status: 500 });

  let parsed: Awaited<ReturnType<typeof parseBody<WebhookBody>>>;
  try {
    parsed = await parseBody<WebhookBody>(req, secret);
  } catch {
    return Response.json({ message: "Invalid body" }, { status: 400 });
  }
  if (parsed.isValidSignature !== true) return Response.json({ message: "Invalid signature" }, { status: 401 });

  const body = parsed.body;
  const { _id, issueId, kind, revision } = body ?? {};
  if (
    typeof _id !== "string" ||
    !_id.startsWith(ID_PREFIX) ||
    typeof issueId !== "string" ||
    issueId === "" ||
    typeof kind !== "string" ||
    !KINDS.includes(kind as NewsletterRequest["kind"])
  ) {
    return Response.json({ message: "Invalid request document" }, { status: 400 });
  }

  const request: NewsletterRequest = {
    requestId: _id,
    issueId,
    kind: kind as NewsletterRequest["kind"],
    revision: typeof revision === "string" ? revision : null,
  };
  after(async () => {
    try {
      await handleRequest(request);
    } catch (error) {
      // Never log the request or the error message: they can carry addresses or content.
      console.error("Newsletter request failed", error instanceof Error ? error.name : "UnknownError");
    }
  });
  return Response.json({ accepted: true }, { status: 202 });
}
