/*
 * Public (NEXT_PUBLIC_*) values, safe for client components. Zod-free on
 * purpose so the browser bundle doesn't carry zod or the server schema
 * (tests/enforcement/client-bundle.test.ts checks this). Server code may keep
 * importing `publicEnv` from `@/lib/env`, which re-exports it.
 */

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

export type PublicEnv = {
  siteUrl: string;
  sanityProjectId: string;
  sanityDataset: string;
  turnstileSiteKey?: string;
  gtmId?: string;
};

/** Literal `process.env.NEXT_PUBLIC_*` access so Next can inline them. */
export const publicEnv: PublicEnv = {
  siteUrl: clean(process.env.NEXT_PUBLIC_SITE_URL) ?? "https://inkorangestudios.com",
  sanityProjectId: clean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) ?? "",
  sanityDataset: clean(process.env.NEXT_PUBLIC_SANITY_DATASET) ?? "production",
  turnstileSiteKey: clean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
  gtmId: clean(process.env.NEXT_PUBLIC_GTM_ID),
};
