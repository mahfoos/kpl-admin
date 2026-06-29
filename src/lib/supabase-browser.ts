"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Browser Supabase client (anon key) used to subscribe to live auction state. */
let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  if (!client) {
    client = createClient(url, anon, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}
