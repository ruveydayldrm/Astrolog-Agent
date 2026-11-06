"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/** Tarayıcı tarafı Supabase istemcisi (yalnızca OAuth başlatma ve çıkış için kullanılır). */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
