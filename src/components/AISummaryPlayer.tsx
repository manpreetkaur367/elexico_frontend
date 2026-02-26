import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, Sparkles, RefreshCw,
  Mic, Square, Hash,
} from "lucide-react";
import type { Slide } from "../data/slides";
import { useTTS } from "../hooks/useSpeech";

/* ─── Backend API helper ─── */
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "https://elexico-backend-ye1c.onrender.com") as string;

type SummaryLength = "short" | "medium" | "detailed" | "custom";

const LENGTH_CONFIG: Record<Exclude<SummaryLength, "custom">, { label: string; lines: number; desc: string; temp: number }> = {
  short:    { label: "Short",    lines: 3,  desc: "3 sentences · quick glance",  temp: 0.4 },
  medium:   { label: "Medium",   lines: 7,  desc: "7 sentences · balanced",      temp: 0.5 },
  detailed: { label: "Detailed", lines: 14, desc: "14 sentences · in-depth",     temp: 0.6 },
};

/**
 * Build a rich ordered pool of raw sentences from slide data.
 * Order: description → keyPoints → realWorldExample → aiInsight → deepDive paragraphs
 * This pool is always large enough for even "detailed" (14 sentences).
 */
function buildSentencePool(slide: Slide): string[] {
  const pool: string[] = [];

  // 1. Description (1 sentence)
  if (slide.description) pool.push(slide.description);

  // 2. Each keyPoint → convert to a full sentence
  for (const kp of slide.keyPoints) {
    const s = kp.trim();
    pool.push(s.endsWith(".") || s.endsWith("!") || s.endsWith("?") ? s : s + ".");
  }

  // 3. Real-world example
  if (slide.realWorldExample) pool.push(slide.realWorldExample);

  // 4. AI Insight
  if (slide.aiInsight) {
    // aiInsight often has 2 sentences — split them
    const parts = slide.aiInsight.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 8);
    pool.push(...parts);
  }

  // 5. deepDive paragraphs — split into sentences, add clean ones
  if (slide.deepDive) {
    const paragraphs = slide.deepDive.split("\n\n");
    for (const para of paragraphs) {
      const sents = para
        .replace(/^[•\-\*]\s*/gm, "") // strip bullet chars
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 15 && !s.startsWith("•") && !s.startsWith("-"));
      pool.push(...sents);
    }
  }

  // Deduplicate and cap at 20
  const seen = new Set<string>();
  return pool.filter(s => {
    const key = s.slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 20);
}

/**
 * Use backend to polish a single raw sentence into a smooth, natural spoken sentence.
 */
async function polishSentence(
  raw: string,
  slideTitle: string,
  temperature: number
): Promise<string> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/polish-sentence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence: raw, slideTitle, temperature }),
    });
    if (!res.ok) return raw;
    const data = await res.json() as { polished?: string };
    return data.polished?.trim() || raw;
  } catch {
    return raw;
  }
}

async function generateSummary(slide: Slide, lines: number, temperature: number): Promise<string[]> {
  // Build the sentence pool from slide data
  const pool = buildSentencePool(slide);
  const rawSentences = pool.slice(0, lines);

  // If pool is smaller than requested, repeat from pool
  while (rawSentences.length < lines) {
    rawSentences.push(pool[rawSentences.length % pool.length] ?? slide.description);
  }

  // Polish each sentence via backend (parallel for speed)
  const polished = await Promise.all(
    rawSentences.map(s => polishSentence(s, slide.title, temperature))
  );

  return polished;
}

/* ─── Main component ─── */
interface Props {
  slide: Slide;
}

