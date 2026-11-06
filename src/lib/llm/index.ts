import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ApiError as GeminiApiError } from "@google/genai";
import { AppError } from "../errors";
import { createAnthropicProvider } from "./anthropic";
import { createGeminiProvider } from "./gemini";
import type { LLMProvider } from "./types";

export type { ChatTurn, LLMProvider } from "./types";

let cached: LLMProvider | null = null;

/**
 * Etkin LLM sağlayıcısı. LLM_PROVIDER ile seçilir ("gemini" | "anthropic");
 * belirtilmezse anahtarı tanımlı olan kullanılır (önce ücretsiz Gemini).
 * Anahtarlar yalnızca sunucuda okunur ("server-only").
 */
export function getLLM(): LLMProvider {
  if (cached) return cached;
  const gemini = process.env.GEMINI_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;
  const choice = process.env.LLM_PROVIDER ?? (gemini ? "gemini" : anthropic ? "anthropic" : null);

  if (choice === "gemini" && gemini) cached = createGeminiProvider(gemini);
  else if (choice === "anthropic" && anthropic) cached = createAnthropicProvider(anthropic);
  else throw new AppError("LLM_NOT_CONFIGURED");
  return cached;
}

/** Sağlayıcı SDK hatalarını uygulama hata koduna çevirir. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof GeminiApiError) {
    if (err.status === 400 && /API key/i.test(err.message)) return new AppError("LLM_NOT_CONFIGURED", err.message);
    if (err.status === 401 || err.status === 403) return new AppError("LLM_NOT_CONFIGURED", err.message);
    return new AppError(err.status === 429 ? "LLM_BUSY" : "LLM_UNAVAILABLE", `gemini ${err.status}: ${err.message}`);
  }
  if (err instanceof Anthropic.AuthenticationError) return new AppError("LLM_NOT_CONFIGURED", "invalid key");
  if (err instanceof Anthropic.RateLimitError) return new AppError("LLM_BUSY", "rate limited");
  if (err instanceof Anthropic.APIError) return new AppError("LLM_UNAVAILABLE", `anthropic ${err.status}`);
  return new AppError("UNKNOWN", String(err));
}
