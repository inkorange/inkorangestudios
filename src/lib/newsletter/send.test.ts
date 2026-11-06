import { evaluate, parse } from "groq-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NewsletterEnv } from "@/lib/env";
import type { NewsletterSanity } from "./sanityServer";
import { audience, handleRequest, type Deps, type NewsletterRequest } from "./send";

/* ---------------------------------------------------------------------------------------------
 * Fakes. Each database statement runs atomically after a macrotask yield, so concurrent
 * `Promise.all` callers interleave between statements exactly as they would against Postgres.
 * Unique constraints mirror 0002_newsletter.sql; selects are capped at 1000 rows like PostgREST.
 * ------------------------------------------------------------------------------------------- */

type Row = Record<string, unknown>;
type DbError = { code: string; message: string };
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

const SIGNUPS = "studio_newsletter_signups";
const REQUESTS = "studio_newsletter_requests";
const SENDS = "studio_newsletter_sends";
const BATCHES = "studio_newsletter_send_batches";
const UNIQUE: Record<string, string[][]> = {
  [SIGNUPS]: [["id"], ["email"]],
  [REQUESTS]: [["request_id"]],
  [SENDS]: [["issue_id"]],
  [BATCHES]: [["id"], ["issue_id", "seq"]],
};
const MAX_ROWS = 1000;

function fakeDb() {
  const tables: Record<string, Row[]> = { [SIGNUPS]: [], [REQUESTS]: [], [SENDS]: [], [BATCHES]: [] };
  let ids = 0;
  let fail: ((table: string, op: string) => DbError | null) | null = null;

  const defaults = (table: string): Row => {
    if (table === BATCHES) return { id: `batch-${String(ids++).padStart(4, "0")}`, status: "pending", failed_count: 0 };
    if (table === SENDS) return { failed_count: 0, uncertain_count: 0, recipient_count: null, error: null };
    return {};
  };

  function from(table: string) {
    let op: "select" | "insert" | "update" = "select";
    let values: Row | Row[] = {};
    let returning = false;
    let single = false;
    let orderBy: string | null = null;
    let limit: number | null = null;
    const filters: ((r: Row) => boolean)[] = [];

    const run = () => {
      const injected = fail?.(table, op);
      if (injected) return { data: null, error: injected };
      const rows = tables[table];
      if (op === "insert") {
        const list = (Array.isArray(values) ? values : [values]).map((v) => ({ ...defaults(table), ...structuredClone(v) }));
        for (const cols of UNIQUE[table] ?? []) {
          const key = (r: Row) => cols.map((c) => String(r[c])).join("|");
          const seen = new Set(rows.map(key));
          for (const r of list) {
            if (seen.has(key(r))) return { data: null, error: { code: "23505", message: "duplicate key value" } };
            seen.add(key(r));
          }
        }
        rows.push(...list);
        return { data: returning ? structuredClone(list) : null, error: null };
      }
      const matched = rows.filter((r) => filters.every((f) => f(r)));
      if (op === "update") {
        for (const r of matched) Object.assign(r, structuredClone(values));
        return { data: returning ? structuredClone(matched) : null, error: null };
      }
      let out = [...matched];
      if (orderBy) {
        const col = orderBy;
        out.sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : String(a[col]) > String(b[col]) ? 1 : 0));
        if (col === "seq") out.sort((a, b) => Number(a.seq) - Number(b.seq));
      }
      out = out.slice(0, Math.min(limit ?? MAX_ROWS, MAX_ROWS));
      if (single) return { data: out[0] ? structuredClone(out[0]) : null, error: null };
      return { data: structuredClone(out), error: null };
    };

    const q = {
      select: () => {
        if (op !== "select") returning = true;
        return q;
      },
      insert: (v: Row | Row[]) => {
        op = "insert";
        values = v;
        return q;
      },
      update: (v: Row) => {
        op = "update";
        values = v;
        return q;
      },
      eq: (c: string, v: unknown) => {
        filters.push((r) => r[c] === v);
        return q;
      },
      in: (c: string, vs: unknown[]) => {
        filters.push((r) => vs.includes(r[c]));
        return q;
      },
      gt: (c: string, v: unknown) => {
        filters.push((r) => String(r[c]) > String(v));
        return q;
      },
      order: (c: string) => {
        orderBy = c;
        return q;
      },
      limit: (n: number) => {
        limit = n;
        return q;
      },
      maybeSingle: () => {
        single = true;
        return q;
      },
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => tick().then(run).then(res, rej),
    };
    return q;
  }

  return {
    tables,
    client: { from } as unknown as SupabaseClient,
    failWhen(fn: (table: string, op: string) => DbError | null) {
      fail = fn;
    },
  };
}

