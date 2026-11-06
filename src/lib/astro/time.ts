import { DateTime } from "luxon";

/**
 * Yerel doğum tarih/saatini IANA saat dilimiyle UTC'ye çevirir.
 * Luxon tarihsel saat dilimi kurallarını (ör. Türkiye'nin 2016 öncesi yaz saati) uygular.
 *
 * @param date  "YYYY-MM-DD"
 * @param time  "HH:mm" veya null (bilinmiyorsa öğlen 12:00 kullanılır)
 */
export function localToUtc(date: string, time: string | null, timeZone: string): Date {
  const iso = `${date}T${time ?? "12:00"}`;
  const dt = DateTime.fromISO(iso, { zone: timeZone });
  if (!dt.isValid) throw new Error(`Geçersiz tarih/saat veya saat dilimi: ${iso} ${timeZone}`);
  return dt.toUTC().toJSDate();
}

/** Belirli bir saat diliminde bugünün tarihini "YYYY-MM-DD" olarak verir. */
export function todayIn(timeZone: string, now = new Date()): string {
  return DateTime.fromJSDate(now, { zone: timeZone }).toISODate() ?? now.toISOString().slice(0, 10);
}
