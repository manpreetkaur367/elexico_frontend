import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, CheckCircle2, Trash2, Pencil, Check, X, BookOpen, Volume2, Mic, MicOff, MessageCircle, Headphones, FileText, Pause, Play, Square } from "lucide-react";
import type { Slide } from "../data/slides";
import AISummaryPlayer from "./AISummaryPlayer";
import { useTTS, useSTT, globalStop } from "../hooks/useSpeech";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "https://elexico-backend-ye1c.onrender.com") as string;

// ── AI-generated summary for the Summary tab ──────────────────────────────
async function getAISummaryData(slide: Slide): Promise<{ description: string; keyPoints: string[] }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slideTitle: slide.title,
        slideDescription: slide.description,
        slideKeyPoints: slide.keyPoints,
      }),
    });
    if (res.ok) {
      const data = await res.json() as { description?: string; keyPoints?: string[] };
      if (data.description && Array.isArray(data.keyPoints)) {
        return { description: data.description, keyPoints: data.keyPoints };
      }
    }
  } catch { /* fallback below */ }
  // Fallback to slide data
  return {
    description: slide.aiInsight.split(/[.!?]/)[0].trim() + ".",
    keyPoints: slide.keyPoints.map(kp => kp.split(" ").slice(0, 7).join(" ")),
  };
}

