// @vitest-environment node
import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const cache = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock("next/cache", () => cache);

import { POST } from "./route";

const SECRET = "test-secret";

async function signed(body: object, secret = SECRET) {
  const payload = JSON.stringify(body);
  const signature = await encodeSignatureHeader(payload, Date.now(), secret);
  return new NextRequest("http://localhost/api/revalidate", {
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
  // Signature checking is real async crypto that finishes off the main thread, so the 3s wait
  // can start at any point. Tick the fake clock and yield a real macrotask (setImmediate is not
  // faked) until the handler settles; a fixed tick count raced slow CI machines.
  while (!done) {
    await vi.advanceTimersByTimeAsync(1000);
    if (!done) await new Promise((resolve) => setImmediate(resolve));
  }
  return pending;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  vi.stubEnv("SANITY_REVALIDATE_SECRET", SECRET);
  cache.revalidateTag.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

it("rejects a bad signature with 401 and revalidates nothing", async () => {
  const res = await call(await signed({ _type: "studioGame" }, "wrong-secret"));
  expect(res.status).toBe(401);
  expect(cache.revalidateTag).not.toHaveBeenCalled();
});

it("rejects a request with no signature with 401", async () => {
  const req = new NextRequest("http://localhost/api/revalidate", { method: "POST", body: JSON.stringify({ _type: "studioGame" }) });
  const res = await call(req);
  expect(res.status).toBe(401);
  expect(cache.revalidateTag).not.toHaveBeenCalled();
});

it("revalidates the document type's tag for studio types", async () => {
  const res = await call(await signed({ _type: "studioGame", _id: "g1" }));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ revalidated: true, tag: "studioGame" });
  expect(cache.revalidateTag).toHaveBeenCalledTimes(1);
  expect(cache.revalidateTag).toHaveBeenCalledWith("studioGame", { expire: 0 });
});

it("ignores the portfolio's types in the shared dataset", async () => {
  const res = await call(await signed({ _type: "project", _id: "p1" }));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ revalidated: false });
  expect(cache.revalidateTag).not.toHaveBeenCalled();
});

it("returns 400 for a signed body without a _type", async () => {
  const res = await call(await signed({ _id: "x" }));
  expect(res.status).toBe(400);
  expect(cache.revalidateTag).not.toHaveBeenCalled();
});

it("refuses to run without a configured secret (no unsigned revalidation)", async () => {
  vi.stubEnv("SANITY_REVALIDATE_SECRET", "");
  const res = await call(await signed({ _type: "studioGame" }));
  expect(res.status).toBe(500);
  expect(cache.revalidateTag).not.toHaveBeenCalled();
});
