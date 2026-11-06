/**
 * Uygulama genelinde hata kodları ve kullanıcıya gösterilecek nazik Türkçe mesajlar.
 * API'ler { error: code, message } döner; istemci message'ı doğrudan gösterebilir.
 */
export const ERRORS = {
  UNAUTHORIZED: { status: 401, message: "Oturumun sona ermiş görünüyor. Lütfen tekrar giriş yap." },
  NOT_ONBOARDED: { status: 409, message: "Önce doğum bilgilerini tamamlamamız gerekiyor." },
  RATE_LIMITED: { status: 429, message: "Biraz soluklanalım mı? Kısa bir süre sonra tekrar yazabilirsin. 🌙" },
  INVALID_INPUT: { status: 400, message: "Gönderdiğin bilgilerde bir eksiklik var, kontrol edip tekrar dener misin?" },
  NOT_FOUND: { status: 404, message: "Aradığın şeyi yıldızlar arasında bulamadık." },
  LLM_UNAVAILABLE: { status: 503, message: "Lyra şu an gökyüzüne dalmış, birazdan tekrar dener misin?" },
  LLM_NOT_CONFIGURED: { status: 503, message: "Lyra henüz yapılandırılmamış (ANTHROPIC_API_KEY eksik)." },
  GEOCODE_FAILED: { status: 502, message: "Şehir aramasında bir sorun oldu. Biraz sonra tekrar dene." },
  DB_ERROR: { status: 500, message: "Bilgilerini kaydederken bir aksilik oldu. Lütfen tekrar dene." },
  UNKNOWN: { status: 500, message: "Beklenmedik bir şey oldu. Tekrar dener misin?" },
} as const;

export type ErrorCode = keyof typeof ERRORS;

export class AppError extends Error {
  constructor(public code: ErrorCode, detail?: string) {
    super(detail ?? ERRORS[code].message);
  }
}

/** Route handler'lardan tutarlı JSON hata yanıtı üretir. */
export function errorResponse(code: ErrorCode): Response {
  const e = ERRORS[code];
  return Response.json({ error: code, message: e.message }, { status: e.status });
}

/** Bilinmeyen bir hatayı kayıt altına alıp uygun yanıta çevirir. */
export function handleRouteError(err: unknown): Response {
  if (err instanceof AppError) return errorResponse(err.code);
  console.error("[lyra] beklenmeyen hata:", err);
  return errorResponse("UNKNOWN");
}
