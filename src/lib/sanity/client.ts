import "server-only";
import { createClient } from "next-sanity";
import { publicEnv } from "@/lib/env";

export const apiVersion = "2026-11-01";

/*
 * Reads are unauthenticated and go through the CDN: the shared dataset is public
 * (verified with an unauthenticated query to the apicdn host), and only published
 * documents are needed. No token is used for page reads; the seed script builds its own write client.
 */

function requireProjectId(): string {
  if (!publicEnv.sanityProjectId) {
    throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set; cannot create the Sanity client.");
  }
  return publicEnv.sanityProjectId;
}

let readClient: ReturnType<typeof createClient> | undefined;
let readKey = "";

/** Memoized CDN read client. Throws if the project id is unset. */
export function getSanityClient() {
  const projectId = requireProjectId();
  const key = `${projectId}/${publicEnv.sanityDataset}`;
  if (!readClient || readKey !== key) {
    readClient = createClient({
      projectId,
      dataset: publicEnv.sanityDataset,
      apiVersion,
      useCdn: true,
    });
    readKey = key;
  }
  return readClient;
}

export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  tags: string[] = [],
): Promise<T> {
  return getSanityClient().fetch<T>(query, params, { next: { tags } });
}
