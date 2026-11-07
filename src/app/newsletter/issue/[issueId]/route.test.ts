// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const calls: Array<[string, ...unknown[]]> = [];
  const state = { result: { data: null as { html: string } | null, error: null as unknown } };
  const chain: Record<string, unknown> = {};
  for (const name of ["from", "select", "eq", "in"]) {
    chain[name] = (...args: unknown[]) => {
      calls.push([name, ...args]);
      return chain;
    };
  }
  chain.maybeSingle = async () => state.result;
  return { calls, state, chain };
});
vi.mock("@/lib/supabase/server", () => ({ createServiceClient: () => db.chain }));
vi.mock("@/lib/env", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/env")>()),
  publicEnv: { siteUrl: "https://example.test" },
}));

import { UNSUBSCRIBE_PLACEHOLDER } from "@/lib/newsletter/email/render";
import { GET } from "./route";

const get = (issueId: string) =>
  GET(new NextRequest("http://localhost/newsletter/issue/x"), { params: Promise.resolve({ issueId }) });

beforeEach(() => {
  db.calls.length = 0;
  db.state.result = { data: null, error: null };
});

it("returns 404 for an unknown issue", async () => {
  expect((await get("issue-1")).status).toBe(404);
  expect(db.calls).toContainEqual(["eq", "issue_id", "issue-1"]);
});

it("serves sends that are sent, still sending or failed (html is frozen at claim time)", async () => {
  await get("issue-1");
  expect(db.calls).toContainEqual(["in", "status", ["sending", "sent", "failed"]]);
  expect(db.calls.some(([name, col]) => name === "eq" && col === "status")).toBe(false);
});

it.each(["bad id", "a/b", "", "x".repeat(129), "id%00"])("returns 404 for malformed id %j without querying", async (id) => {
  expect((await get(id)).status).toBe(404);
  expect(db.calls).toHaveLength(0);
});

it("returns 404 on a database error", async () => {
  db.state.result = { data: null, error: { message: "boom" } };
  expect((await get("issue-1")).status).toBe(404);
});

it("serves the stored html with the unsubscribe placeholder replaced", async () => {
  db.state.result = {
    data: {
      html: `<a href="${UNSUBSCRIBE_PLACEHOLDER}">Unsub</a><a href="${UNSUBSCRIBE_PLACEHOLDER}">again</a><a href="https://x/newsletter/issue/1">View in browser</a>`,
    },
    error: null,
  };
  const res = await get("issue-1");
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
  expect(res.headers.get("x-robots-tag")).toBe("noindex");
  expect(res.headers.get("cache-control")).toBe("public, max-age=300");
  const html = await res.text();
  expect(html).not.toContain("pm:unsubscribe");
  expect(html.split("https://example.test/#newsletter")).toHaveLength(3);
  expect(html).toContain("View in browser");
});
