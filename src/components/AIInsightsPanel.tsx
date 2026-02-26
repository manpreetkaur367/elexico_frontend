import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, CheckCircle2, Trash2, Pencil, Check, X, BookOpen, Volume2, Mic, MicOff } from "lucide-react";
import type { Slide } from "../data/slides";
import AISummaryPlayer from "./AISummaryPlayer";
import { useTTS, useSTT, globalStop } from "../hooks/useSpeech";

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "") as string;

// Put working models FIRST — ones with quota available
const GEMINI_MODELS = [
  "gemma-3-4b-it",
  "gemma-3-1b-it",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
];

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

async function getAIResponse(question: string, slide: Slide): Promise<string> {
  const prompt = `You are ElexicoAI, a concise AI assistant inside a learning app.

STRICT RULES — follow these exactly:
1. Answer in 2-3 short, simple sentences ONLY. Never more.
2. Use plain, easy-to-understand language. No jargon unless asked.
3. Answer ANY question asked — backend, general knowledge, science, math, history, anything.
4. Never use bullet points, lists, or headers. Just plain sentences.
5. Never say you can't answer or that something is out of scope.

Current slide (for context only if relevant): "${slide.title}"

Question: ${question}

Answer in 2-3 sentences:`;

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(geminiUrl(model), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 150 },
        }),
      });

      const data = await res.json();

      // If quota exceeded or permission denied, try the next model
      if (res.status === 429 || res.status === 403 || data?.error?.code === 429 || data?.error?.code === 403) {
        console.warn(`Model ${model} unavailable (${res.status}), trying next...`);
        continue;
      }

      if (!res.ok) {
        console.warn(`Model ${model} error ${res.status}, trying next...`);
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;

    } catch (err) {
      console.error(`Model ${model} fetch failed:`, err);
      continue;
    }
  }

  // All models exhausted — return fallback
  return `All AI models are currently at their daily limit. Here's a quick note from the slide: ${slide.aiInsight}`;
}

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

interface AIInsightsPanelProps {
  slide: Slide;
}

