/** İstemci ve sunucunun paylaştığı küçük sohbet protokolü sabitleri. */

/** Akış ortasında oluşan hatayı istemciye bildiren işaret; ardından gelen metin kullanıcıya gösterilir. */
export const STREAM_ERROR_MARKER = "\u0000LYRA_ERROR:";

/** Şehir arama sonucu (/api/geocode). */
export interface PlaceResult {
  id: number;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
