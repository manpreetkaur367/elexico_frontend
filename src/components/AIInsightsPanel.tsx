import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, Lightbulb, CheckCircle2 } from "lucide-react";
import type { Slide } from "../data/slides";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string ?? "REDACTED";
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

async function getAIResponse(question: string, slide: Slide): Promise<string> {
  try {
    const prompt = `You are ElexicoAI, a smart and friendly AI assistant inside an interactive learning app. \
You have deep expertise in backend engineering, software development, computer science, and general technology topics.

Current slide context (use this for slide-related questions):
- Slide title: "${slide.title}"
- About: ${slide.description}
- Key points: ${slide.keyPoints.join(", ")}

Instructions:
- If the question is related to the current slide or backend engineering, give a focused, educational answer (2-5 sentences).
- If the question is a general knowledge, science, math, history, or any other topic OUTSIDE the slide — answer it normally and helpfully as a general AI assistant. Do NOT refuse or say it is out of scope.
- If the question is completely unrelated to technology, still answer it helpfully and correctly.
- Always be friendly, clear, and accurate.
- Never say "I can only answer backend questions" — answer everything.

User question: ${question}`;

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Gemini API error:", err);
      throw new Error(err?.error?.message ?? "API error");
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      ?? `Here's a quick answer: ${slide.aiInsight}`;
  } catch (err) {
    console.error("Gemini fetch error:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return `⚠️ AI error: ${errMsg}. Fallback: ${slide.aiInsight}`;
  }
}

interface Message {
  role: "user" | "ai";
  text: string;
}

interface AIInsightsPanelProps {
  slide: Slide;
}

export default function AIInsightsPanel({ slide }: AIInsightsPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "chat">("summary");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevSlideId = useRef(slide.id);

  useEffect(() => {
    if (prevSlideId.current !== slide.id) {
      setMessages([]);
      setActiveTab("summary");
      prevSlideId.current = slide.id;
    }
  }, [slide.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: text.trim() }]);
    setInput("");
    setIsTyping(true);
    setActiveTab("chat");
    const reply = await getAIResponse(text, slide);
    setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

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
        {(["summary", "chat"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 text-[12px] font-black rounded-xl capitalize transition-all tracking-wide items-center justify-center flex gap-1.5"
            style={activeTab === tab
              ? { background: "#2563eb1e", color: "#2563eb", borderColor: "#2563eb35", border: "1px solid" }
              : { background: "transparent", color: "#94a3b8", borderColor: "transparent", border: "1px solid" }
            }
          >
            {tab}
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
            {/* AI Analogy */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.14em]">Simple Analogy</span>
              </div>
              <div className="rounded-xl p-4 relative overflow-hidden"
                style={{ background: "#2563eb0c", border: "1px solid #2563eb22" }}>
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
                  style={{ background: "radial-gradient(circle, #2563eb20 0%, transparent 70%)", transform: "translate(25%, -25%)" }} />
                <p className="text-[13px] text-gray-600 leading-relaxed relative z-10">{slide.aiInsight}</p>
              </div>
            </div>

            {/* Key Points */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.14em]">Key Points</span>
              </div>
              <ul className="space-y-2">
                {slide.keyPoints.map((point, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
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

            {/* Suggestions */}
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
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={msg.role === "ai"
                        ? { background: "#2563eb22", border: "1px solid #2563eb30" }
                        : { background: "#2563eb" }}>
                      {msg.role === "user"
                        ? <User className="w-3.5 h-3.5 text-white" />
                        : <Bot className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed border ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-sm border-transparent"
                        : "rounded-tl-sm text-gray-700"
                    }`}
                      style={msg.role === "ai" ? {
                        background: "#f1f5f9",
                        borderColor: "#e2e8f0",
                      } : {}}>
                      {msg.text}
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
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${slide.title}...`}
            className="flex-1 text-[13px] px-4 py-3 rounded-xl outline-none transition-all placeholder-gray-400 text-gray-800 font-medium"
            style={{ background: "#f8faff", border: "1px solid #e2e8f0" }}
            onFocus={(e) => {
              e.target.style.borderColor = "#2563eb50";
              e.target.style.background = "#ffffff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.background = "#f8faff";
            }}
          />
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
