import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NatalChart } from "./astro";
import { AppError } from "./errors";

/** Veritabanı satır tipleri (migrations ile birebir). */
export interface ProfileRow {
  id: string;
  display_name: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  natal_chart: NatalChart | null;
  onboarded_at: string | null;
}

export interface OnboardedProfile extends ProfileRow {
  display_name: string;
  birth_date: string;
  birth_place: string;
  latitude: number;
  longitude: number;
  timezone: string;
  natal_chart: NatalChart;
  onboarded_at: string;
}

export interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  memory_processed_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface MemoryRow {
  id: string;
  kind: "fact" | "follow_up" | "reading";
  content: string;
  created_at: string;
}

export function isOnboarded(p: ProfileRow | null): p is OnboardedProfile {
  return !!p?.onboarded_at && !!p.natal_chart;
}

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new AppError("DB_ERROR", error.message);
  return data as ProfileRow | null;
}

export async function requireOnboardedProfile(supabase: SupabaseClient, userId: string): Promise<OnboardedProfile> {
  const p = await getProfile(supabase, userId);
  if (!isOnboarded(p)) throw new AppError("NOT_ONBOARDED");
  return p;
}

export async function listMemories(supabase: SupabaseClient): Promise<MemoryRow[]> {
  const { data, error } = await supabase.from("memories").select("id, kind, content, created_at").order("created_at");
  if (error) throw new AppError("DB_ERROR", error.message);
  return (data ?? []) as MemoryRow[];
}

/** "14:30:00" → "14:30" */
export function trimTime(t: string | null): string | null {
  return t ? t.slice(0, 5) : null;
}
