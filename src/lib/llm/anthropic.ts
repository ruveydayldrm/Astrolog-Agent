import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { CompleteOptions, LLMProvider, ModelRole, StreamChatOptions } from "./types";

/** Anthropic Claude sağlayıcısı (ücretli, isteğe bağlı). */
const MODELS: Record<ModelRole, string> = {
  chat: process.env.LYRA_CHAT_MODEL ?? "claude-opus-5-5",
  utility: process.env.LYRA_UTILITY_MODEL ?? "claude-opus-5-5",
};

/** Sunucu tarafı reddetme yedeğini destekleyen modeller. */
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);

/** Güvenlik sınıflandırıcısı reddederse API isteği önerilen yedek modelde yeniden çalıştırır. */
function fallbackParams(model: string) {
  return FALLBACK_MODELS.has(model)
    ? { betas: ["server-side-fallback-2026-07-01"] as Anthropic.Beta.AnthropicBeta[], fallbacks: "default" as const }
    : {};
}

export function createAnthropicProvider(apiKey: string): LLMProvider {
  const client = new Anthropic({ apiKey, maxRetries: 2 });

  return {
    name: "anthropic",

    async *streamChat({ system, messages }: StreamChatOptions) {
      const stream = client.beta.messages.stream({
        model: MODELS.chat,
        max_tokens: 16000,
        ...fallbackParams(MODELS.chat),
        output_config: { effort: "medium" },
        // Sistem promptu gün içinde sabit → önbelleğe alınır
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
      }
    },

    async complete({ role, system, prompt, jsonSchema, maxTokens }: CompleteOptions) {
      const model = MODELS[role];
      const res = await client.beta.messages.create({
        model,
        max_tokens: maxTokens ?? 8000,
        ...fallbackParams(model),
        output_config: { effort: "low", ...(jsonSchema ? { format: { type: "json_schema" as const, schema: jsonSchema } } : {}) },
        system,
        messages: [{ role: "user", content: prompt }],
      });
      if (res.stop_reason === "refusal") return null;
      return res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim() || null;
    },
  };
}