function fakeSanity(docs: Row[]) {
  const client = {
    fetch: async (query: string, params: Record<string, unknown> = {}) => {
      await tick();
      const value = await evaluate(parse(query), { dataset: structuredClone(docs), params });
      return value.get();
    },
    transaction: () => {
      const ops: (() => void)[] = [];
      const t = {
        createIfNotExists: (doc: Row) => {
          ops.push(() => {
            if (!docs.some((d) => d._id === doc._id)) docs.push(structuredClone(doc));
          });
          return t;
        },
        patch: (id: string, p: { set?: Row; unset?: string[] }) => {
          ops.push(() => {
            const doc = docs.find((d) => d._id === id);
            if (!doc) throw new Error("patch on missing document");
            Object.assign(doc, structuredClone(p.set ?? {}));
            for (const k of p.unset ?? []) delete doc[k];
          });
          return t;
        },
        commit: async () => {
          await tick();
          for (const op of ops) op();
        },
      };
      return t;
    },
  };
  return client as unknown as NewsletterSanity;
}

/* --------------------------------------------------------------------------------------------- */

const NOW = new Date("2026-11-06T12:00:00Z");
const SITE = "https://site.test";
const ENV: NewsletterEnv = {
  postmarkToken: "pm-token",
  fromEmail: "news@ink.test",
  testEmail: "chris@ink.test",
  broadcastStream: "newsletter",
  sanityToken: "sk",
};
const issueDoc = (over: Row = {}): Row => ({
  _id: "i1",
  _type: "studioNewsletterIssue",
  _rev: "rev1",
  subject: "Hello",
  sections: [{ _type: "freeSection", _key: "a", title: "News", body: [] }],
  ...over,
});
const settingsDoc = (newsletter: Row = { mailingAddress: "1 Main St", fromName: "Ink Co" }): Row => ({
  _id: "studioSettings",
  _type: "studioSettings",
  newsletter,
});

let db: ReturnType<typeof fakeDb>;
let docs: Row[];
let sanity: NewsletterSanity;
let sendEmail: ReturnType<typeof vi.fn>;
let sendBatch: ReturnType<typeof vi.fn>;
let listSuppressed: ReturnType<typeof vi.fn>;
let logs: unknown[][];
let n = 0;

const okBatch = async (_token: string, msgs: { to: string }[]) => {
  await tick();
  return { ok: true as const, results: msgs.map((m) => ({ to: m.to, errorCode: 0 })) };
};

function deps(over: Partial<Deps> = {}): Partial<Deps> {
  return {
    now: () => NOW,
    db: db.client,
    sanity,
    postmark: { sendEmail, sendBatch, listSuppressed } as unknown as Deps["postmark"],
    env: { ...ENV },
    siteUrl: SITE,
    images: { projectId: "proj", dataset: "prod" },
    ...over,
  };
}

const req = (kind: NewsletterRequest["kind"], over: Partial<NewsletterRequest> = {}): NewsletterRequest => ({
  requestId: `newsletter.request.r${n++}`,
  issueId: "i1",
  kind,
  revision: "rev1",
  ...over,
});

