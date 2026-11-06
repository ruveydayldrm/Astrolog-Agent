import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChatShell, type ChatMessage } from "@/components/chat/ChatShell";
import { requireOnboarded } from "@/lib/session";
import { listConversations } from "../data";

export const metadata: Metadata = { title: "Lyra ile sohbet" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase, profile } = await requireOnboarded();
  // RLS: başkasının sohbeti hiçbir zaman dönmez
  const { data: conv } = await supabase.from("conversations").select("id").eq("id", id).maybeSingle();
  if (!conv) notFound();

  const [{ data: msgs }, conversations] = await Promise.all([
    supabase.from("messages").select("id, role, content").eq("conversation_id", id).order("created_at"),
    listConversations(supabase),
  ]);

  return (
    <ChatShell
      key={id}
      initialConversationId={id}
      initialMessages={(msgs ?? []) as ChatMessage[]}
      conversations={conversations}
      userName={profile.display_name}
    />
  );
}
