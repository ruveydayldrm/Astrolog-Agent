import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConversationSummary } from "@/components/chat/ChatShell";

export async function listConversations(supabase: SupabaseClient): Promise<ConversationSummary[]> {
  const { data } = await supabase.from("conversations").select("id, title, updated_at").order("updated_at", { ascending: false }).limit(50);
  return (data ?? []) as ConversationSummary[];
}
