import { createClient } from "next-sanity";
import { publicEnv } from "@/lib/env";

export const apiVersion = "2026-11-01";

/*
 * Reads are unauthenticated and go through the CDN: the shared dataset is public
 * (verified with an unauthenticated query to the apicdn host), and only published
 * documents are needed. SANITY_API_TOKEN is used solely by getSanityWriteClient()
 * (server-only; the seed script), never for page reads.
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

/** Server-only client with the API token, for writes (seed script). Never use in pages. */
export function getSanityWriteClient() {
  const token = process.env.SANITY_API_TOKEN?.trim();
  if (!token) throw new Error("SANITY_API_TOKEN is not set; cannot create the Sanity write client.");
  return createClient({
    projectId: requireProjectId(),
    dataset: publicEnv.sanityDataset,
    apiVersion,
    useCdn: false,
    token,
  });
}

export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  tags: string[] = [],
): Promise<T> {
  return getSanityClient().fetch<T>(query, params, { next: { tags } });
}
