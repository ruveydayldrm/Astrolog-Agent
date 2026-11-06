import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AppError } from "../errors";

/**
 * Claude istemcisi — YALNIZCA sunucuda. API anahtarı process.env'den okunur
 * ve hiçbir zaman istemci paketine girmez ("server-only" bunu derleme anında garanti eder).
 */
let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new AppError("LLM_NOT_CONFIGURED");
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 });
  return client;
}

/** Sohbet modeli ve yardımcı (hafıza / günlük not) modeli; .env ile değiştirilebilir. */
export const CHAT_MODEL = process.env.LYRA_CHAT_MODEL ?? "claude-opus-5-5";
export const UTILITY_MODEL = process.env.LYRA_UTILITY_MODEL ?? "claude-opus-5-5";

/** Sunucu tarafı reddetme yedeği (server-side fallback) destekleyen modeller. */
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);

/**
 * Model güvenlik sınıflandırıcısı bir isteği reddederse, API aynı isteği
 * önerilen yedek modelde otomatik olarak yeniden çalıştırır.
 */
export function fallbackParams(model: string) {
  return FALLBACK_MODELS.has(model)
    ? { betas: ["server-side-fallback-2026-07-01"] as Anthropic.Beta.AnthropicBeta[], fallbacks: "default" as const }
    : {};
}

/** Anthropic SDK hatalarını uygulama hata koduna çevirir. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Anthropic.RateLimitError) return new AppError("LLM_UNAVAILABLE", "rate limited");
  if (err instanceof Anthropic.AuthenticationError) return new AppError("LLM_NOT_CONFIGURED", "invalid key");
  if (err instanceof Anthropic.APIError) return new AppError("LLM_UNAVAILABLE", `api ${err.status}`);
  return new AppError("UNKNOWN", String(err));
}
