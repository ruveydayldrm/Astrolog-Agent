import type { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { toAppError } from "@/lib/llm";
import { processConversationMemory } from "@/lib/lyra/memory";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getUser } from "@/lib/supabase/server";

export const maxDuration = 60;

const bodySchema = z.object({ conversationId: z.uuid() });

/**
 * POST /api/memory — sohbet bittiğinde (kullanıcı sayfadan ayrılınca ya da yeni sohbet açınca)
 * istemci navigator.sendBeacon ile çağırır. En az 1 yeni kullanıcı mesajı varsa hafıza güncellenir.
 */
export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    const parsed = bodySchema.safeParse(JSON.parse(raw || "null"));
    if (!parsed.success) return errorResponse("INVALID_INPUT");

    const { supabase, user } = await getUser();
    if (!user) return errorResponse("UNAUTHORIZED");
    await enforceRateLimit(supabase, "memory");

    const updated = await processConversationMemory(supabase, user.id, parsed.data.conversationId, 1).catch((e) => {
      throw toAppError(e);
    });
    return Response.json({ updated });
  } catch (err) {
    return handleRouteError(err);
  }
}
