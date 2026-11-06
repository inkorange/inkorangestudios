import { afterEach, describe, expect, it, vi } from "vitest";

async function widget(env: { nodeEnv: string; site?: string; secret?: string }) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", env.nodeEnv);
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", env.site ?? "");
  vi.stubEnv("TURNSTILE_SECRET_KEY", env.secret ?? "");
  return (await import("./captchaEnabled")).CAPTCHA_WIDGET;
}

afterEach(() => vi.unstubAllEnvs());

describe("CAPTCHA_WIDGET (shared by the widget and the server)", () => {
  it.each([
    ["both keys", { site: "s", secret: "x" }, true],
    ["site key only (server fails closed, widget still renders)", { site: "s" }, true],
    ["secret only", { secret: "x" }, false],
    ["neither", {}, false],
    ["whitespace site key", { site: "  " }, false],
  ])("production, %s", async (_name, keys, expected) => {
    expect(await widget({ nodeEnv: "production", ...keys })).toBe(expected);
  });

  it("is off on a dev server even with both keys", async () => {
    expect(await widget({ nodeEnv: "development", site: "s", secret: "x" })).toBe(false);
  });
});
