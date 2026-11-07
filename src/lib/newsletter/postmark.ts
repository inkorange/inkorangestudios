import "server-only";

const BASE = "https://api.postmarkapp.com";
const TIMEOUT_MS = 15000;
const MAX_BATCH = 500;
const DEFAULT_FROM_NAME = "inkOrange Studios";

export type OutboundMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  stream: string;
  from: string;
  tag?: string;
  /** Where replies go; omitted from the request when unset. */
  replyTo?: string;
};

/**
 * The From header: the display name (default when missing or blank) and the verified address.
 * A name with RFC 5322 specials, such as a comma, is quoted so the header still parses.
 */
export function fromLine(fromName: string | null | undefined, fromEmail: string): string {
  const name = fromName?.trim() || DEFAULT_FROM_NAME;
  const safe = /[",<>@:;()[\]\\]/.test(name) ? `"${name.replace(/["\\]/g, "\\$&")}"` : name;
  return `${safe} <${fromEmail}>`;
}

function headers(token: string): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Postmark-Server-Token": token,
  };
}

function toPayload(m: OutboundMessage) {
  return {
    From: m.from,
    To: m.to,
    Subject: m.subject,
    HtmlBody: m.html,
    TextBody: m.text,
    MessageStream: m.stream,
    Tag: m.tag,
    ...(m.replyTo ? { ReplyTo: m.replyTo } : {}),
  };
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Send one message. Network errors and timeouts give status 0 (the call may
 * have reached Postmark); HTTP errors give their real status. Never logs
 * addresses or bodies.
 */
export async function sendEmail(
  token: string,
  msg: OutboundMessage,
): Promise<{ ok: true; messageId: string } | { ok: false; status: number; code?: number }> {
  try {
    const res = await fetch(`${BASE}/email`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(toPayload(msg)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await readJson(res)) as { ErrorCode?: unknown; MessageID?: unknown } | null;
    if (!res.ok) {
      const code = typeof body?.ErrorCode === "number" ? body.ErrorCode : undefined;
      return code === undefined ? { ok: false, status: res.status } : { ok: false, status: res.status, code };
    }
    return { ok: true, messageId: typeof body?.MessageID === "string" ? body.MessageID : "" };
  } catch {
    return { ok: false, status: 0 };
  }
}

/** Send up to 500 messages in one call; results are in request order. */
export async function sendBatch(
  token: string,
  msgs: OutboundMessage[],
): Promise<{ ok: true; results: { to: string; errorCode: number }[] } | { ok: false; status: number }> {
  if (msgs.length > MAX_BATCH) {
    throw new RangeError(`sendBatch accepts at most ${MAX_BATCH} messages`);
  }
  try {
    const res = await fetch(`${BASE}/email/batch`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(msgs.map(toPayload)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // The engine reads status 0 as "may have reached Postmark" (never re-sent)
    // and >= 400 as "rejected" (retried). A 5xx (e.g. a gateway timeout) may
    // have been processed upstream, so it is uncertain: only 4xx keep their status.
    if (res.status >= 500) return { ok: false, status: 0 };
    if (!res.ok) return { ok: false, status: res.status };
    const body = await readJson(res);
    // A 2xx with an unusable body was almost certainly accepted: uncertain, not rejected.
    if (!Array.isArray(body)) return { ok: false, status: 0 };
    return {
      ok: true,
      results: body.map((r: { To?: unknown; ErrorCode?: unknown }) => ({
        to: typeof r?.To === "string" ? r.To : "",
        errorCode: typeof r?.ErrorCode === "number" ? r.ErrorCode : -1,
      })),
    };
  } catch {
    return { ok: false, status: 0 };
  }
}

/** Lower-cased suppressed addresses for a stream, or null on any error. */
export async function listSuppressed(token: string, stream: string): Promise<Set<string> | null> {
  try {
    const res = await fetch(
      `${BASE}/message-streams/${encodeURIComponent(stream)}/suppressions/dump`,
      { method: "GET", headers: headers(token), signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    if (!res.ok) return null;
    const body = (await readJson(res)) as { Suppressions?: { EmailAddress?: unknown }[] } | null;
    if (!body || !Array.isArray(body.Suppressions)) return null;
    const out = new Set<string>();
    for (const s of body.Suppressions) {
      if (typeof s?.EmailAddress === "string") out.add(s.EmailAddress.toLowerCase());
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * Lift one address's suppression on a stream, so a re-subscriber gets broadcasts again. Best
 * effort: true only when Postmark reports it deleted; never throws; logs the status, never the
 * address. Postmark refuses to lift spam complaints, which the signup form never revives anyway.
 */
export async function deleteSuppression(token: string, stream: string, email: string): Promise<boolean> {
  let status = 0;
  try {
    const res = await fetch(`${BASE}/message-streams/${encodeURIComponent(stream)}/suppressions/delete`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ Suppressions: [{ EmailAddress: email }] }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    status = res.status;
    const body = (await readJson(res)) as { Suppressions?: { Status?: unknown }[] } | null;
    const result = Array.isArray(body?.Suppressions) ? body.Suppressions[0]?.Status : undefined;
    if (res.ok && result === "Deleted") return true;
    console.error("[newsletter] failed postmark suppression delete", status, typeof result === "string" ? result : "");
    return false;
  } catch {
    console.error("[newsletter] failed postmark suppression delete", status);
    return false;
  }
}
