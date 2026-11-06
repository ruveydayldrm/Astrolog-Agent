import "server-only";
import { GoogleGenAI, type Content } from "@google/genai";
import type { ChatTurn, CompleteOptions, LLMProvider, ModelRole, StreamChatOptions } from "./types";

/**
 * Google Gemini sağlayıcısı — ücretsiz katmanla çalışır (aistudio.google.com/apikey).
 * "-latest" takma adları her zaman en güncel Flash modeline işaret eder.
 */
const MODELS: Record<ModelRole, string> = {
  chat: process.env.GEMINI_CHAT_MODEL ?? "gemini-flash-latest",
  utility: process.env.GEMINI_UTILITY_MODEL ?? "gemini-flash-lite-latest",
};

function toContents(messages: ChatTurn[]): Content[] {
  return messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
}

/** Gemini'nin JSON şeması alt kümesinde olmayan alanları temizler. */
function stripUnsupported(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(stripUnsupported);
  if (schema && typeof schema === "object") {
    return Object.fromEntries(
      Object.entries(schema)
        .filter(([k]) => k !== "additionalProperties")
        .map(([k, v]) => [k, stripUnsupported(v)]),
    );
  }
  return schema;
}

export function createGeminiProvider(apiKey: string): LLMProvider {
  const ai = new GoogleGenAI({ apiKey });

  return {
    name: "gemini",

    async *streamChat({ system, messages }: StreamChatOptions) {
      const stream = await ai.models.generateContentStream({
        model: MODELS.chat,
        contents: toContents(messages),
        config: { systemInstruction: system, maxOutputTokens: 4096, temperature: 0.8 },
      });
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) yield text;
      }
    },

    async complete({ role, system, prompt, jsonSchema, maxTokens }: CompleteOptions) {
      const res = await ai.models.generateContent({
        model: MODELS[role],
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: system,
          maxOutputTokens: maxTokens ?? 2048,
          ...(jsonSchema ? { responseMimeType: "application/json", responseJsonSchema: stripUnsupported(jsonSchema) } : {}),
        },
      });
      if (res.promptFeedback?.blockReason) return null;
      return res.text?.trim() || null;
    },
  };
}
