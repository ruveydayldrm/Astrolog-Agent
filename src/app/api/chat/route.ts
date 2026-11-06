import { after, type NextRequest } from "next/server";
import { z } from "zod";
import { listMemories, requireOnboardedProfile, type MessageRow } from "@/lib/db";
import { AppError, ERRORS, errorResponse, handleRouteError } from "@/lib/errors";
import { getLLM, toAppError, type ChatTurn } from "@/lib/llm";
import { buildLyraContext } from "@/lib/lyra/context";
import { MEMORY_EVERY_N_USER_MESSAGES, processConversationMemory } from "@/lib/lyra/memory";
import { STREAM_ERROR_MARKER } from "@/lib/lyra/protocol";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getUser } from "@/lib/supabase/server";

// Vercel Hobby (ücretsiz) planı sınırı içinde
export const maxDuration = 60;

const bodySchema = z.object({
  conversationId: z.uuid().nullish(),
  message: z.string().trim().min(1).max(4000),
});

/** Modele gönderilecek geçmiş mesaj sayısı (bağlam ve maliyet dengesi). */
const HISTORY_LIMIT = 40;

/**
 * POST /api/chat — Lyra ile sohbet (streaming).
 * Yanıt: text/plain akışı; yeni sohbet kimliği `X-Conversation-Id` başlığında döner.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return errorResponse("INVALID_INPUT");
    const { message } = parsed.data;

    const { supabase, user } = await getUser();
    if (!user) return errorResponse("UNAUTHORIZED");

    const profile = await requireOnboardedProfile(supabase, user.id);
    await enforceRateLimit(supabase, "chat");
    const llm = getLLM(); // anahtar yoksa erken ve nazikçe hata ver

    // Sohbeti bul ya da oluştur (RLS sahipliği garanti eder)
    let conversationId = parsed.data.conversationId ?? null;
    if (conversationId) {
      const { data } = await supabase.from("conversations").select("id").eq("id", conversationId).maybeSingle();
      if (!data) return errorResponse("NOT_FOUND");
    } else {
      const title = message.length > 60 ? `${message.slice(0, 57).trimEnd()}…` : message;
      const { data, error } = await supabase.from("conversations").insert({ user_id: user.id, title }).select("id").single();
      if (error) throw new AppError("DB_ERROR", error.message);
      conversationId = data.id as string;
    }

    // Geçmiş: en yeni HISTORY_LIMIT mesaj, kronolojik sırada
    const { data: historyDesc } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);
    const history = ((historyDesc ?? []) as Pick<MessageRow, "role" | "content">[]).reverse();
    while (history[0]?.role === "assistant") history.shift(); // ilk mesaj kullanıcıdan olmalı

    const { error: insertError } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, user_id: user.id, role: "user", content: message });
    if (insertError) throw new AppError("DB_ERROR", insertError.message);

    const memories = await listMemories(supabase);
    const { system } = buildLyraContext(profile, memories);

    const messages: ChatTurn[] = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    let resolveDone: () => void = () => {};
    const done = new Promise<void>((r) => (resolveDone = r));
    const encoder = new TextEncoder();
    const convId = conversationId;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let full = "";
        try {
          for await (const text of llm.streamChat({ system, messages })) {
            full += text;
            controller.enqueue(encoder.encode(text));
          }

          // Model içerik politikası nedeniyle hiçbir şey üretmediyse nazik bir cevap ver
          if (!full.trim()) {
            full = "Bu konuda sana yardımcı olamayacağım, ama başka bir şey sormak istersen buradayım. 🌙";
            controller.enqueue(encoder.encode(full));
          }

          if (full.trim()) {
            await supabase.from("messages").insert({ conversation_id: convId, user_id: user.id, role: "assistant", content: full });
            await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
          }
        } catch (err) {
          const appErr = toAppError(err);
          console.error("[lyra] sohbet akışı hatası:", appErr.message);
          controller.enqueue(encoder.encode(`${STREAM_ERROR_MARKER}${ERRORS[appErr.code].message}`));
        } finally {
          controller.close();
          resolveDone();
        }
      },
    });

    // Yanıt bittikten sonra: yeterince yeni mesaj biriktiyse hafızayı güncelle
    after(async () => {
      await done;
      try {
        await enforceRateLimit(supabase, "memory");
        await processConversationMemory(supabase, user.id, convId, MEMORY_EVERY_N_USER_MESSAGES);
      } catch (err) {
        console.error("[lyra] arka plan hafıza güncellemesi:", err);
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Conversation-Id": convId,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
