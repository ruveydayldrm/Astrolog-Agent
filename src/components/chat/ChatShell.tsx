"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon, PlusIcon, SendIcon, SparkleIcon } from "@/components/icons/AstroIcons";
import { Notice } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { STREAM_ERROR_MARKER } from "@/lib/lyra/protocol";
import { RichText } from "./RichText";
import { ThinkingIndicator } from "./ThinkingIndicator";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updated_at: string;
}

const SUGGESTIONS = [
  "Bugünkü transitlerim bana ne anlatıyor?",
  "Venüs'üm aşk hayatımı nasıl etkiliyor?",
  "Haritamdaki en güçlü yanım ne?",
  "Bu ay kariyerimde nelere dikkat etmeliyim?",
];

/** Hafızayı sohbet bitince güncellemek için sayfa kapanırken bile güvenilir çağrı. */
function flushMemory(conversationId: string | null) {
  if (!conversationId) return;
  const body = JSON.stringify({ conversationId });
  if (!navigator.sendBeacon?.("/api/memory", new Blob([body], { type: "application/json" }))) {
    void fetch("/api/memory", { method: "POST", body, keepalive: true });
  }
}

export function ChatShell({
  initialConversationId,
  initialMessages,
  conversations: initialConversations,
  userName,
}: {
  initialConversationId: string | null;
  initialMessages: ChatMessage[];
  conversations: ConversationSummary[];
  userName: string;
}) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState(initialMessages);
  const [conversations, setConversations] = useState(initialConversations);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dirtyRef = useRef(false); // hafızaya işlenmemiş yeni mesaj var mı?
  const convRef = useRef(conversationId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    convRef.current = conversationId;
  }, [conversationId]);

  // Sayfadan ayrılırken (sekme kapanması dahil) hafızayı güncelle
  useEffect(() => {
    const onHide = () => {
      if (dirtyRef.current) {
        flushMemory(convRef.current);
        dirtyRef.current = false;
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      onHide(); // istemci içi gezinmede de
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || streaming) return;
      setError(null);
      setInput("");
      setStreaming(true);

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
      const assistantId = crypto.randomUUID();
      setMessages((m) => [...m, userMsg, { id: assistantId, role: "assistant", content: "" }]);

      const updateAssistant = (fn: (c: string) => string) =>
        setMessages((m) => m.map((msg) => (msg.id === assistantId ? { ...msg, content: fn(msg.content) } : msg)));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convRef.current, message: content }),
        });

        if (!res.ok || !res.body) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.message ?? "Lyra'ya ulaşamadık. Bağlantını kontrol edip tekrar dener misin?");
        }

        const newId = res.headers.get("X-Conversation-Id");
        if (newId && newId !== convRef.current) {
          convRef.current = newId;
          setConversationId(newId);
          setConversations((c) => [{ id: newId, title: content.slice(0, 60), updated_at: new Date().toISOString() }, ...c]);
          // Yeniden yüklemeden URL'i güncelle
          window.history.replaceState(null, "", `/sohbet/${newId}`);
        }
        dirtyRef.current = true;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const markerAt = buffer.indexOf(STREAM_ERROR_MARKER);
          if (markerAt >= 0) {
            setError(buffer.slice(markerAt + STREAM_ERROR_MARKER.length));
            buffer = buffer.slice(0, markerAt);
          }
          const snapshot = buffer;
          updateAssistant(() => snapshot);
        }
        if (!buffer.trim()) setMessages((m) => m.filter((msg) => msg.id !== assistantId));
      } catch (e) {
        setMessages((m) => m.filter((msg) => msg.id !== assistantId));
        setError((e as Error).message);
        setInput(content);
      } finally {
        setStreaming(false);
        textareaRef.current?.focus();
      }
    },
    [streaming],
  );

  const newChat = () => {
    if (dirtyRef.current) flushMemory(convRef.current);
    dirtyRef.current = false;
    setDrawerOpen(false);
    convRef.current = null;
    setConversationId(null);
    setMessages([]);
    setError(null);
    window.history.replaceState(null, "", "/sohbet");
  };

  const openConversation = (id: string) => {
    if (dirtyRef.current) flushMemory(convRef.current);
    dirtyRef.current = false;
    setDrawerOpen(false);
    router.push(`/sohbet/${id}`);
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <button
        onClick={newChat}
        className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-gold-500/30 px-4 py-3 text-sm text-gold-300 transition hover:bg-gold-500/10"
      >
        <PlusIcon className="h-4 w-4" /> Yeni sohbet
      </button>
      <p className="mb-2 px-2 text-[11px] uppercase tracking-[0.2em] text-silver-500">Geçmiş sohbetler</p>
      <ul className="flex-1 space-y-1 overflow-y-auto">
        {conversations.length === 0 && <li className="px-2 text-sm text-silver-500">Henüz sohbet yok.</li>}
        {conversations.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => openConversation(c.id)}
              className={cn(
                "w-full truncate rounded-xl px-3 py-2.5 text-left text-sm transition",
                c.id === conversationId ? "bg-gold-500/10 text-gold-300" : "text-silver-300 hover:bg-white/5",
              )}
            >
              {c.title}
              <span className="block text-[11px] text-silver-500">
                {new Date(c.updated_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="grid h-[calc(100dvh-12rem)] gap-6 md:h-[calc(100dvh-8.5rem)] md:grid-cols-[260px_1fr]">
      {/* Masaüstü kenar çubuğu */}
      <aside className="glass hidden rounded-3xl p-4 md:block">{sidebar}</aside>

      {/* Mobil çekmece */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/60 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} />
            <motion.aside
              className="glass fixed inset-y-0 left-0 z-50 w-72 rounded-r-3xl p-4 md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              <button onClick={() => setDrawerOpen(false)} className="mb-3 ml-auto block text-silver-300" aria-label="Kapat">
                <CloseIcon className="h-5 w-5" />
              </button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <section className="glass flex min-h-0 flex-col rounded-3xl">
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 sm:px-6">
          <button onClick={() => setDrawerOpen(true)} className="text-silver-300 md:hidden" aria-label="Sohbet geçmişi">
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 text-gold-400">
            <SparkleIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-serif text-xl leading-none text-silver-100">Lyra</p>
            <p className="text-[11px] text-silver-500">Haritanı ve sohbetlerinizi hatırlıyor</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6" aria-live="polite">
          {messages.length === 0 ? (
            <EmptyState name={userName} onPick={send} />
          ) : (
            <div className="mx-auto max-w-2xl space-y-5">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    layout="position"
                    initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-3xl px-5 py-3.5 text-[15px] leading-relaxed",
                        m.role === "user"
                          ? "rounded-br-lg bg-gradient-to-br from-night-600/80 to-night-700/80 text-silver-100"
                          : "rounded-bl-lg border border-gold-500/15 bg-night-900/50 text-silver-100",
                      )}
                    >
                      {m.role === "assistant" && !m.content ? <ThinkingIndicator /> : m.role === "assistant" ? <RichText text={m.content} /> : m.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/5 p-3 sm:p-4">
          {error && <Notice className="mx-auto mb-3 max-w-2xl">{error}</Notice>}
          <form
            className="mx-auto flex max-w-2xl items-end gap-2 rounded-3xl border border-white/10 bg-night-900/60 p-2 focus-within:border-gold-500/50"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              maxLength={4000}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Lyra'ya bir şey sor…"
              aria-label="Mesajın"
              className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] text-silver-100 outline-none placeholder:text-silver-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              aria-label="Gönder"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-gold-400 to-gold-600 text-night-900 transition hover:brightness-110 disabled:opacity-40"
            >
              <SendIcon className="h-5 w-5" />
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-silver-500">
            Lyra bir öz-farkındalık rehberidir; önemli kararlarda bir uzmana danış. ·{" "}
            <Link href="/ayarlar" className="underline-offset-2 hover:underline">
              Hafızayı yönet
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ name, onPick }: { name: string; onPick: (t: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="text-gold-400">
        <SparkleIcon className="h-10 w-10" strokeWidth={1} />
      </motion.div>
      <h2 className="mt-4 font-serif text-3xl text-silver-100 sm:text-4xl">Merhaba {name} 🌙</h2>
      <p className="mt-2 text-sm text-silver-300">Haritan ve bugünün gökyüzü önümde. Neyi merak ediyorsun?</p>
      <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-silver-300 transition hover:border-gold-500/40 hover:text-silver-100"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
