// Seeds studio* documents into the shared Sanity dataset.
// Only createIfNotExists with fixed ids: never patches, replaces or deletes. Safe to re-run.
// Usage: npm run seed   (node --env-file=.env.local scripts/seed-sanity.mjs)
import { createClient } from "@sanity/client";
import { buildDocuments } from "./seed-data.mjs";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

if (!projectId) {
  console.error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set (load .env.local).");
  process.exit(1);
}
if (!token) {
  console.error("SANITY_WRITE_TOKEN (or SANITY_API_TOKEN) is not set. An Editor-role token is required.");
  process.exit(1);
}

const client = createClient({ projectId, dataset, token, apiVersion: "2026-11-01", useCdn: false });

const docs = buildDocuments();
for (const doc of docs) {
  if (!/^studio/.test(doc._type) || !doc._id.startsWith("studio")) {
    throw new Error(`Refusing to write non-studio document ${doc._id}`);
  }
}

const tx = client.transaction();
for (const doc of docs) tx.createIfNotExists(doc);
try {
  await tx.commit({ visibility: "sync" });
} catch (err) {
  if (err?.statusCode === 403) {
    console.error("Sanity rejected the write (403): the token (SANITY_WRITE_TOKEN or SANITY_API_TOKEN) lacks create permission. Set SANITY_WRITE_TOKEN to an Editor-role token.");
  } else {
    console.error(`Seed failed: ${err?.message ?? err}`);
  }
  process.exit(1);
}
console.log(`Seed complete for ${projectId}/${dataset}: ${docs.length} documents ensured (existing ones left untouched).`);
