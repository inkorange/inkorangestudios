// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ markUnsubscribed: vi.fn() }));
vi.mock("@/lib/newsletter/subscribers", () => ({ markUnsubscribed: mocks.markUnsubscribed }));

import { POST } from "./route";

function basic(user: string, password: string) {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

function req(body: unknown, authorization: string | null = basic("hook", "s3cret")) {
  return new NextRequest("http://localhost/api/postmark/webhook", {
    method: "POST",
    headers: authorization ? { authorization } : {},
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const suppression = { RecordType: "SubscriptionChange", Recipient: "Reader@Example.COM", SuppressSending: true, SuppressionReason: "ManualSuppression" };

beforeEach(() => {
  vi.stubEnv("POSTMARK_WEBHOOK_USER", "hook");
  vi.stubEnv("POSTMARK_WEBHOOK_PASSWORD", "s3cret");
  mocks.markUnsubscribed.mockReset();
  mocks.markUnsubscribed.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());

it("refuses to run unconfigured", async () => {
  vi.stubEnv("POSTMARK_WEBHOOK_PASSWORD", "");
  expect((await POST(req(suppression))).status).toBe(500);
  expect(mocks.markUnsubscribed).not.toHaveBeenCalled();
});

it.each([
  ["wrong password", basic("hook", "nope")],
  ["wrong user", basic("other", "s3cret")],
  ["shorter password", basic("hook", "s")],
  ["no header", null],
  ["non-basic scheme", "Bearer abc"],
])("rejects %s with 401", async (_n, auth) => {
  expect((await POST(req(suppression, auth))).status).toBe(401);
  expect(mocks.markUnsubscribed).not.toHaveBeenCalled();
});

it("marks the lower-cased recipient unsubscribed with the reason", async () => {
  const res = await POST(req(suppression));
  expect(res.status).toBe(200);
  expect(mocks.markUnsubscribed).toHaveBeenCalledWith("reader@example.com", "ManualSuppression");
});

it("does nothing for a reactivation", async () => {
  const res = await POST(req({ ...suppression, SuppressSending: false }));
  expect(res.status).toBe(200);
  expect(mocks.markUnsubscribed).not.toHaveBeenCalled();
});

it("does nothing for other record types", async () => {
  const res = await POST(req({ RecordType: "Bounce", Email: "a@b.c" }));
  expect(res.status).toBe(200);
  expect(mocks.markUnsubscribed).not.toHaveBeenCalled();
});

it("returns 400 for malformed JSON", async () => {
  expect((await POST(req("{nope"))).status).toBe(400);
  expect(mocks.markUnsubscribed).not.toHaveBeenCalled();
});

it("returns 500 when the database write fails so Postmark retries", async () => {
  mocks.markUnsubscribed.mockRejectedValue(new Error("db down"));
  const res = await POST(req(suppression));
  expect(res.status).toBe(500);
});
