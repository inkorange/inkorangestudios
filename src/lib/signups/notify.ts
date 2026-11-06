import "server-only";

export type OwnerMessage = { subject: string; replyTo: string; lines: string[] };

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
}

/**
 * Best-effort note to the owner about a submission. Read straight from
 * process.env (not readServerEnv) so a missing Supabase variable can never
 * silence it. A silent no-op unless all three Postmark settings are set, and a
 * mail failure NEVER propagates: the saved row is the record.
 */
export async function notifyOwner(msg: OwnerMessage): Promise<void> {
  const token = env("POSTMARK_SERVER_TOKEN");
  const from = env("FEEDBACK_FROM_EMAIL");
  const to = env("FEEDBACK_NOTIFY_EMAIL");
  if (!token || !from || !to) return;

  try {
    await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify({
        From: from,
        To: to,
        ReplyTo: msg.replyTo,
        Subject: `[inkOrange] ${msg.subject}`.slice(0, 180),
        TextBody: msg.lines.join("\n"),
        MessageStream: "outbound",
      }),
    });
  } catch {
    // The row is saved; the mail is a convenience.
  }
}
