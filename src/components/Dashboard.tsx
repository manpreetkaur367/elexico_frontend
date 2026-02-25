import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ZoomIn, ZoomOut, FileText, Loader2,
  ChevronLeft, ChevronRight, PanelLeft, PanelRight, LogOut, RotateCcw,
} from "lucide-react";

import SlideCanvas from "./SlideCanvas";
import AIInsightsPanel from "./AIInsightsPanel";
import SlideThumbnails from "./SlideThumbnails";
import { slides } from "../data/slides";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.15;

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

interface DashboardProps {
  onExit: () => void;
}

export default function Dashboard({ onExit }: DashboardProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const slide = slides[current];

  const go = (next: number) => {
    if (next < 0 || next >= slides.length) return;
    setDirection(next > current ? 1 : -1);
    setCurrent(next);
  };

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, parseFloat((z + ZOOM_STEP).toFixed(2))));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, parseFloat((z - ZOOM_STEP).toFixed(2))));
  const zoomReset = () => setZoom(1);

  const exportPDF = async () => {
    if (exporting) return;
    setExporting(true);

    // Build a print-only page with all 8 slides rendered as divs
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) {
      alert("Please allow popups for this site to export PDF.");
      setExporting(false);
      return;
    }

    // Collect all slide HTML blocks
    const slideBlocks = slides.map((s) => `
      <div class="slide-page">
        <div class="slide-inner">
          <div class="slide-left" style="background: linear-gradient(135deg, ${s.color}88 0%, ${s.color}33 50%, rgba(0,0,0,0.6) 100%);">
            <img src="${s.imageUrl}" alt="${s.diagramAlt}" crossorigin="anonymous" />
            <div class="slide-badge" style="background:${s.color}cc">${String(s.id).padStart(2,"0")} / 08</div>
            <div class="slide-caption">
              <div class="caption-bar" style="background:${s.color}"></div>
              <p>${s.diagramAlt}</p>
            </div>
          </div>
          <div class="slide-right">
            <span class="tag" style="color:${s.color};border-color:${s.color}44;background:${s.color}12">
              ${s.summary}
            </span>
            <h2>${s.title}</h2>
            <p class="subtitle" style="color:${s.color}">${s.subtitle}</p>
            <div class="divider" style="background:${s.color}"></div>
            <p class="desc">${s.description}</p>
            <div class="key-points">
              ${s.keyPoints.slice(0,4).map(kp => `<div class="kp">• ${kp}</div>`).join("")}
            </div>
          </div>
        </div>
      </div>
    `).join("");

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>ElexicoAI — Backend Engineering</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; }
    .slide-page {
      width: 297mm; height: 185mm;
      page-break-after: always;
      display: flex; align-items: center; justify-content: center;
      padding: 6mm;
      background: #fff;
    }
    .slide-page:last-child { page-break-after: avoid; }
    .slide-inner {
      width: 100%; height: 100%;
      border-radius: 12px; overflow: hidden;
      display: flex; box-shadow: 0 4px 24px rgba(0,0,0,0.15);
      border: 1px solid #e5e7eb;
    }
    .slide-left {
      width: 48%; height: 100%;
      position: relative; flex-shrink: 0; overflow: hidden;
    }
    .slide-left img {
      width: 100%; height: 100%; object-fit: cover;
      position: absolute; top: 0; left: 0; z-index: 0;
    }
    .slide-badge {
      position: absolute; top: 10px; left: 10px; z-index: 2;
      font-size: 9px; font-weight: 800; color: white;
      padding: 3px 8px; border-radius: 20px;
    }
    .slide-caption {
      position: absolute; bottom: 0; left: 0; right: 0; z-index: 2;
      padding: 8px 12px 10px;
      background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
    }
    .caption-bar { width: 24px; height: 2px; border-radius: 2px; margin-bottom: 4px; }
    .slide-caption p { font-size: 8px; color: rgba(255,255,255,0.65); font-style: italic; }
    .slide-right {
      flex: 1; padding: 16px 20px; display: flex;
      flex-direction: column; gap: 8px; background: #fff; overflow: hidden;
    }
    .tag {
      display: inline-block; font-size: 8px; font-weight: 700;
      padding: 2px 8px; border-radius: 20px; border: 1px solid;
      text-transform: uppercase; letter-spacing: 0.05em; width: fit-content;
    }
    h2 { font-size: 18px; font-weight: 900; color: #111; line-height: 1.2; }
    .subtitle { font-size: 10px; font-weight: 600; }
    .divider { height: 2px; width: 32px; border-radius: 2px; }
    .desc { font-size: 9.5px; color: #4b5563; line-height: 1.6; flex:1; }
    .key-points { display: flex; flex-direction: column; gap: 2px; }
    .kp { font-size: 8px; color: #6b7280; line-height: 1.4; }
    @page { size: A4 landscape; margin: 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${slideBlocks}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); window.close(); }, 800);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
    setExporting(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden"
      style={{ background: "#f0f4ff" }}>

      {/* ════════════ HEADER ════════════ */}
      <header className="relative flex-shrink-0 flex items-center px-5 gap-4"
        style={{
          height: "56px",
          background: "#ffffff",
          borderBottom: "1px solid #e8edf5",
          boxShadow: "0 1px 12px rgba(37,99,235,0.06), 0 1px 0 rgba(0,0,0,0.04)",
        }}>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none"
          style={{ background: "linear-gradient(to right, #2563eb, #3b82f6, #2563eb)" }} />

        {/* Center top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-14 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% -10%, #2563eb0e 0%, transparent 70%)" }} />

        {/* ── Mobile left toggle ── */}
        <button onClick={() => setLeftOpen((o) => !o)}
          className="md:hidden p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all flex-shrink-0">
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* ── Logo ── */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)",
              boxShadow: "0 2px 10px #2563eb45, 0 0 0 1px rgba(255,255,255,0.15) inset",
            }}>
            <span className="text-white font-black text-[13px] relative z-10 leading-none">E</span>
            {/* Shine */}
            <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-xl"
              style={{ background: "rgba(255,255,255,0.18)" }} />
          </div>
          <div className="hidden sm:flex items-baseline gap-0.5">
            <span className="text-[15px] font-black text-gray-900 tracking-tight leading-none">Elexico</span>
            <span className="text-[15px] font-black tracking-tight leading-none text-blue-600">AI</span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-gray-200 flex-shrink-0" />

        {/* ── Module badge ── */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-black px-3 py-1.5 rounded-full border tracking-widest uppercase text-blue-600"
            style={{ borderColor: "#2563eb30", background: "#2563eb0a" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            Backend Engineering
          </span>
        </div>

        {/* ── Center: slide stepper ── */}
        <div className="flex-1 flex items-center justify-center gap-1 min-w-0">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className="relative group py-2 px-0.5"
              title={s.title}
            >
              <motion.div
                animate={{
                  width: i === current ? 28 : i < current ? 8 : 6,
                  background: i === current
                    ? "#2563eb"
                    : i < current
                    ? "#93c5fd"
                    : "#dde3ef",
                  opacity: 1,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="h-[5px] rounded-full"
                style={i === current ? { boxShadow: "0 0 10px #2563eb80" } : {}}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-50">
                <div className="bg-gray-900 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                  <span className="text-blue-300 mr-1">{String(i + 1).padStart(2, "0")}.</span>
                  {s.title}
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                    style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "4px solid #111827" }} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Slide counter chip ── */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-xl"
          style={{ background: "#f8faff", border: "1px solid #e8edf5" }}>
          <span className="text-[13px] font-black tabular-nums text-blue-600 leading-none">
            {String(current + 1).padStart(2, "0")}
          </span>
          <span className="text-[11px] text-gray-300 font-bold leading-none">/</span>
          <span className="text-[11px] font-bold tabular-nums text-gray-400 leading-none">
            {String(slides.length).padStart(2, "0")}
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-gray-200 flex-shrink-0" />

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile right toggle */}
          <button onClick={() => setRightOpen((o) => !o)}
            className="md:hidden p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <PanelRight className="w-4 h-4" />
          </button>

          {/* Exit */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onExit}
            className="hidden sm:flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-1.5 rounded-xl transition-all duration-200 border"
            style={{
              color: "#6b7280",
              background: "#f9fafb",
              borderColor: "#e5e7eb",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
              (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#fecaca";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
              (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Exit
          </motion.button>
        </div>
      </header>

      {/* ════════════ BODY ════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT SIDEBAR (desktop) ── */}
        <aside className="hidden md:flex flex-col w-[240px] flex-shrink-0"
          style={{ borderRight: "1px solid #e2e8f0", background: "#ffffff" }}>
          <SlideThumbnails slides={slides} current={current} onSelect={go} />
        </aside>

        {/* ── LEFT SIDEBAR (mobile overlay) ── */}
        <AnimatePresence>
          {leftOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 bg-gray-900/40 z-40 backdrop-blur-sm"
                onClick={() => setLeftOpen(false)}
              />
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className="md:hidden fixed left-0 top-0 bottom-0 w-[240px] z-50"
              >
                <SlideThumbnails slides={slides} current={current} onSelect={(i) => { go(i); setLeftOpen(false); }} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── MAIN CANVAS ── */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 relative overflow-hidden"
          style={{ background: "#f0f4ff" }}>

          {/* Static blue ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 10%, #2563eb0d 0%, transparent 55%)" }}
          />

          {/* Subtle blue-tinted grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.6]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.12) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }} />

          {/* Corner glow accent */}
          <div className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, #2563eb08 0%, transparent 70%)" }}
          />

          {/* Slide area */}
          <div className="flex-1 flex items-center justify-center px-3 py-2 min-h-0 overflow-hidden">
            <div
              className="w-full max-w-[1200px] transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            >
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={current}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ height: "clamp(380px, 58vh, 600px)" }}
                >
                  <div className="w-full h-full">
                    <SlideCanvas slide={slide} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ══ BOTTOM BAR — toolbar + navigation unified ══ */}
          <div className="flex-shrink-0 px-5 pb-5 pt-1 flex flex-col gap-3">

            {/* Progress track */}
            <div className="relative h-[3px] rounded-full overflow-hidden mx-1"
              style={{ background: "#e8edf5" }}>
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: "linear-gradient(to right, #1d4ed8, #3b82f6)" }}
                animate={{ width: `${((current + 1) / slides.length) * 100}%` }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>

            {/* Main bar */}
            <div className="flex items-center gap-3">

              {/* ── Left: Prev button ── */}
              <motion.button
                whileHover={{ x: -2, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => go(current - 1)}
                disabled={current === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-25 transition-all border"
                style={{
                  borderColor: "#e2e8f0",
                  background: "#ffffff",
                  color: "#374151",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </motion.button>

              {/* ── Center: Zoom + counter + dots ── */}
              <div className="flex-1 flex items-center justify-center gap-3">

                {/* Zoom pill */}
                <div className="flex items-center gap-0.5 px-1 py-1 rounded-xl border"
                  style={{ background: "#ffffff", borderColor: "#e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <motion.button
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    onClick={zoomOut} disabled={zoom <= MIN_ZOOM} title="Zoom out"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-25 transition-all">
                    <ZoomOut className="w-3.5 h-3.5" />
                  </motion.button>

                  <button onClick={zoomReset} title="Reset zoom"
                    className="px-2 py-0.5 text-[11px] font-black text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all min-w-[2.8rem] text-center tabular-nums">
                    {Math.round(zoom * 100)}%
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    onClick={zoomIn} disabled={zoom >= MAX_ZOOM} title="Zoom in"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-25 transition-all">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </motion.button>

                  <div className="w-px h-4 bg-gray-200 mx-0.5" />

                  <motion.button
                    whileHover={{ scale: 1.15, rotate: -45 }} whileTap={{ scale: 0.9 }}
                    onClick={() => { go(0); setZoom(1); }} title="Reset to first slide"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </motion.button>
                </div>

                {/* Slide counter + dots */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[13px] font-black tabular-nums text-blue-600 tracking-wide">
                      {String(current + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[11px] text-gray-300 font-bold">/</span>
                    <span className="text-[11px] font-bold tabular-nums text-gray-400">
                      {String(slides.length).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex items-center gap-[3px]">
                    {slides.map((_, i) => (
                      <motion.button
                        key={i}
                        onClick={() => go(i)}
                        title={slides[i].title}
                        animate={{
                          width: i === current ? 18 : 5,
                          background: i === current
                            ? "#2563eb"
                            : i < current
                            ? "#93c5fd"
                            : "#dde3ef",
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        className="h-[4px] rounded-full cursor-pointer"
                        style={i === current ? { boxShadow: "0 0 8px #2563eb70" } : {}}
                      />
                    ))}
                  </div>
                </div>

                {/* Export */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={exportPDF}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed border"
                  style={{
                    color: exporting ? "#9ca3af" : "#2563eb",
                    borderColor: exporting ? "#e2e8f0" : "#2563eb35",
                    background: exporting ? "#f8faff" : "#2563eb0a",
                    boxShadow: exporting ? "none" : "0 1px 4px #2563eb12",
                  }}>
                  {exporting
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <FileText className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">
                    {exporting ? "Exporting…" : "Export PDF"}
                  </span>
                </motion.button>
              </div>

              {/* ── Right: Next button ── */}
              <motion.button
                whileHover={{ x: 2, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => go(current + 1)}
                disabled={current === slides.length - 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-25 transition-all border text-white"
                style={{
                  background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                  borderColor: "#2563eb",
                  boxShadow: "0 2px 12px #2563eb35",
                }}>
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </main>

        {/* ── RIGHT SIDEBAR (desktop) ── */}
        <aside className="hidden md:flex flex-col w-[380px] flex-shrink-0"
          style={{ borderLeft: "1px solid #e2e8f0", background: "#ffffff" }}>
          <AIInsightsPanel slide={slide} />
        </aside>

        {/* ── RIGHT SIDEBAR (mobile overlay) ── */}
        <AnimatePresence>
          {rightOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 bg-gray-900/40 z-40 backdrop-blur-sm"
                onClick={() => setRightOpen(false)}
              />
              <motion.div
                initial={{ x: 300 }}
                animate={{ x: 0 }}
                exit={{ x: 300 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className="md:hidden fixed right-0 top-0 bottom-0 w-[380px] z-50 bg-white"
              >
                <AIInsightsPanel slide={slide} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