const email = (i: number) => `user${i}@sub.test`;
function subscribe(count: number, status = "confirmed", start = 0) {
  for (let i = start; i < start + count; i++) {
    db.tables[SIGNUPS].push({ id: `sig-${String(i).padStart(6, "0")}`, email: email(i), status });
  }
}

const delivery = () => docs.find((d) => d._id === "newsletter.delivery.i1");
const batches = () => [...db.tables[BATCHES]].sort((a, b) => Number(a.seq) - Number(b.seq));
const sentTo = () =>
  sendBatch.mock.calls.flatMap(([, msgs]) => (msgs as { to: string }[]).map((m) => m.to));

beforeEach(() => {
  db = fakeDb();
  docs = [issueDoc(), settingsDoc()];
  sanity = fakeSanity(docs);
  sendEmail = vi.fn(async () => ({ ok: true, messageId: "m1" }));
  sendBatch = vi.fn(okBatch);
  listSuppressed = vi.fn(async () => new Set<string>());
  logs = [];
  for (const level of ["log", "info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      logs.push(args);
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  // Nothing the engine logs may carry an address, subject or html.
  const text = JSON.stringify(logs);
  expect(text).not.toMatch(/@sub\.test|@ink\.test|Hello|<html/i);
});

describe("request claims", () => {
  it("handles one request id once, even when delivered concurrently", async () => {
    subscribe(2);
    const r = req("test");
    await Promise.all([handleRequest(r, deps()), handleRequest(r, deps()), handleRequest(r, deps())]);
    await handleRequest(r, deps());
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(db.tables[REQUESTS]).toEqual([{ request_id: r.requestId, issue_id: "i1", kind: "test" }]);
  });

  it.each(["drafts.i1", "versions.r1.i1", "", "a/b"])("ignores the issue id %j (a draft id would claim a second send)", async (issueId) => {
    docs.push(issueDoc({ _id: "drafts.i1", _rev: "d1" }));
    subscribe(2);
    await handleRequest(req("broadcast", { issueId, revision: "d1" }), deps());
    await handleRequest(req("test", { issueId }), deps());
    expect(db.tables[REQUESTS]).toHaveLength(0);
    expect(db.tables[SENDS]).toHaveLength(0);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendBatch).not.toHaveBeenCalled();
  });

  it("does nothing more when the request claim fails for another reason", async () => {
    db.failWhen((t, op) => (t === REQUESTS && op === "insert" ? { code: "08006", message: "lost user1@sub.test" } : null));
    await handleRequest(req("test"), deps());
    expect(sendEmail).not.toHaveBeenCalled();
    expect(delivery()?.error).toMatch(/went wrong/i);
  });
});

describe("settings", () => {
  it.each([
    ["broadcast", { broadcastStream: undefined }, "POSTMARK_BROADCAST_STREAM is not set"],
    ["resume", { broadcastStream: undefined }, "POSTMARK_BROADCAST_STREAM is not set"],
    ["broadcast", { postmarkToken: undefined }, "POSTMARK_SERVER_TOKEN is not set"],
    ["broadcast", { fromEmail: undefined }, "NEWSLETTER_FROM_EMAIL is not set"],
    ["test", { testEmail: undefined }, "NEWSLETTER_TEST_EMAIL is not set"],
    ["test", { postmarkToken: undefined }, "POSTMARK_SERVER_TOKEN is not set"],
    ["count", { postmarkToken: undefined }, "POSTMARK_SERVER_TOKEN is not set"],
  ] as const)("%s with %o writes the error and sends nothing", async (kind, missing, error) => {
    subscribe(3);
    await handleRequest(req(kind), deps({ env: { ...ENV, ...missing } }));
    expect(delivery()).toMatchObject({ _type: "studioNewsletterDelivery", status: "idle", error });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendBatch).not.toHaveBeenCalled();
    expect(db.tables[SENDS]).toHaveLength(0);
  });

  it("a test send does not need the broadcast stream", async () => {
    await handleRequest(req("test"), deps({ env: { ...ENV, broadcastStream: undefined } }));
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});

describe("audience", () => {
  it("is every confirmed address once, minus the stream's suppressions", async () => {
    subscribe(3);
    subscribe(2, "pending", 10);
    subscribe(2, "unsubscribed", 20);
    db.tables[SIGNUPS].push({ id: "sig-900000", email: "User1@SUB.test", status: "confirmed" });
    db.tables[SIGNUPS].push({ id: "sig-900001", email: "Gone@Sub.test", status: "confirmed" });
    listSuppressed.mockResolvedValue(new Set(["gone@sub.test"]));
    const list = await audience(deps());
    expect(list.sort()).toEqual([email(0), email(1), email(2)].sort());
    expect(listSuppressed).toHaveBeenCalledWith("pm-token", "newsletter");
  });

  it("pages past the 1000-row cap", async () => {
    subscribe(2345);
    expect(new Set(await audience(deps())).size).toBe(2345);
  });

  it("proceeds without suppressions when Postmark can't list them", async () => {
    subscribe(2);
    listSuppressed.mockResolvedValue(null);
    expect(await audience(deps())).toHaveLength(2);
  });
});

describe("count", () => {
  it("writes the audience count and never touches status", async () => {
    docs.push({ _id: "newsletter.delivery.i1", _type: "studioNewsletterDelivery", status: "sent" });
    subscribe(4);
    subscribe(1, "pending", 50);
    await handleRequest(req("count"), deps());
    expect(delivery()).toMatchObject({ status: "sent", audienceCount: 4, countedAt: NOW.toISOString() });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendBatch).not.toHaveBeenCalled();
  });
});

describe("test send", () => {
  it("renders the draft when one exists and sends it only to the test address", async () => {
    docs.push(issueDoc({ _id: "drafts.i1", _rev: "draft-rev", subject: "Draft subject" }));
    docs.push({ _id: "newsletter.delivery.i1", _type: "studioNewsletterDelivery", status: "idle", error: "old" });
    subscribe(3);
    await handleRequest(req("test"), deps());

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [token, msg] = sendEmail.mock.calls[0];
    expect(token).toBe("pm-token");
    expect(msg).toMatchObject({
      to: "chris@ink.test",
      from: "Ink Co <news@ink.test>",
      subject: "[Test] Draft subject",
      stream: "outbound",
    });
    expect(msg.html).toContain("(Unsubscribe link appears here)");
    expect(msg.html).not.toContain("{{{pm:unsubscribe}}}");
    expect(sendBatch).not.toHaveBeenCalled();
    const d = delivery()!;
    expect(d).toMatchObject({ status: "idle", lastTest: { at: NOW.toISOString(), revision: "draft-rev" }, audienceCount: 3 });
    expect(d.error).toBeUndefined();
  });

  it("falls back to the published issue", async () => {
    await handleRequest(req("test"), deps());
    expect(sendEmail.mock.calls[0][1].subject).toBe("[Test] Hello");
    expect(delivery()?.lastTest).toEqual({ at: NOW.toISOString(), revision: "rev1" });
  });

  it("uses the default from name when Settings has none", async () => {
    docs.splice(docs.findIndex((d) => d._id === "studioSettings"), 1);
    await handleRequest(req("test"), deps());
    expect(sendEmail.mock.calls[0][1].from).toBe("inkOrange Studios <news@ink.test>");
  });

  it("keeps the last audience count when counting fails", async () => {
    docs.push({ _id: "newsletter.delivery.i1", _type: "studioNewsletterDelivery", status: "idle", audienceCount: 9 });
    db.failWhen((t) => (t === SIGNUPS ? { code: "08006", message: "lost" } : null));
    await handleRequest(req("test"), deps());
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(delivery()).toMatchObject({ audienceCount: 9, lastTest: { revision: "rev1" } });
  });

  it("reports a Postmark failure", async () => {
    sendEmail.mockResolvedValue({ ok: false, status: 422 });
    await handleRequest(req("test"), deps());
    expect(delivery()?.error).toMatch(/422/);
    expect(delivery()?.lastTest).toBeUndefined();
  });
});

describe("broadcast", () => {
  it.each([
    ["the issue has unpublished changes", () => docs.push(issueDoc({ _id: "drafts.i1", _rev: "d1" })), /publish your changes/i],
    ["the revision differs", () => Object.assign(docs[0], { _rev: "rev2" }), /changed/i],
    ["the request carries no revision", () => Object.assign(docs[0], { _rev: "rev1" }), /changed/i, null],
    ["there is no mailing address", () => (docs[1] = settingsDoc({ fromName: "Ink Co" })), /mailing address/i],
    ["the issue isn't published", () => docs.splice(0, 1), /publish/i],
    ["the issue has nothing to send", () => Object.assign(docs[0], { sections: [] }), /section/i],
  ])("is refused when %s", async (_why, setup, error, revision: string | null = "rev1") => {
    subscribe(3);
    setup();
    await handleRequest(req("broadcast", { revision }), deps());
    expect(delivery()?.error).toMatch(error);
    expect(delivery()?.status).toBe("idle");
    expect(db.tables[SENDS]).toHaveLength(0);
    expect(db.tables[BATCHES]).toHaveLength(0);
    expect(sendBatch).not.toHaveBeenCalled();
  });

  it("is refused with no confirmed subscribers, leaving the issue sendable", async () => {
    subscribe(2, "pending");
    await handleRequest(req("broadcast"), deps());
    expect(delivery()?.error).toMatch(/no confirmed subscribers/i);
    expect(db.tables[SENDS]).toHaveLength(0);
  });

  it("splits 1,201 confirmed minus 1 suppressed into 500/500/200 and sends each once", async () => {
    subscribe(1201);
    subscribe(5, "pending", 5000);
    subscribe(5, "unsubscribed", 6000);
    listSuppressed.mockResolvedValue(new Set([email(7)]));
    await handleRequest(req("broadcast"), deps());

    expect(batches().map((b) => [b.seq, (b.recipients as string[]).length, b.status])).toEqual([
      [0, 500, "sent"],
      [1, 500, "sent"],
      [2, 200, "sent"],
    ]);
    expect(sendBatch).toHaveBeenCalledTimes(3);
    const to = sentTo();
    expect(to).toHaveLength(1200);
    expect(new Set(to).size).toBe(1200);
    expect(to).not.toContain(email(7));
    expect(to.some((a) => /^user5\d{3}@/.test(a))).toBe(false);

    const [token, msgs] = sendBatch.mock.calls[0];
    expect(token).toBe("pm-token");
    expect(msgs[0]).toMatchObject({
      from: "Ink Co <news@ink.test>",
      subject: "Hello",
      stream: "newsletter",
      tag: "issue-i1",
    });
    expect(msgs[0].to).not.toContain(",");
    expect(msgs[0].html).toContain("{{{pm:unsubscribe}}}");
    expect(msgs[0].html).toContain(`${SITE}/newsletter/issue/i1`);

    const [send] = db.tables[SENDS];
    expect(send).toMatchObject({
      issue_id: "i1",
      status: "sent",
      subject: "Hello",
      html: msgs[0].html,
      text_body: msgs[0].text,
      recipient_count: 1200,
      failed_count: 0,
      uncertain_count: 0,
      finished_at: NOW.toISOString(),
    });
    expect(delivery()).toMatchObject({
      status: "sent",
      sentAt: NOW.toISOString(),
      recipientCount: 1200,
      failedCount: 0,
      uncertainCount: 0,
    });
  });

  it("claims the issue once when two broadcast requests race", async () => {
    subscribe(600);
    await Promise.all([handleRequest(req("broadcast"), deps()), handleRequest(req("broadcast"), deps())]);
    expect(db.tables[SENDS]).toHaveLength(1);
    expect(batches()).toHaveLength(2);
    expect(sendBatch).toHaveBeenCalledTimes(2);
    expect(new Set(sentTo()).size).toBe(600);
    expect(sentTo()).toHaveLength(600);
    // A later broadcast for the same issue is a no-op too.
    await handleRequest(req("broadcast"), deps());
    expect(sendBatch).toHaveBeenCalledTimes(2);
    expect(delivery()?.status).toBe("sent");
  });

  it("sums Postmark's per-message error codes into failedCount", async () => {
    subscribe(700);
    sendBatch.mockImplementation(async (_t: string, msgs: { to: string }[]) => ({
      ok: true,
      results: msgs.map((m, i) => ({ to: m.to, errorCode: i < (msgs.length === 500 ? 2 : 1) ? 406 : 0 })),
    }));
    await handleRequest(req("broadcast"), deps());
    expect(batches().map((b) => b.failed_count)).toEqual([2, 1]);
    expect(db.tables[SENDS][0]).toMatchObject({ status: "sent", failed_count: 3 });
    expect(delivery()).toMatchObject({ status: "sent", failedCount: 3, recipientCount: 700 });
  });

  it("marks a batch uncertain on a network error, never re-sends it, and resume sends the rest", async () => {
    subscribe(1100);
    sendBatch.mockImplementationOnce(okBatch).mockImplementationOnce(async () => ({ ok: false, status: 0 }));
    await handleRequest(req("broadcast"), deps());

    expect(batches().map((b) => b.status)).toEqual(["sent", "uncertain", "pending"]);
    expect(sendBatch).toHaveBeenCalledTimes(2);
    expect(db.tables[SENDS][0].status).toBe("failed");
    expect(delivery()).toMatchObject({ status: "failed" });
    expect(delivery()?.error).toMatch(/resume/i);
    const uncertain = batches()[1].recipients as string[];

    await handleRequest(req("resume", { revision: null }), deps());
    expect(sendBatch).toHaveBeenCalledTimes(3);
    expect(sendBatch.mock.calls[2][1].map((m: { to: string }) => m.to)).toEqual(batches()[2].recipients);
    expect(sentTo().filter((a) => uncertain.includes(a))).toHaveLength(500); // only the first, uncertain attempt
    expect(batches().map((b) => b.status)).toEqual(["sent", "uncertain", "sent"]);
    expect(delivery()).toMatchObject({ status: "sent", recipientCount: 1100, uncertainCount: 500, failedCount: 0 });
    expect(delivery()?.error).toBeUndefined();
  });

  it("finishes as sent when only the last batch is uncertain", async () => {
    subscribe(600);
    sendBatch.mockImplementationOnce(okBatch).mockImplementationOnce(async () => ({ ok: false, status: 0 }));
    await handleRequest(req("broadcast"), deps());
    expect(batches().map((b) => b.status)).toEqual(["sent", "uncertain"]);
    expect(delivery()).toMatchObject({ status: "sent", recipientCount: 600, uncertainCount: 100 });
  });

  it("puts a rejected (422) batch back to pending, fails the send, and resume retries it", async () => {
    subscribe(600);
    sendBatch.mockImplementationOnce(async () => ({ ok: false, status: 422 }));
    await handleRequest(req("broadcast"), deps());

    expect(sendBatch).toHaveBeenCalledTimes(1);
    expect(batches().map((b) => b.status)).toEqual(["pending", "pending"]);
    expect(db.tables[SENDS][0]).toMatchObject({ status: "failed" });
    expect(db.tables[SENDS][0].error).toMatch(/422/);
    expect(delivery()).toMatchObject({ status: "failed" });
    expect(delivery()?.error).toMatch(/422/);

    await handleRequest(req("resume", { revision: null }), deps());
    expect(sendBatch).toHaveBeenCalledTimes(3);
    expect(batches().map((b) => b.status)).toEqual(["sent", "sent"]);
    expect(new Set(sentTo().slice(1)).size).toBe(600);
    expect(delivery()).toMatchObject({ status: "sent", recipientCount: 600, uncertainCount: 0 });
  });
});

describe("resume", () => {
  const list = (from: number, count: number) => Array.from({ length: count }, (_, i) => email(from + i));
  function seed(status: string, batchStates: string[]) {
    db.tables[SENDS].push({
      issue_id: "i1",
      request_id: "newsletter.request.first",
      status,
      subject: "Hello",
      html: "<p>Hi {{{pm:unsubscribe}}}</p>",
      text_body: "Hi",
      recipient_count: batchStates.length * 3,
      failed_count: 0,
      uncertain_count: 0,
      error: null,
    });
    batchStates.forEach((s, seq) =>
      db.tables[BATCHES].push({ id: `seed-${seq}`, issue_id: "i1", seq, recipients: list(seq * 3, 3), status: s, failed_count: 0 }),
    );
  }

  it("turns in_flight batches uncertain without calling Postmark for them, and sends pending ones", async () => {
    seed("sending", ["sent", "in_flight", "pending", "pending"]);
    await handleRequest(req("resume", { revision: null }), deps());
    expect(batches().map((b) => b.status)).toEqual(["sent", "uncertain", "sent", "sent"]);
    expect(sentTo()).toEqual([...list(6, 3), ...list(9, 3)]);
    expect(sendBatch.mock.calls[0][1][0]).toMatchObject({ subject: "Hello", html: "<p>Hi {{{pm:unsubscribe}}}</p>", text: "Hi" });
    expect(db.tables[SENDS][0]).toMatchObject({ status: "sent", uncertain_count: 3, recipient_count: 12 });
    expect(delivery()).toMatchObject({ status: "sent", recipientCount: 12, uncertainCount: 3 });
  });

  it("claims each pending batch once when resumes race", async () => {
    seed("failed", ["sent", "pending", "pending", "pending"]);
    await Promise.all([
      handleRequest(req("resume", { revision: null }), deps()),
      handleRequest(req("resume", { revision: null }), deps()),
      handleRequest(req("resume", { revision: null }), deps()),
    ]);
    expect(sendBatch).toHaveBeenCalledTimes(3);
    expect(sentTo().sort()).toEqual(list(3, 9).sort());
    expect(delivery()?.status).toBe("sent");
  });

  it.each([["sent"], [null]])("does nothing when the send is %s", async (status) => {
    if (status) seed(status, ["sent"]);
    await handleRequest(req("resume", { revision: null }), deps());
    expect(sendBatch).not.toHaveBeenCalled();
    expect(db.tables[SENDS][0]?.status ?? null).toBe(status);
    expect(delivery()?.status).not.toBe("sending");
  });

  it("builds the batches when the first run stopped before snapshotting the audience", async () => {
    seed("sending", []);
    subscribe(4);
    await handleRequest(req("resume", { revision: null }), deps());
    expect(sentTo().sort()).toEqual(list(0, 4).sort());
    expect(delivery()).toMatchObject({ status: "sent", recipientCount: 4 });
  });
});

describe("failures", () => {
  it("leaves a batch in_flight (never re-sent) when recording its result fails", async () => {
    subscribe(3);
    let claims = 0;
    db.failWhen((t, op) => {
      if (t !== BATCHES || op !== "update") return null;
      claims++;
      return claims === 2 ? { code: "08006", message: "connection lost user1@sub.test" } : null;
    });
    await handleRequest(req("broadcast"), deps());
    expect(batches()[0].status).toBe("in_flight");
    expect(delivery()?.error).toMatch(/went wrong/i);

    db.failWhen(() => null);
    await handleRequest(req("resume", { revision: null }), deps());
    expect(sendBatch).toHaveBeenCalledTimes(1);
    expect(delivery()).toMatchObject({ status: "sent", uncertainCount: 3 });
  });
});
