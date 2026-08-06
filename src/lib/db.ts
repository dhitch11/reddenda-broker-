import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase access.
 *
 * The rate tables are correctly gated. Measured 2026-08-06 with the anon key:
 *
 *   cpt_peer_stats             401 permission denied
 *   cpt_peer_stats_cbsa        401 permission denied
 *   payer_cpt_state_stats      401 permission denied
 *   data_manifest              401 permission denied
 *   medicare_locality_cpt_rate 200
 *   npi_cbsa                   200
 *
 * That gate is real server-side enforcement, not a client-side padlock, and we do
 * not weaken it. The service credential is read from the environment BY NAME and
 * never reaches the browser. Every call site lives in a route handler or a server
 * component. If you find yourself importing this from a "use client" file, stop.
 */

let cached: SupabaseClient | null = null;

export function serviceClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "reddenda-broker" } },
  });

  return cached;
}

/** True when the server has what it needs to serve real numbers. */
export function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
