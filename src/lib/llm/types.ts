/**
 * Sağlayıcıdan bağımsız LLM arayüzü.
 * Uygulama yalnızca bu arayüzü kullanır; Gemini ↔ Claude geçişi tek bir ortam değişkenidir.
 */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** "chat" = Lyra sohbeti (kalite önemli), "utility" = hafıza çıkarımı ve günlük not (hız/ucuzluk önemli). */
export type ModelRole = "chat" | "utility";

export interface StreamChatOptions {
  system: string;
  messages: ChatTurn[];
}

export interface CompleteOptions {
  role: ModelRole;
  system: string;
  prompt: string;
  /** Verilirse yanıt bu JSON şemasına uygun JSON metni olarak istenir. */
  jsonSchema?: Record<string, unknown>;
  maxTokens?: number;
}

export interface LLMProvider {
  readonly name: "gemini" | "anthropic";
  /** Metin parçalarını üretir. Model içerik politikası nedeniyle reddederse hiçbir şey üretmeden biter. */
  streamChat(opts: StreamChatOptions): AsyncIterable<string>;
  /** Tek seferlik tamamlama. Reddedilirse null döner. */
  complete(opts: CompleteOptions): Promise<string | null>;
}
