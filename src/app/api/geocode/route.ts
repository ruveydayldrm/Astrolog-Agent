import type { NextRequest } from "next/server";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { PlaceResult } from "@/lib/lyra/protocol";
import { getUser } from "@/lib/supabase/server";

interface OpenMeteoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  country?: string;
  admin1?: string;
}

/**
 * Şehir arama: Open-Meteo Geocoding API (ücretsiz, anahtarsız) için sunucu proxy'si.
 * Saat dilimini (IANA) doğrudan döndürdüğü için ek bir çağrıya gerek kalmaz.
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2 || q.length > 80) return Response.json({ results: [] });

    const { supabase, user } = await getUser();
    if (!user) return errorResponse("UNAUTHORIZED");
    await enforceRateLimit(supabase, "geocode");

    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.search = new URLSearchParams({ name: q, count: "8", language: "tr", format: "json" }).toString();
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return errorResponse("GEOCODE_FAILED");

    const json = (await res.json()) as { results?: OpenMeteoResult[] };
    const results: PlaceResult[] = (json.results ?? [])
      .filter((r) => r.timezone)
      .map((r) => ({
        id: r.id,
        name: r.name,
        region: [r.admin1, r.country].filter(Boolean).join(", "),
        latitude: r.latitude,
        longitude: r.longitude,
        timezone: r.timezone!,
      }));
    return Response.json({ results });
  } catch (err) {
    return handleRouteError(err);
  }
}
