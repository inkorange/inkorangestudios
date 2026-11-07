import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Op = {
  table: string;
  kind: "select" | "insert" | "update";
  values?: Record<string, unknown>;
  eq: [string, unknown][];
  columns?: string;
  returning?: string;
};
const ops: Op[] = [];
let existing: Record<string, unknown> | null = null;
let dbError: { code?: string; message: string } | null = null;
let updatedRows: { id: string }[] = [{ id: "1" }];

function builder(table: string) {
  const op: Op = { table, kind: "select", eq: [] };
  ops.push(op);
  const b: Record<string, unknown> = {
    select: (cols: string) => {
      if (op.kind === "update") op.returning = cols;
      else op.columns = cols;
      return b;
    },
    insert: (v: Record<string, unknown>) => {
      op.kind = "insert";
      op.values = v;
      return b;
    },
    update: (v: Record<string, unknown>) => {
      op.kind = "update";
      op.values = v;
      return b;
    },
    eq: (c: string, v: unknown) => {
      op.eq.push([c, v]);
      return b;
    },
    maybeSingle: async () => ({ data: existing, error: dbError }),
    then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
      Promise.resolve(
        op.kind === "update" && op.returning
          ? { data: dbError ? null : updatedRows, error: dbError }
          : { error: op.kind === "select" ? null : dbError },
      ).then(res, rej),
  };
  return b;
}
vi.mock("@/lib/supabase/server", () => ({ createServiceClient: () => ({ from: (t: string) => builder(t) }) }));

const sendEmail = vi.fn();
const deleteSuppression = vi.fn();
vi.mock("@/lib/newsletter/postmark", async (importOriginal) => ({
  fromLine: (await importOriginal<typeof import("./postmark")>()).fromLine,
  sendEmail: (...a: unknown[]) => sendEmail(...a),
  deleteSuppression: (...a: unknown[]) => deleteSuppression(...a),
}));

const sanityFetch = vi.fn();
vi.mock("@/lib/sanity/client", () => ({ sanityFetch: (...a: unknown[]) => sanityFetch(...a) }));

const env = vi.hoisted(() => ({
  postmarkToken: "pm" as string | undefined,
  fromEmail: "news@x.co" as string | undefined,
  broadcastStream: "broadcast" as string | undefined,
}));
vi.mock("@/lib/env", () => ({
  readNewsletterEnv: () => env,
  publicEnv: { siteUrl: "https://site.test" },
}));

import {
  CONFIRM_TTL_DAYS,
  RESEND_THROTTLE_MINUTES,
  confirmSubscription,
  markUnsubscribed,
  subscribe,
} from "./subscribers";

