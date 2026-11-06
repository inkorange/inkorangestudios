// @vitest-environment node
import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ handleRequest: vi.fn() }));
vi.mock("@/lib/newsletter/send", () => ({ handleRequest: mocks.handleRequest }));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (cb: () => unknown) => cb(),
}));

import { POST } from "./route";

const SECRET = "test-secret";
const valid = { _id: "newsletter.request.abc", issueId: "issue-1", kind: "test", revision: "rev1" };

async function signed(body: object, secret = SECRET) {
  const payload = JSON.stringify(body);
  const signature = await encodeSignatureHeader(payload, Date.now(), secret);
  return new NextRequest("http://localhost/api/newsletter/webhook", {
    method: "POST",
    headers: { [SIGNATURE_HEADER_NAME]: signature, "content-type": "application/json" },
    body: payload,
  });
}

/** parseBody waits 3s for Content Lake consistency after a valid signature; skip the wait. */
async function call(req: NextRequest) {
  let done = false;
  const pending = POST(req).finally(() => {
    done = true;
  });
  while (!done) {
    await vi.advanceTimersByTimeAsync(1000);
    if (!done) await new Promise((resolve) => setImmediate(resolve));
  }
  return pending;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  vi.stubEnv("NEWSLETTER_WEBHOOK_SECRET", SECRET);
  mocks.handleRequest.mockReset();
  mocks.handleRequest.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

it("refuses to run without a configured secret", async () => {
  vi.stubEnv("NEWSLETTER_WEBHOOK_SECRET", "");
  const res = await call(await signed(valid));
  expect(res.status).toBe(500);
  expect(mocks.handleRequest).not.toHaveBeenCalled();
});

it("rejects a bad signature with 401", async () => {
  const res = await call(await signed(valid, "wrong-secret"));
  expect(res.status).toBe(401);
  expect(mocks.handleRequest).not.toHaveBeenCalled();
});

it.each([
  ["wrong _id prefix", { ...valid, _id: "other.abc" }],
  ["invalid kind", { ...valid, kind: "explode" }],
  ["missing kind", { _id: valid._id, issueId: valid.issueId }],
  ["empty issueId", { ...valid, issueId: "" }],
  ["missing issueId", { _id: valid._id, kind: "test" }],
])("returns 400 for %s", async (_name, body) => {
  const res = await call(await signed(body));
  expect(res.status).toBe(400);
  expect(mocks.handleRequest).not.toHaveBeenCalled();
});

it("accepts a valid request with 202 and hands it to handleRequest once", async () => {
  const res = await call(await signed(valid));
  expect(res.status).toBe(202);
  expect(await res.json()).toEqual({ accepted: true });
  expect(mocks.handleRequest).toHaveBeenCalledTimes(1);
  expect(mocks.handleRequest).toHaveBeenCalledWith({
    requestId: "newsletter.request.abc",
    issueId: "issue-1",
    kind: "test",
    revision: "rev1",
  });
});

it("maps a missing revision to null", async () => {
  const noRevision = { _id: valid._id, issueId: valid.issueId, kind: valid.kind };
  const res = await call(await signed(noRevision));
  expect(res.status).toBe(202);
  expect(mocks.handleRequest).toHaveBeenCalledWith(expect.objectContaining({ revision: null }));
});

it("logs a handleRequest rejection without request contents and still answers 202", async () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.handleRequest.mockRejectedValue(new Error("boom"));
  const res = await call(await signed(valid));
  await vi.advanceTimersByTimeAsync(0);
  expect(res.status).toBe(202);
  expect(spy).toHaveBeenCalled();
  expect(JSON.stringify(spy.mock.calls)).not.toContain("issue-1");
  spy.mockRestore();
});
