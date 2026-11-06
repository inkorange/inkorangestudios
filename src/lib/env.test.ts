import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("env", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults publicEnv.siteUrl when NEXT_PUBLIC_SITE_URL is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const { publicEnv } = await import("./env");
    expect(publicEnv.siteUrl).toBe("https://inkorangestudios.com");
  });

  it("defaults sanityDataset to production", async () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "");
    const { publicEnv } = await import("./env");
    expect(publicEnv.sanityDataset).toBe("production");
  });

  it("readServerEnv throws naming SUPABASE_SERVICE_ROLE_KEY when missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const { readServerEnv } = await import("./env");
    expect(() => readServerEnv()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("returns optional vars as undefined, not empty strings", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    vi.stubEnv("POSTMARK_SERVER_TOKEN", "");
    vi.stubEnv("FEEDBACK_NOTIFY_EMAIL", "");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const { readServerEnv } = await import("./env");
    const env = readServerEnv();
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("service-key");
    expect(env.POSTMARK_SERVER_TOKEN).toBeUndefined();
    expect(env.FEEDBACK_NOTIFY_EMAIL).toBeUndefined();
    expect(env.TURNSTILE_SECRET_KEY).toBeUndefined();
    expect(env.SANITY_API_TOKEN).toBeUndefined();
  });
});
