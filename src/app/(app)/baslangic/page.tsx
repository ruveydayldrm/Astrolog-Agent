import type { Metadata } from "next";
import { getProfile, trimTime } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { BirthWizard } from "./BirthWizard";

export const metadata: Metadata = { title: "Doğum bilgilerin" };

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  const p = await getProfile(supabase, user.id);

  // Daha önce doldurulduysa düzenleme modu için mevcut değerlerle başla
  const initial =
    p?.birth_date && p.latitude != null && p.longitude != null && p.timezone
      ? {
          name: p.display_name ?? "",
          date: p.birth_date,
          time: trimTime(p.birth_time),
          place: { name: p.birth_place ?? "", latitude: p.latitude, longitude: p.longitude, timezone: p.timezone },
        }
      : { name: p?.display_name ?? "", date: "", time: null, place: null };

  return (
    <div className="mx-auto max-w-xl py-4 sm:py-10">
      <BirthWizard initial={initial} editing={!!p?.onboarded_at} />
    </div>
  );
}
