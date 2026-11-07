import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { deleteSuppression, fromLine, listSuppressed, sendBatch, sendEmail, type OutboundMessage } from "./postmark";

const msg: OutboundMessage = {
  to: "a@example.com",
  subject: "Hi",
  html: "<p>Hi</p>",
  text: "Hi",
  stream: "broadcast",
  from: "News <news@example.com>",
  tag: "t1",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("sendEmail", () => {
  it("maps fields and returns the message id", async () => {
    fetchMock.mockResolvedValue(json({ ErrorCode: 0, MessageID: "m-1" }));
    const r = await sendEmail("tok", msg);
    expect(r).toEqual({ ok: true, messageId: "m-1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.postmarkapp.com/email");
    expect(init.method).toBe("POST");
    expect(init.headers["X-Postmark-Server-Token"]).toBe("tok");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body)).toEqual({
      From: msg.from,
      To: msg.to,
      Subject: "Hi",
      HtmlBody: "<p>Hi</p>",
      TextBody: "Hi",
      MessageStream: "broadcast",
      Tag: "t1",
    });
  });

  it("sets ReplyTo only when a reply-to address is given", async () => {
    fetchMock.mockResolvedValue(json({ ErrorCode: 0, MessageID: "m-2" }));
    await sendEmail("tok", { ...msg, replyTo: "info@chriswest.tech" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).ReplyTo).toBe("info@chriswest.tech");
    fetchMock.mockResolvedValue(json({ ErrorCode: 0, MessageID: "m-3" }));
    await sendEmail("tok", msg);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).not.toHaveProperty("ReplyTo");
  });

  it("returns status and Postmark ErrorCode on non-2xx", async () => {
    fetchMock.mockResolvedValue(json({ ErrorCode: 406, Message: "inactive" }, 422));
    expect(await sendEmail("tok", msg)).toEqual({ ok: false, status: 422, code: 406 });
  });

  it("returns status with no code when the error body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("bad gateway", { status: 502 }));
    expect(await sendEmail("tok", msg)).toEqual({ ok: false, status: 502 });
  });

  it("returns status 0 on network error", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));
    expect(await sendEmail("tok", msg)).toEqual({ ok: false, status: 0 });
  });
});