async function getAIResponse(question: string, slide: Slide): Promise<string> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, slideTitle: slide.title }),
    });
    if (res.ok) {
      const data = await res.json() as { reply?: string; error?: string };
      if (data.reply) return data.reply;
    }
  } catch { /* fallback below */ }
  return `AI is currently unavailable. Quick note: ${slide.aiInsight}`;
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

  // ── AI-generated summary (different from slide static content) ──
  const [aiSummary, setAiSummary] = useState<{ description: string; keyPoints: string[] } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    setAiSummary(null);
    setSummaryLoading(true);
    getAISummaryData(slide).then((result) => {
      setAiSummary(result);
      setSummaryLoading(false);
    });
  }, [slide.id]);

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

  // ── TTS mini-controls bar ──
  const isAudioActive = tts.state === "playing" || tts.state === "paused";
  const AudioBar = () => isAudioActive ? (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mx-0 mb-2 overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
        style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "1px solid #bfdbfe" }}>
        {/* Waveform animation */}
        <div className="flex gap-0.5 items-end h-4 flex-shrink-0">
          {[0,1,2,3,4].map(i => (
            <motion.div key={i}
              animate={tts.state === "playing"
                ? { height: ["3px","12px","3px"] }
                : { height: "5px" }}
              transition={{ duration: 0.5, delay: i*0.1, repeat: tts.state === "playing" ? Infinity : 0 }}
              className="w-0.5 rounded-full bg-blue-500"
            />
          ))}
        </div>
        <span className="text-[11px] font-bold text-blue-700 flex-1 truncate">
          {tts.state === "playing" ? "Speaking…" : "⏸ Paused"}
        </span>
        <button onClick={tts.state === "playing" ? tts.pause : tts.play}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-blue-200"
          style={{ background: "#dbeafe", color: "#2563eb" }}>
          {tts.state === "playing"
            ? <Pause className="w-3 h-3" />
            : <Play className="w-3 h-3" />}
        </button>
        <button onClick={tts.stop}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-red-100"
          style={{ background: "#fee2e2", color: "#ef4444" }}>
          <Square className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  ) : null;

  const TABS = [
    { id: "summary" as const, label: "Summary", icon: FileText },
    { id: "listen"  as const, label: "Listen",  icon: Headphones },
    { id: "chat"    as const, label: "Chat",     icon: MessageCircle },
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: "#f8faff" }}>

      {/* ══ HEADER ══ */}
      <div className="px-5 pt-4 pb-3.5 flex-shrink-0 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)" }}>
        {/* decorative blobs */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-20 h-12 pointer-events-none opacity-10"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}>
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-black text-white tracking-tight leading-tight">AI Insights</p>
            <p className="text-[10px] text-blue-200 font-semibold tracking-wide">Powered by ElexicoAI</p>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <motion.div
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[9px] font-black text-white tracking-widest uppercase">Live</span>
          </div>
        </div>

        {/* Slide title chip */}
        <div className="mt-2.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
            <span className="text-[11px] font-bold text-white/90 truncate max-w-[200px]">{slide.title}</span>
          </div>
        </div>
      </div>

      {/* ══ TAB SWITCHER ══ */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0 flex gap-1.5"
        style={{ background: "#f8faff", borderBottom: "1px solid #e8edf5" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            onClick={() => setActiveTab(id)}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-black transition-all tracking-wide relative overflow-hidden"
            style={activeTab === id
              ? { background: "#2563eb", color: "#fff", boxShadow: "0 4px 14px #2563eb40" }
              : { background: "#eef2f9", color: "#94a3b8" }
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {id === "chat" && messages.length > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center"
                style={{ background: activeTab === "chat" ? "rgba(255,255,255,0.3)" : "#2563eb", color: "#fff" }}>
                {messages.filter(m => m.role === "ai").length}
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>

      {/* ══ TAB CONTENT ══ */}
      <AnimatePresence mode="wait">

        {/* ── SUMMARY TAB ── */}
        {activeTab === "summary" && (
          <motion.div key="summary"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
          >
            {/* What is it */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #e8edf5", boxShadow: "0 2px 12px #2563eb08" }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid #f1f5f9", background: "#f8faff" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "#dbeafe" }}>
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.12em]">What is it?</span>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => aiSummary && readAloud(aiSummary.description)}
                  disabled={summaryLoading || !aiSummary}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold disabled:opacity-40"
                  style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                  <Volume2 className="w-2.5 h-2.5" /> Listen
                </motion.button>
              </div>
              <div className="px-4 py-3">
                {summaryLoading || !aiSummary ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3 rounded-full bg-gray-100 w-full" />
                    <div className="h-3 rounded-full bg-gray-100 w-5/6" />
                    <div className="h-3 rounded-full bg-gray-100 w-4/6" />
                  </div>
                ) : (
                  <motion.p
                    key={aiSummary.description}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-[13px] text-gray-700 leading-[1.8]">
                    {aiSummary.description}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Key Points */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #e8edf5", boxShadow: "0 2px 12px #2563eb08" }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid #f1f5f9", background: "#f8faff" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "#d1fae5" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.12em]">Key Points</span>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => aiSummary && readAloud(aiSummary.keyPoints.join(". "))}
                  disabled={summaryLoading || !aiSummary}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold disabled:opacity-40"
                  style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                  <Volume2 className="w-2.5 h-2.5" /> Listen
                </motion.button>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                {summaryLoading || !aiSummary ? (
                  <div className="space-y-3 animate-pulse">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-lg bg-gray-100 flex-shrink-0" />
                        <div className="h-3 rounded-full bg-gray-100 flex-1" style={{ width: `${75 + i * 5}%` }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  aiSummary.keyPoints.map((point, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 + i * 0.055 }}
                      className="flex items-start gap-3">
                      <div className="mt-[5px] w-5 h-5 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black text-blue-600"
                        style={{ background: "#dbeafe", border: "1px solid #bfdbfe" }}>
                        {i + 1}
                      </div>
                      <p className="text-[13px] text-gray-700 leading-relaxed flex-1">{point}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Ask AI */}
            <div>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <div className="h-[2px] w-4 rounded-full bg-blue-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.14em]">Ask AI</span>
                <div className="h-[2px] flex-1 rounded-full bg-gray-100" />
              </div>
              <div className="flex flex-col gap-2">
                {slide.chatSuggestions.map((s, i) => (
                  <motion.button key={i}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.055 }}
                    whileHover={{ x: 4, background: "#2563eb", color: "#fff" }}
                    onClick={() => sendMessage(s)}
                    className="text-left text-[12px] px-4 py-2.5 rounded-xl transition-all font-semibold flex items-center gap-2.5"
                    style={{ color: "#2563eb", border: "1.5px solid #bfdbfe", background: "#eff6ff" }}>
                    <span className="text-[10px] opacity-60">→</span>
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── LISTEN TAB ── */}
        {activeTab === "listen" && (
          <motion.div key="listen"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex-1 overflow-y-auto min-h-0">
            <AISummaryPlayer slide={slide} />
          </motion.div>
        )}

        {/* ── CHAT TAB ── */}
        {activeTab === "chat" && (
          <motion.div key="chat"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex flex-col min-h-0">

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
              {/* Empty state */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-5 py-8">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "1px solid #bfdbfe" }}>
                    <Bot className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-bold text-gray-700">Ask me anything!</p>
                    <p className="text-[12px] text-gray-400 mt-1">About <span className="font-semibold text-blue-500">{slide.title}</span> or anything else</p>
                  </div>
                  {/* Suggestion chips in chat empty state */}
                  <div className="w-full flex flex-col gap-2 mt-1">
                    {slide.chatSuggestions.map((s, i) => (
                      <motion.button key={i}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.07 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => sendMessage(s)}
                        className="text-left text-[12px] px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2"
                        style={{ color: "#2563eb", border: "1.5px solid #bfdbfe", background: "#eff6ff" }}>
                        <span className="opacity-50">→</span> {s}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    onMouseEnter={() => setHoveredId(msg.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={msg.role === "ai"
                        ? { background: "linear-gradient(135deg, #dbeafe, #eff6ff)", border: "1.5px solid #bfdbfe" }
                        : { background: "linear-gradient(135deg, #2563eb, #3b82f6)" }}>
                      {msg.role === "user"
                        ? <User className="w-3.5 h-3.5 text-white" />
                        : <Bot className="w-3.5 h-3.5 text-blue-600" />}
                    </div>

                    <div className={`flex flex-col gap-1.5 max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      {editingId === msg.id ? (
                        <div className="flex flex-col gap-2 w-full">
                          <textarea autoFocus value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="text-[13px] px-3 py-2 rounded-xl outline-none resize-none w-full"
                            style={{ background: "#fff", border: "2px solid #2563eb", color: "#1e293b", minWidth: "180px" }} />
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={cancelEdit}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                              style={{ background: "#f1f5f9", color: "#64748b" }}>
                              <X className="w-3 h-3" /> Cancel
                            </button>
                            <button onClick={() => confirmEdit(msg.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                              style={{ background: "#2563eb", color: "#fff" }}>
                              <Check className="w-3 h-3" /> Send
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={`px-4 py-2.5 text-[13px] leading-relaxed ${
                            msg.role === "user"
                              ? "text-white rounded-2xl rounded-tr-sm"
                              : "text-gray-700 rounded-2xl rounded-tl-sm"
                          }`}
                            style={msg.role === "user"
                              ? { background: "linear-gradient(135deg, #2563eb, #3b82f6)", boxShadow: "0 4px 14px #2563eb30" }
                              : { background: "#fff", border: "1px solid #e8edf5", boxShadow: "0 2px 8px #0000000a" }}>
                            {msg.text}
                          </div>

                          {/* Hover actions */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: hoveredId === msg.id ? 1 : 0 }}
                            className={`flex gap-1 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            {msg.role === "ai" && (
                              <button onClick={() => readAloud(msg.text)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                                style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                                <Volume2 className="w-2.5 h-2.5" /> Read
                              </button>
                            )}
                            {msg.role === "user" && (
                              <button onClick={() => startEdit(msg)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                                style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                                <Pencil className="w-2.5 h-2.5" /> Edit
                              </button>
                            )}
                            <button onClick={() => deleteMessage(msg.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
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

              {/* Typing indicator */}
              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5 items-end">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #dbeafe, #eff6ff)", border: "1.5px solid #bfdbfe" }}>
                    <Bot className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
                    style={{ background: "#fff", border: "1px solid #e8edf5", boxShadow: "0 2px 8px #0000000a" }}>
                    {[0,1,2].map(j => (
                      <motion.div key={j}
                        animate={{ y: [0, -5, 0], background: ["#94a3b8","#2563eb","#94a3b8"] }}
                        transition={{ duration: 0.7, delay: j * 0.15, repeat: Infinity }}
                        className="w-2 h-2 rounded-full" style={{ background: "#94a3b8" }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ INPUT AREA (always visible) ══ */}
      <div className="flex-shrink-0 px-4 pb-4 pt-3"
        style={{ borderTop: "1px solid #e8edf5", background: "#f8faff" }}>

        {/* Audio bar */}
        <AnimatePresence>{isAudioActive && <AudioBar />}</AnimatePresence>

        {/* STT error */}
        <AnimatePresence>
          {stt.error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-2 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2"
              style={{ background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3" }}>
              <span>{stt.error === "not-allowed" ? "🔒" : stt.error === "no-speech" ? "🎤" : "⚠️"}</span>
              {stt.error === "not-allowed"
                ? "Mic access denied — allow in browser settings."
                : stt.error === "no-speech"
                ? "No speech detected — try again."
                : "Microphone error — try again."}
            </motion.div>
          )}
        </AnimatePresence>

        {/* STT live preview */}
        <AnimatePresence>
          {stt.listening && stt.interim && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-2 px-3 py-2 rounded-xl text-[12px] italic flex items-center gap-2"
              style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
              <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
              {stt.interim}…
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Input */}
          <div className="flex-1 relative">
            <input type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={stt.listening ? "🎤 Listening…" : `Ask about ${slide.title}…`}
              className="w-full text-[13px] px-4 py-3 rounded-2xl outline-none transition-all font-medium"
              style={{
                background: stt.listening ? "#fef2f2" : "#fff",
                border: `1.5px solid ${stt.listening ? "#fca5a5" : "#e2e8f0"}`,
                boxShadow: "0 2px 8px #00000008",
                color: "#1e293b",
              }}
              onFocus={(e) => {
                if (!stt.listening) e.target.style.borderColor = "#2563eb60";
              }}
              onBlur={(e) => {
                if (!stt.listening) e.target.style.borderColor = "#e2e8f0";
              }}
            />
          </div>

          {/* Mic button */}
          {stt.supported && (
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              type="button"
              onClick={stt.listening ? stt.stop : stt.start}
              title={stt.listening ? "Stop recording" : "Voice input"}
              className="relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: stt.listening
                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                  : "#fff",
                border: `1.5px solid ${stt.listening ? "transparent" : "#e2e8f0"}`,
                boxShadow: stt.listening ? "0 4px 16px #ef444450" : "0 2px 8px #00000008",
              }}>
              {stt.listening && (
                <motion.span
                  animate={{ scale: [1, 1.7, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: "#ef444428" }} />
              )}
              {stt.listening
                ? <MicOff className="w-4 h-4 text-white relative z-10" />
                : <Mic className="w-4 h-4 text-gray-400" />}
            </motion.button>
          )}

          {/* Send button */}
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all"
            style={{
              background: input.trim()
                ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                : "#e2e8f0",
              boxShadow: input.trim() ? "0 4px 16px #2563eb40" : "none",
            }}>
            <Send className={`w-4 h-4 ${input.trim() ? "text-white" : "text-gray-400"}`} />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
