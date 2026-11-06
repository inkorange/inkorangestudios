import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
let errorSpy: ReturnType<typeof vi.spyOn>;

type Keys = { site?: string; secret?: string; nodeEnv?: string };

async function load({ site, secret, nodeEnv = "production" }: Keys) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", site ?? "");
  vi.stubEnv("TURNSTILE_SECRET_KEY", secret ?? "");
  return import("./turnstile");
}

const BOTH = { site: "site-key", secret: "secret" };

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  errorSpy.mockRestore();
});

describe("key combinations", () => {
  it("neither key: not required, passes without fetching or logging", async () => {
    const { verifyTurnstile, CAPTCHA_REQUIRED } = await load({});
    expect(CAPTCHA_REQUIRED).toBe(false);
    expect(await verifyTurnstile("")).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("both keys: required, and the token is verified", async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ success: true }) });
    const { verifyTurnstile, CAPTCHA_REQUIRED } = await load(BOTH);
    expect(CAPTCHA_REQUIRED).toBe(true);
    expect(await verifyTurnstile("tok")).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each([
    ["site key only", { site: "site-key" }],
    ["secret only", { secret: "secret" }],
  ])("%s: fails closed and logs one error", async (_name, keys) => {
    const { verifyTurnstile, CAPTCHA_REQUIRED } = await load(keys);
    expect(CAPTCHA_REQUIRED).toBe(false);
    expect(await verifyTurnstile("tok")).toBe(false);
    expect(await verifyTurnstile("tok")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledOnce();
    expect(String(errorSpy.mock.calls[0][0])).toMatch(/NEXT_PUBLIC_TURNSTILE_SITE_KEY.*TURNSTILE_SECRET_KEY/);
  });

  it.each([[{}], [{ site: "site-key" }], [{ secret: "secret" }], [BOTH]])("dev server %o: always passes", async (keys) => {
    const { verifyTurnstile } = await load({ ...keys, nodeEnv: "development" });
    expect(await verifyTurnstile("")).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe("verifyTurnstile with both keys", () => {
  it("fails an empty token", async () => {
    const { verifyTurnstile } = await load(BOTH);
    expect(await verifyTurnstile("")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("x"));
    const { verifyTurnstile } = await load(BOTH);
    expect(await verifyTurnstile("tok")).toBe(false);
  });

  it("returns true on success and sends secret, response and remoteip", async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ success: true }) });
    const { verifyTurnstile } = await load(BOTH);
    expect(await verifyTurnstile("tok", "1.2.3.4")).toBe(true);
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("remoteip")).toBe("1.2.3.4");
    expect(body.get("response")).toBe("tok");
    expect(body.get("secret")).toBe("secret");
  });

  it("returns false when Cloudflare says no", async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ success: false }) });
    const { verifyTurnstile } = await load(BOTH);
    expect(await verifyTurnstile("tok")).toBe(false);
  });
});
