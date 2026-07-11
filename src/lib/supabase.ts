import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const GUEST_PHOTOS_BUCKET = "guest-photos";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diset di .env.local");
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
