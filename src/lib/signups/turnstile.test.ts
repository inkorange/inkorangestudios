import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

async function load(required: boolean) {
  vi.resetModules();
  vi.doMock("./captchaEnabled", () => ({ CAPTCHA_REQUIRED: required }));
  return (await import("./turnstile")).verifyTurnstile;
}

describe("verifyTurnstile", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.doUnmock("./captchaEnabled");
  });

  it("passes without fetching when not required", async () => {
    const verify = await load(false);
    expect(await verify("")).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails an empty token when required", async () => {
    const verify = await load(true);
    expect(await verify("")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("x"));
    const verify = await load(true);
    expect(await verify("tok")).toBe(false);
  });

  it("returns true on success and sends remoteip", async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ success: true }) });
    const verify = await load(true);
    expect(await verify("tok", "1.2.3.4")).toBe(true);
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("remoteip")).toBe("1.2.3.4");
    expect(body.get("response")).toBe("tok");
  });

  it("returns false when Cloudflare says no", async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ success: false }) });
    const verify = await load(true);
    expect(await verify("tok")).toBe(false);
  });
});
