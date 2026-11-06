import type { Metadata } from "next";
import { ChatShell } from "@/components/chat/ChatShell";
import { requireOnboarded } from "@/lib/session";
import { listConversations } from "./data";

export const metadata: Metadata = { title: "Lyra ile sohbet" };

export default async function NewChatPage() {
  const { supabase, profile } = await requireOnboarded();
  const conversations = await listConversations(supabase);
  return <ChatShell key="new" initialConversationId={null} initialMessages={[]} conversations={conversations} userName={profile.display_name} />;
}
