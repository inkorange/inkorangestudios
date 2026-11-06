import { createClient } from "next-sanity";
import { publicEnv, readServerEnv } from "@/lib/env";

export const apiVersion = "2026-11-01";

function makeClient() {
  if (!publicEnv.sanityProjectId) {
    throw new Error(
      "NEXT_PUBLIC_SANITY_PROJECT_ID is not set; cannot create the Sanity client.",
    );
  }
  return createClient({
    projectId: publicEnv.sanityProjectId,
    dataset: publicEnv.sanityDataset,
    apiVersion,
    useCdn: true,
  });
}

type SanityClient = ReturnType<typeof makeClient>;
let cached: SanityClient | undefined;

/** Lazily created so importing this module never throws; using it with no project id does. */
export const sanityClient: SanityClient = new Proxy({} as SanityClient, {
  get(_target, prop, receiver) {
    cached ??= makeClient();
    return Reflect.get(cached, prop, receiver);
  },
});

export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  tags: string[] = [],
): Promise<T> {
  const token = readTokenSafely();
  const client = token ? sanityClient.withConfig({ token, useCdn: false }) : sanityClient;
  return client.fetch<T>(query, params, { next: { tags } });
}

function readTokenSafely(): string | undefined {
  try {
    return readServerEnv().SANITY_API_TOKEN;
  } catch {
    return undefined;
  }
}