const NOW = new Date("2026-11-06T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const MIN = 60_000;
const DAY = 86_400_000;
const writes = (kind: Op["kind"]) => ops.filter((o) => o.kind === kind);
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

beforeEach(() => {
  vi.clearAllMocks();
  ops.length = 0;
  existing = null;
  dbError = null;
  updatedRows = [{ id: "1" }];
  env.postmarkToken = "pm";
  env.fromEmail = "news@x.co";
  env.broadcastStream = "broadcast";
  sendEmail.mockResolvedValue({ ok: true, messageId: "m" });
  deleteSuppression.mockResolvedValue(true);
  sanityFetch.mockResolvedValue({ mailingAddress: "1 Main St", fromName: "Ink Co" });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

it("exports the constants", () => {
  expect(CONFIRM_TTL_DAYS).toBe(7);
  expect(RESEND_THROTTLE_MINUTES).toBe(10);
});

describe("subscribe", () => {
  it("new address: inserts pending with a hash only, sends, then stamps confirm_sent_at", async () => {
    existing = null;
    expect(await subscribe("a@b.co", "footer", NOW)).toEqual({ ok: true });
    const [ins] = writes("insert");
    expect(ins.values).toMatchObject({ email: "a@b.co", source: "footer", status: "pending" });
    const hash = ins.values!.confirm_token_hash as string;
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [token, msg] = sendEmail.mock.calls[0];
    expect(token).toBe("pm");
    expect(msg).toMatchObject({ to: "a@b.co", stream: "outbound", from: "Ink Co <news@x.co>" });
    const url = /https:\/\/site\.test\/newsletter\/confirm\?token=([A-Za-z0-9_-]+)/.exec(msg.text)!;
    expect(url[1]).not.toBe(hash);
    expect(sha(url[1])).toBe(hash);
    expect(JSON.stringify(ins.values)).not.toContain(url[1]);
    const [upd] = writes("update");
    expect(upd.values).toEqual({ confirm_sent_at: NOW.toISOString() });
  });

  it("uses the default from name when settings are missing or unreadable", async () => {
    sanityFetch.mockRejectedValue(new Error("down"));
    expect(await subscribe("a@b.co", "footer", NOW)).toEqual({ ok: true });
    expect(sendEmail.mock.calls[0][1].from).toBe("inkOrange Studios <news@x.co>");
  });

  it("quotes a from name that contains a comma", async () => {
    sanityFetch.mockResolvedValue({ mailingAddress: null, fromName: "Ink, Co" });
    await subscribe("a@b.co", "footer", NOW);
    expect(sendEmail.mock.calls[0][1].from).toBe('"Ink, Co" <news@x.co>');
  });

  it("pending sent under 10 minutes ago: nothing", async () => {
    existing = { id: "1", status: "pending", confirm_sent_at: ago(9 * MIN) };
    expect(await subscribe("a@b.co", "footer", NOW)).toEqual({ ok: true });
    expect(writes("insert")).toHaveLength(0);
    expect(writes("update")).toHaveLength(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("pending older: rotates token, sends, stamps", async () => {
    existing = { id: "1", status: "pending", confirm_sent_at: ago(11 * MIN) };
    await subscribe("a@b.co", "footer", NOW);
    const [rot, stamp] = writes("update");
    expect(rot.values!.confirm_token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(rot.eq).toEqual([["id", "1"]]);
    expect(stamp.values).toEqual({ confirm_sent_at: NOW.toISOString() });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("pending never sent (null): resends immediately", async () => {
    existing = { id: "1", status: "pending", confirm_sent_at: null };
    await subscribe("a@b.co", "footer", NOW);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("confirmed: nothing", async () => {
    existing = { id: "1", status: "confirmed", confirm_sent_at: null };
    expect(await subscribe("a@b.co", "footer", NOW)).toEqual({ ok: true });
    expect(writes("insert")).toHaveLength(0);
    expect(writes("update")).toHaveLength(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("unsubscribed: back to pending with new token, clears unsubscribed_at, keeps the reason, sends", async () => {
    existing = { id: "1", status: "unsubscribed", confirm_sent_at: ago(30 * DAY), unsubscribe_reason: "ManualSuppression" };
    await subscribe("a@b.co", "footer", NOW);
    expect(ops[0].columns).toContain("unsubscribe_reason");
    const [back, stamp] = writes("update");
    expect(back.values).toMatchObject({ status: "pending", unsubscribed_at: null, confirm_sent_at: null });
    expect(back.values).not.toHaveProperty("unsubscribe_reason");
    expect(back.values!.confirm_token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(stamp.values).toEqual({ confirm_sent_at: NOW.toISOString() });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("unsubscribed by a spam complaint: same ok, but no email and no update", async () => {
    existing = { id: "1", status: "unsubscribed", confirm_sent_at: ago(30 * DAY), unsubscribe_reason: "SpamComplaint" };
    expect(await subscribe("a@b.co", "footer", NOW)).toEqual({ ok: true });
    expect(writes("update")).toHaveLength(0);
    expect(writes("insert")).toHaveLength(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("Postmark failure: ok, row left unstamped", async () => {
    sendEmail.mockResolvedValue({ ok: false, status: 500 });
    expect(await subscribe("a@b.co", "footer", NOW)).toEqual({ ok: true });
    expect(writes("insert")).toHaveLength(1);
    expect(writes("update")).toHaveLength(0);
  });

  it("missing Postmark config: skips sending, still ok", async () => {
    env.postmarkToken = undefined;
    expect(await subscribe("a@b.co", "footer", NOW)).toEqual({ ok: true });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(writes("update")).toHaveLength(0);
  });

  it("database failure: not ok, no email, address not logged", async () => {
    dbError = { message: "boom" };
    expect(await subscribe("a@b.co", "footer", NOW)).toEqual({ ok: false });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls)).not.toContain("a@b.co");
  });
});

describe("confirmSubscription", () => {
  it("looks up by hash and confirms, keyed on id and the same hash", async () => {
    existing = { id: "1", confirm_sent_at: ago(DAY), unsubscribe_reason: null };
    expect(await confirmSubscription("tok", NOW)).toBe("confirmed");
    const [sel] = ops;
    expect(sel.eq).toEqual([["confirm_token_hash", sha("tok")]]);
    const [upd] = writes("update");
    expect(upd.values).toEqual({
      status: "confirmed",
      confirmed_at: NOW.toISOString(),
      confirm_token_hash: null,
      unsubscribe_reason: null,
    });
    expect(upd.eq).toEqual([
      ["id", "1"],
      ["confirm_token_hash", sha("tok")],
    ]);
    expect(upd.returning).toBe("id");
    expect(deleteSuppression).not.toHaveBeenCalled();
  });
  it("the row changed underneath (0 rows updated): invalid, no suppression call", async () => {
    existing = { id: "1", confirm_sent_at: ago(DAY), unsubscribe_reason: "ManualSuppression" };
    updatedRows = [];
    expect(await confirmSubscription("tok", NOW)).toBe("invalid");
    expect(deleteSuppression).not.toHaveBeenCalled();
  });
  it("a previously unsubscribed address: removes its broadcast suppression after confirming", async () => {
    existing = { id: "1", email: "a@b.co", confirm_sent_at: ago(DAY), unsubscribe_reason: "ManualSuppression" };
    expect(await confirmSubscription("tok", NOW)).toBe("confirmed");
    expect(ops[0].columns).toContain("email");
    expect(ops[0].columns).toContain("unsubscribe_reason");
    expect(deleteSuppression).toHaveBeenCalledWith("pm", "broadcast", "a@b.co");
    const [upd] = writes("update");
    expect(upd.values).toMatchObject({ unsubscribe_reason: null });
  });
  it("still confirms when the suppression delete fails", async () => {
    existing = { id: "1", email: "a@b.co", confirm_sent_at: ago(DAY), unsubscribe_reason: "HardBounce" };
    deleteSuppression.mockResolvedValue(false);
    expect(await confirmSubscription("tok", NOW)).toBe("confirmed");
    expect(deleteSuppression).toHaveBeenCalledTimes(1);
  });
  it("skips the suppression delete when the Postmark env is missing", async () => {
    existing = { id: "1", email: "a@b.co", confirm_sent_at: ago(DAY), unsubscribe_reason: "HardBounce" };
    env.broadcastStream = undefined;
    expect(await confirmSubscription("tok", NOW)).toBe("confirmed");
    env.broadcastStream = "broadcast";
    env.postmarkToken = undefined;
    expect(await confirmSubscription("tok", NOW)).toBe("confirmed");
    expect(deleteSuppression).not.toHaveBeenCalled();
  });
  it("older than 7 days: expired, no update", async () => {
    existing = { id: "1", confirm_sent_at: ago(8 * DAY) };
    expect(await confirmSubscription("tok", NOW)).toBe("expired");
    expect(writes("update")).toHaveLength(0);
  });
  it("never sent: expired", async () => {
    existing = { id: "1", confirm_sent_at: null };
    expect(await confirmSubscription("tok", NOW)).toBe("expired");
  });
  it("unknown token or empty: invalid", async () => {
    existing = null;
    expect(await confirmSubscription("tok", NOW)).toBe("invalid");
    ops.length = 0;
    expect(await confirmSubscription("", NOW)).toBe("invalid");
    expect(ops).toHaveLength(0);
  });
  it("database error: invalid", async () => {
    dbError = { message: "x" };
    expect(await confirmSubscription("tok", NOW)).toBe("invalid");
  });
});

describe("markUnsubscribed", () => {
  it("sets status, timestamp and reason", async () => {
    await markUnsubscribed("A@B.co", "HardBounce", NOW);
    const [upd] = writes("update");
    expect(upd.values).toMatchObject({
      status: "unsubscribed",
      unsubscribed_at: NOW.toISOString(),
      unsubscribe_reason: "HardBounce",
    });
    expect(upd.eq).toEqual([["email", "a@b.co"]]);
  });
});