export default function AISummaryPlayer({ slide }: Props) {
  const [summaryLength, setSummaryLength] = useState<SummaryLength>("medium");
  const [customLines, setCustomLines] = useState(8);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [sentences, setSentences] = useState<string[]>([]); // each item = one guaranteed sentence
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Join sentences into one string for TTS
  const summaryText = sentences.length > 0 ? sentences.join(" ") : null;

  const tts = useTTS(summaryText ?? "");

  // Reset summary when slide changes
  const prevSlideId = useRef(slide.id);
  useEffect(() => {
    if (prevSlideId.current !== slide.id) {
      prevSlideId.current = slide.id;
      tts.stop();
      setSentences([]);
      setGenError(null);
    }
  }, [slide.id, tts.stop]);

  const effectiveLines =
    summaryLength === "custom" ? customLines : LENGTH_CONFIG[summaryLength].lines;

  const effectiveTemp =
    summaryLength === "custom"
      ? 0.5
      : LENGTH_CONFIG[summaryLength].temp;

  const handleGenerate = async () => {
    tts.stop();
    setSentences([]);
    setGenError(null);
    setIsGenerating(true);
    try {
      const result = await generateSummary(slide, effectiveLines, effectiveTemp);
      setSentences(result); // always exactly `effectiveLines` items
      // Audio is NOT auto-played — user presses Play when ready
    } catch {
      setGenError("Couldn't generate summary. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentLengthLabel =
    summaryLength === "custom"
      ? `Custom · ${customLines} sentences`
      : LENGTH_CONFIG[summaryLength].desc;

  const isPlaying = tts.state === "playing";
  const isPaused  = tts.state === "paused";
  const isDone    = tts.state === "done";
  const hasAudio  = sentences.length > 0 && !isGenerating;

  return (
    <div className="flex flex-col gap-5 px-5 py-4">

      {/* ── Length selector ── */}
      <div>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.14em] mb-2.5">
          Summary Length
        </p>

        {/* Preset chips */}
        <div className="flex gap-2 mb-2">
          {(Object.keys(LENGTH_CONFIG) as Exclude<SummaryLength, "custom">[]).map((key) => (
            <button
              key={key}
              onClick={() => { setSummaryLength(key); setShowCustomInput(false); }}
              className="flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all capitalize tracking-wide flex flex-col items-center gap-0.5"
              style={
                summaryLength === key
                  ? { background: "#2563eb1e", color: "#2563eb", border: "1px solid #2563eb35" }
                  : { background: "#f8faff", color: "#94a3b8", border: "1px solid #e2e8f0" }
              }
            >
              {LENGTH_CONFIG[key].label}
              <span className="text-[9px] font-bold opacity-70">{LENGTH_CONFIG[key].lines} sent.</span>
            </button>
          ))}
          {/* Custom chip */}
          <button
            onClick={() => { setSummaryLength("custom"); setShowCustomInput(true); }}
            className="flex-1 py-2 rounded-xl text-[11px] font-black transition-all tracking-wide flex items-center justify-center gap-1"
            style={
              summaryLength === "custom"
                ? { background: "#2563eb1e", color: "#2563eb", border: "1px solid #2563eb35" }
                : { background: "#f8faff", color: "#94a3b8", border: "1px solid #e2e8f0" }
            }
          >
            <Hash className="w-3 h-3" /> Custom
          </button>
        </div>

        {/* Custom number input */}
        <AnimatePresence>
          {showCustomInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
                style={{ background: "#f8faff", border: "1px solid #e2e8f0" }}>
                <span className="text-[12px] text-gray-500 font-semibold">Lines:</span>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={customLines}
                  onChange={(e) => setCustomLines(Math.min(20, Math.max(2, Number(e.target.value))))}
                  className="w-14 text-center text-[13px] font-black text-blue-600 outline-none rounded-lg px-2 py-1"
                  style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
                />
                <span className="text-[11px] text-gray-400 font-medium">sentences (2–20)</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desc hint */}
        <p className="text-[11px] text-gray-400 font-medium mt-1">{currentLengthLabel}</p>
      </div>

      {/* ── Generate button ── */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-3 rounded-2xl text-[13px] font-black flex items-center justify-center gap-2.5 transition-all disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #2563eb, #3b82f6)",
          color: "#fff",
          boxShadow: "0 4px 16px #2563eb35",
        }}
      >
        {isGenerating ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.div>
            Generating…
          </>
        ) : sentences.length > 0 ? (
          <>
            <RefreshCw className="w-4 h-4" />
            Regenerate Summary
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate AI Summary
          </>
        )}
      </motion.button>

      {/* ── Error state ── */}
      <AnimatePresence>
        {genError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[12px] text-red-500 font-semibold text-center"
          >
            {genError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Summary card + audio player ── */}
      <AnimatePresence>
        {hasAudio && sentences.length > 0 && (
          <motion.div
            key={sentences[0]?.slice(0, 20)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4"
          >
            {/* Summary text card — numbered list so count is visually clear */}
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{ background: "#f8faff", border: "1px solid #e2e8f0" }}
            >
              {/* subtle glow */}
              <div
                className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
                style={{
                  background: "radial-gradient(circle, #2563eb14 0%, transparent 70%)",
                  transform: "translate(30%, -30%)",
                }}
              />
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.14em]">
                    AI Summary
                  </span>
                </div>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: "#2563eb18", color: "#2563eb" }}
                >
                  {sentences.length} sentences
                </span>
              </div>
              <ol className="space-y-2 relative z-10">
                {sentences.map((s, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex gap-2.5 items-start"
                  >
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black mt-0.5"
                      style={{ background: "#2563eb18", color: "#2563eb" }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-[13px] text-gray-700 leading-relaxed">{s}</p>
                  </motion.li>
                ))}
              </ol>
            </div>

            {/* ── Audio player controls ── */}
            <div
              className="rounded-2xl px-4 py-4"
              style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px #2563eb10" }}
            >
              {/* Progress bar */}
              <div className="mb-4">
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: "#e2e8f0" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #2563eb, #3b82f6)" }}
                    animate={{ width: `${tts.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400 font-semibold capitalize">
                    {tts.state === "idle"    ? "Ready"
                      : tts.state === "playing" ? "Playing…"
                      : tts.state === "paused"  ? "Paused"
                      : tts.state === "done"    ? "Done"
                      : "Error"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold">
                    {tts.progress}%
                  </span>
                </div>
              </div>

              {/* Buttons row */}
              <div className="flex items-center justify-center gap-3">

                {/* Replay */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={tts.replay}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}
                  title="Replay from beginning"
                >
                  <RotateCcw className="w-4 h-4 text-gray-500" />
                </motion.button>

                {/* Play / Pause / Resume — main button */}
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={isPlaying ? tts.pause : tts.play}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
                  style={{
                    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                    boxShadow: "0 4px 18px #2563eb40",
                  }}
                  title={isPlaying ? "Pause" : isPaused ? "Resume" : "Play"}
                >
                  <AnimatePresence mode="wait">
                    {isPlaying ? (
                      <motion.div key="pause"
                        initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
                        <Pause className="w-6 h-6 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div key="play"
                        initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Stop */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={tts.stop}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}
                  title="Stop"
                >
                  <Square className="w-4 h-4 text-gray-500" />
                </motion.button>
              </div>

              {/* Status hint */}
              <AnimatePresence>
                {(isPlaying || isPaused) && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 mt-3.5"
                  >
                    {isPlaying && (
                      <div className="flex gap-1 items-end h-4">
                        {[0, 1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ height: ["6px", "14px", "6px"] }}
                            transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
                            className="w-1 rounded-full"
                            style={{ background: "#2563eb", minHeight: "4px" }}
                          />
                        ))}
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-blue-500">
                      {isPlaying ? "Speaking…" : "Paused — tap ▶ to resume"}
                    </span>
                  </motion.div>
                )}
                {isDone && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-[11px] font-bold text-green-500 mt-3"
                  >
                    ✓ Finished — tap ↺ to replay
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ── */}
      {!isGenerating && sentences.length === 0 && !genError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-6 opacity-50"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}
          >
            <Mic className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-[12px] text-gray-500 text-center leading-relaxed">
            Choose a length, then tap<br />
            <span className="font-bold text-gray-600">Generate AI Summary</span>
          </p>
        </motion.div>
      )}

      {/* ── Generating skeleton ── */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-4 space-y-2.5"
          style={{ background: "#f8faff", border: "1px solid #e2e8f0" }}
        >
          {Array.from({ length: effectiveLines > 8 ? 5 : Math.min(effectiveLines, 4) }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.4, delay: i * 0.12, repeat: Infinity }}
              className="h-3 rounded-full"
              style={{
                background: "#e2e8f0",
                width: i === 0 ? "100%" : i % 3 === 0 ? "65%" : i % 2 === 0 ? "85%" : "75%",
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