export default function AIInsightsPanel({ slide }: AIInsightsPanelProps) {
  // Store messages per slide — switching slides never deletes history
  const [allMessages, setAllMessages] = useState<Record<number, Message[]>>({});
  const messages = allMessages[slide.id] ?? [];
  const setMessages = (updater: Message[] | ((prev: Message[]) => Message[])) => {
    setAllMessages((prev) => {
      const current = prev[slide.id] ?? [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [slide.id]: next };
    });
  };

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "chat" | "listen">("summary");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── TTS: one instance drives all audio in this panel ──
  const [ttsText, setTtsText] = useState("");
  const tts = useTTS(ttsText);

  // ── STT: voice input ──
  const stt = useSTT((transcript) => {
    setInput(prev => (prev ? prev + " " + transcript : transcript));
  });

  // ── Smart audio switching: read a new piece of text, stopping whatever plays ──
  const readAloud = (text: string) => {
    globalStop();
    setTtsText(text);
    // speak on next tick after ttsText state updates
    setTimeout(() => tts.speak(text), 60);
  };

  // Stop audio when slide changes
  const prevSlideId = useRef(slide.id);
  useEffect(() => {
    if (prevSlideId.current !== slide.id) {
      globalStop();
      setTtsText("");
      prevSlideId.current = slide.id;
    }
  }, [slide.id]);

  const uid = () => Math.random().toString(36).slice(2);

  // When switching slides, just switch to summary tab — messages are preserved
  useEffect(() => {
    if (prevSlideId.current !== slide.id) {
      setActiveTab("summary");
      setEditingId(null);
    }
  }, [slide.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: uid(), role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setActiveTab("chat");
    const reply = await getAIResponse(text, slide);
    setMessages((prev) => [...prev, { id: uid(), role: "ai", text: reply }]);
    setIsTyping(false);
    // Auto-read the AI reply
    readAloud(reply);
  };

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const confirmEdit = async (id: string) => {
    if (!editText.trim()) return;
    const idx = messages.findIndex((m) => m.id === id);
    setMessages((prev) => prev.slice(0, idx));
    setEditingId(null);
    setEditText("");
    await sendMessage(editText.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // ── TTS mini-controls (shown when audio is active) ──
  const isAudioActive = tts.state === "playing" || tts.state === "paused";
  const AudioBar = () => isAudioActive ? (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex items-center gap-2 px-4 py-2 mx-4 mb-1 rounded-xl"
      style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
    >
      {tts.state === "playing" && (
        <div className="flex gap-0.5 items-end h-3">
          {[0,1,2,3].map(i => (
            <motion.div key={i}
              animate={{ height: ["4px","10px","4px"] }}
              transition={{ duration: 0.6, delay: i*0.12, repeat: Infinity }}
              className="w-0.5 rounded-full bg-blue-500"
            />
          ))}
        </div>
      )}
      <span className="text-[11px] font-bold text-blue-600 flex-1 truncate">
        {tts.state === "playing" ? "Speaking…" : "Paused"}
      </span>
      <button onClick={tts.state === "playing" ? tts.pause : tts.play}
        className="text-[10px] font-black text-blue-600 px-2 py-0.5 rounded-lg hover:bg-blue-100 transition-all">
        {tts.state === "playing" ? "Pause" : "Resume"}
      </button>
      <button onClick={tts.stop}
        className="text-[10px] font-black text-red-400 px-2 py-0.5 rounded-lg hover:bg-red-50 transition-all">
        Stop
      </button>
    </motion.div>
  ) : null;

  return (
    <div className="flex flex-col h-full" style={{ background: "#ffffff" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0 relative overflow-hidden"
        style={{ borderBottom: "1px solid #e8edf5" }}>
        {/* Blue glow behind header */}
        <div className="absolute top-0 right-0 w-40 h-20 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #2563eb18 0%, transparent 70%)",
            transform: "translate(20%, -20%)",
          }} />
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              boxShadow: "0 4px 16px #2563eb50",
            }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[15px] font-black text-gray-900 tracking-tight">AI Insights</p>
            <p className="text-[11px] text-gray-500 font-medium">Powered by ElexicoAI</p>
          </div>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex px-4 pt-3.5 pb-2 gap-1.5 flex-shrink-0">
        {(["summary", "listen", "chat"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 text-[12px] font-black rounded-xl capitalize transition-all tracking-wide items-center justify-center flex gap-1.5"
            style={activeTab === tab
              ? { background: "#2563eb1e", color: "#2563eb", borderColor: "#2563eb35", border: "1px solid" }
              : { background: "transparent", color: "#94a3b8", borderColor: "transparent", border: "1px solid" }
            }
          >
            {tab === "listen" ? "🎧 Listen" : tab}
            {tab === "chat" && messages.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-1.5 py-0.5 rounded-full text-[9px] font-black"
                style={{ background: "#2563eb", color: "#fff" }}>
                {messages.filter(m => m.role === "ai").length}
              </motion.span>
            )}
          </button>
        ))}
      </div>

      {/* ══ SUMMARY TAB ══ */}
      <AnimatePresence mode="wait">
        {activeTab === "summary" && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin min-h-0"
          >
            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.14em]">What is it?</span>
                <button
                  onClick={() => readAloud(slide.description)}
                  title="Read aloud"
                  className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all text-[10px] font-bold"
                  style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}
                >
                  <Volume2 className="w-3 h-3" /> Listen
                </button>
              </div>
              <p className="text-[13px] text-gray-600 leading-relaxed">{slide.description}</p>
            </div>

            {/* Key Points */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.14em]">Key Points</span>
                <button
                  onClick={() => readAloud(slide.keyPoints.join(". "))}
                  title="Read key points aloud"
                  className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all text-[10px] font-bold"
                  style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}
                >
                  <Volume2 className="w-3 h-3" /> Listen
                </button>
              </div>
              <ul className="space-y-2">
                {slide.keyPoints.map((point, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.06 }}
                    className="flex items-start gap-2.5">
                    <div className="mt-[5px] w-4 h-4 rounded-md flex-shrink-0 flex items-center justify-center"
                      style={{ background: "#2563eb16", border: "1px solid #2563eb28" }}>
                      <span className="w-1.5 h-1.5 rounded-full block bg-blue-600" />
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed">{point}</p>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Ask AI suggestions */}
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.14em] mb-2.5">Ask AI</p>
              <div className="flex flex-col gap-2">
                {slide.chatSuggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    whileHover={{ x: 3 }}
                    onClick={() => sendMessage(s)}
                    className="text-left text-[12px] px-4 py-2.5 rounded-xl transition-all border font-medium"
                    style={{ color: "#2563eb", borderColor: "#2563eb20", background: "#2563eb08" }}
                  >
                    → {s}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ LISTEN TAB ══ */}
        {activeTab === "listen" && (
          <motion.div
            key="listen"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto scrollbar-thin min-h-0"
          >
            <AISummaryPlayer slide={slide} />
          </motion.div>
        )}

        {/* ══ CHAT TAB ══ */}
        {activeTab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin min-h-0">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                    <Bot className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 text-center leading-relaxed">
                    Ask me anything about<br />
                    <span className="text-gray-700 font-bold">{slide.title}</span>
                  </p>
                </div>
              )}

              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22 }}
                    className={`flex gap-2.5 group ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    onMouseEnter={() => setHoveredId(msg.id)}
                    onMouseLeave={() => { setHoveredId(null); }}
                  >
                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
                      style={msg.role === "ai"
                        ? { background: "#2563eb22", border: "1px solid #2563eb30" }
                        : { background: "#2563eb" }}>
                      {msg.role === "user"
                        ? <User className="w-3.5 h-3.5 text-white" />
                        : <Bot className="w-3.5 h-3.5 text-blue-600" />}
                    </div>

                    {/* Bubble + action buttons */}
                    <div className={`flex flex-col gap-1 max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}>

                      {/* Edit mode for user messages */}
                      {editingId === msg.id ? (
                        <div className="flex flex-col gap-2 w-full">
                          <textarea
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="text-[13px] px-3 py-2 rounded-xl outline-none resize-none w-full"
                            style={{ background: "#fff", border: "2px solid #2563eb", color: "#1e293b", minWidth: "180px" }}
                          />
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={cancelEdit}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                              style={{ background: "#f1f5f9", color: "#64748b" }}>
                              <X className="w-3 h-3" /> Cancel
                            </button>
                            <button onClick={() => confirmEdit(msg.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                              style={{ background: "#2563eb", color: "#fff" }}>
                              <Check className="w-3 h-3" /> Send
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed border ${
                            msg.role === "user"
                              ? "bg-blue-600 text-white rounded-tr-sm border-transparent"
                              : "rounded-tl-sm text-gray-700"
                          }`}
                            style={msg.role === "ai" ? { background: "#f1f5f9", borderColor: "#e2e8f0" } : {}}>
                            {msg.text}
                          </div>

                          {/* Action buttons — appear on hover */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: hoveredId === msg.id ? 1 : 0 }}
                            className={`flex gap-1 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                          >
                            {/* Read aloud — AI messages only */}
                            {msg.role === "ai" && (
                              <button
                                onClick={() => readAloud(msg.text)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                                style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                                <Volume2 className="w-2.5 h-2.5" /> Read
                              </button>
                            )}
                            {/* Edit — user messages only */}
                            {msg.role === "user" && (
                              <button
                                onClick={() => startEdit(msg)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                                style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                                <Pencil className="w-2.5 h-2.5" /> Edit
                              </button>
                            )}
                            {/* Delete — all messages */}
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                              style={{ background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3" }}>
                              <Trash2 className="w-2.5 h-2.5" /> Delete
                            </button>
                          </motion.div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5 items-center">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ background: "#2563eb22", border: "1px solid #2563eb30" }}>
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 border"
                    style={{ background: "#f1f5f9", borderColor: "#e2e8f0" }}>
                    {[0, 1, 2].map((j) => (
                      <motion.div key={j}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, delay: j * 0.15, repeat: Infinity }}
                        className="w-2 h-2 rounded-full"
                        style={{ background: "#2563eb" }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion chips */}
            {messages.length === 0 && (
              <div className="px-5 pb-3 flex flex-col gap-2 flex-shrink-0">
                {slide.chatSuggestions.map((s, i) => (
                  <motion.button key={i} whileHover={{ x: 2 }}
                    onClick={() => sendMessage(s)}
                    className="text-left text-[12px] px-4 py-2.5 rounded-xl border transition-all font-medium"
                    style={{ color: "#2563eb", borderColor: "#2563eb25", background: "#2563eb0a" }}>
                    → {s}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat input (always visible) ── */}
      <div className="px-4 pb-5 pt-3.5 flex-shrink-0"
        style={{ borderTop: "1px solid #e8edf5" }}>
        {/* Audio status bar */}
        <AudioBar />

        {/* STT error banner */}
        <AnimatePresence>
          {stt.error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mx-4 mb-2 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2"
              style={{ background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3" }}
            >
              <span className="text-[13px]">
                {stt.error === "not-allowed" ? "🔒" : stt.error === "no-speech" ? "🎤" : "⚠️"}
              </span>
              {stt.error === "not-allowed"
                ? "Microphone access denied. Please allow microphone in browser settings."
                : stt.error === "no-speech"
                ? "No speech detected. Try speaking louder or closer."
                : "Microphone error. Please try again."}
            </motion.div>
          )}
        </AnimatePresence>

        {/* STT interim live preview */}
        <AnimatePresence>
          {stt.listening && stt.interim && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-4 mb-2 px-3 py-2 rounded-xl text-[12px] italic flex items-center gap-2"
              style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"
              />
              {stt.interim}…
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={stt.listening ? "Listening… speak now" : `Ask about ${slide.title}...`}
              className="w-full text-[13px] px-4 py-3 rounded-xl outline-none transition-all placeholder-gray-400 text-gray-800 font-medium"
              style={{
                background: stt.listening ? "#fef2f2" : "#f8faff",
                border: `1px solid ${stt.listening ? "#fca5a5" : "#e2e8f0"}`,
              }}
              onFocus={(e) => {
                if (!stt.listening) {
                  e.target.style.borderColor = "#2563eb50";
                  e.target.style.background = "#ffffff";
                }
              }}
              onBlur={(e) => {
                if (!stt.listening) {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.background = "#f8faff";
                }
              }}
            />
          </div>

          {/* Voice input button */}
          {stt.supported && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={stt.listening ? stt.stop : stt.start}
              title={stt.listening ? "Stop recording" : "Speak your question"}
              className="relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: stt.listening
                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                  : "#f1f5f9",
                border: `1px solid ${stt.listening ? "#ef444440" : "#e2e8f0"}`,
                boxShadow: stt.listening ? "0 2px 16px #ef444460" : "none",
              }}
            >
              {/* Pulse ring when active */}
              {stt.listening && (
                <motion.span
                  animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "#ef444430" }}
                />
              )}
              {stt.listening
                ? <MicOff className="w-4 h-4 text-white relative z-10" />
                : <Mic className="w-4 h-4 text-gray-500" />}
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-11 h-11 rounded-xl flex items-center justify-center disabled:opacity-25 transition-all flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              boxShadow: "0 2px 14px #2563eb35",
            }}
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
