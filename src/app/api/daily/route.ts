import { requireOnboardedProfile } from "@/lib/db";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { toAppError } from "@/lib/lyra/anthropic";
import { getOrCreateDailyNote } from "@/lib/lyra/daily";
import { getUser } from "@/lib/supabase/server";

export const maxDuration = 60;

/** GET /api/daily — bugünün öne çıkan transitleri + Lyra'nın günlük notu (önbellekli). */
export async function GET() {
  try {
    const { supabase, user } = await getUser();
    if (!user) return errorResponse("UNAUTHORIZED");
    const profile = await requireOnboardedProfile(supabase, user.id);
    const note = await getOrCreateDailyNote(supabase, profile).catch((e) => {
      throw toAppError(e);
    });
    return Response.json(note, { headers: { "Cache-Control": "private, max-age=600" } });
  } catch (err) {
    return handleRouteError(err);
  }
}