describe("sendBatch", () => {
  it("sends an array and maps per-message error codes", async () => {
    fetchMock.mockResolvedValue(
      json([
        { ErrorCode: 0, To: "a@example.com", MessageID: "1" },
        { ErrorCode: 406, To: "b@example.com", MessageID: "" },
      ]),
    );
    const r = await sendBatch("tok", [msg, { ...msg, to: "b@example.com" }]);
    expect(r).toEqual({
      ok: true,
      results: [
        { to: "a@example.com", errorCode: 0 },
        { to: "b@example.com", errorCode: 406 },
      ],
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.postmarkapp.com/email/batch");
    const body = JSON.parse(init.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[0].MessageStream).toBe("broadcast");
  });

  it("throws RangeError over 500 messages", async () => {
    const many = Array.from({ length: 501 }, () => msg);
    await expect(sendBatch("tok", many)).rejects.toBeInstanceOf(RangeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts exactly 500", async () => {
    fetchMock.mockResolvedValue(json([]));
    const r = await sendBatch("tok", Array.from({ length: 500 }, () => msg));
    expect(r.ok).toBe(true);
  });

  it("returns the HTTP status on rejection and 0 on network error", async () => {
    fetchMock.mockResolvedValueOnce(json({ ErrorCode: 300, Message: "x" }, 401));
    expect(await sendBatch("tok", [msg])).toEqual({ ok: false, status: 401 });
    fetchMock.mockRejectedValueOnce(new Error("timeout"));
    expect(await sendBatch("tok", [msg])).toEqual({ ok: false, status: 0 });
  });
});

describe("sendBatch uncertain outcomes", () => {
  it("maps a 2xx with a non-array body to status 0", async () => {
    fetchMock.mockResolvedValue(json({ ok: true }, 200));
    expect(await sendBatch("tok", [msg])).toEqual({ ok: false, status: 0 });
  });

  it("maps a 2xx with unparseable JSON to status 0", async () => {
    fetchMock.mockResolvedValue(new Response("not json", { status: 200 }));
    expect(await sendBatch("tok", [msg])).toEqual({ ok: false, status: 0 });
  });

  it("maps 5xx to status 0 but keeps 4xx statuses", async () => {
    fetchMock.mockResolvedValueOnce(json({}, 503));
    expect(await sendBatch("tok", [msg])).toEqual({ ok: false, status: 0 });
    fetchMock.mockResolvedValueOnce(json({ ErrorCode: 300 }, 422));
    expect(await sendBatch("tok", [msg])).toEqual({ ok: false, status: 422 });
  });
});

describe("listSuppressed", () => {
  it("lower-cases addresses and encodes the stream", async () => {
    fetchMock.mockResolvedValue(
      json({ Suppressions: [{ EmailAddress: "A@Example.com" }, { EmailAddress: "b@x.io" }] }),
    );
    const r = await listSuppressed("tok", "my stream");
    expect(r).toEqual(new Set(["a@example.com", "b@x.io"]));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.postmarkapp.com/message-streams/my%20stream/suppressions/dump",
    );
    expect(init.method).toBe("GET");
  });

  it("returns null on HTTP error and network error", async () => {
    fetchMock.mockResolvedValueOnce(json({}, 500));
    expect(await listSuppressed("tok", "s")).toBeNull();
    fetchMock.mockRejectedValueOnce(new Error("x"));
    expect(await listSuppressed("tok", "s")).toBeNull();
  });
});

describe("deleteSuppression", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("posts the address to the stream's suppressions/delete and reports a deletion", async () => {
    fetchMock.mockResolvedValue(json({ Suppressions: [{ EmailAddress: "a@b.co", Status: "Deleted", Message: null }] }));
    expect(await deleteSuppression("tok", "broad cast", "a@b.co")).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.postmarkapp.com/message-streams/broad%20cast/suppressions/delete");
    expect(init.method).toBe("POST");
    expect(init.headers["X-Postmark-Server-Token"]).toBe("tok");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body)).toEqual({ Suppressions: [{ EmailAddress: "a@b.co" }] });
  });

  it("is false, never throws, and logs only the status on any failure", async () => {
    fetchMock.mockResolvedValueOnce(json({ ErrorCode: 10, Message: "bad token" }, 401));
    expect(await deleteSuppression("tok", "s", "a@b.co")).toBe(false);
    fetchMock.mockResolvedValueOnce(json({ Suppressions: [{ EmailAddress: "a@b.co", Status: "Failed", Message: "nope" }] }));
    expect(await deleteSuppression("tok", "s", "a@b.co")).toBe(false);
    fetchMock.mockResolvedValueOnce(new Response("not json", { status: 200 }));
    expect(await deleteSuppression("tok", "s", "a@b.co")).toBe(false);
    fetchMock.mockRejectedValueOnce(new Error("network a@b.co"));
    expect(await deleteSuppression("tok", "s", "a@b.co")).toBe(false);
    const logged = JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls);
    expect(logged).toContain("401");
    expect(logged).not.toContain("a@b.co");
    expect(logged).not.toContain("tok");
  });
});

describe("fromLine", () => {
  it("uses the name as is when it is safe, and the default when it is missing", () => {
    expect(fromLine("Ink Co", "news@x.co")).toBe("Ink Co <news@x.co>");
    expect(fromLine(null, "news@x.co")).toBe("inkOrange Studios <news@x.co>");
    expect(fromLine("  ", "news@x.co")).toBe("inkOrange Studios <news@x.co>");
    expect(fromLine(" Ink Co ", "news@x.co")).toBe("Ink Co <news@x.co>");
  });
  it("quotes names with specials and escapes quotes and backslashes", () => {
    expect(fromLine("Ink, Co", "news@x.co")).toBe('"Ink, Co" <news@x.co>');
    expect(fromLine('Ink "Co" \\ x', "news@x.co")).toBe('"Ink \\"Co\\" \\\\ x" <news@x.co>');
  });
});
