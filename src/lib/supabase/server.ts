import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readServerEnv } from "@/lib/env";

/**
 * Privileged client using the service-role key. Server actions only: every
 * studio_* table has RLS on with no policies, so this is the only way in.
 */
export function createServiceClient(): SupabaseClient {
  const env = readServerEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
