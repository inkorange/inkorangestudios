import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  publicEnv: { sanityProjectId: "", sanityDataset: "production" },
  readServerEnv: () => ({}),
}));

import { sanityClient, sanityFetch } from "./client";

describe("sanityClient", () => {
  it("throws a clear error when the project id is empty", async () => {
    expect(() => sanityClient.config()).toThrow(/NEXT_PUBLIC_SANITY_PROJECT_ID/);
    await expect(sanityFetch("*[0]")).rejects.toThrow(/NEXT_PUBLIC_SANITY_PROJECT_ID/);
  });
});
