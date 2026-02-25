import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, BookOpen, CheckCircle2, TrendingUp, Globe, Terminal,
  Server, HardDrive, Zap, Database, Lock, Code2, ArrowLeftRight, Radio,
  type LucideIcon,
} from "lucide-react";
import type { Slide } from "../data/slides";

const iconMap: Record<string, LucideIcon> = {
  Server, HardDrive, Zap, Database, Lock, Code2, ArrowLeftRight, Radio,
};

interface DeepDiveModalProps {
  slide: Slide;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeepDiveModal({ slide, isOpen, onClose }: DeepDiveModalProps) {
  const IconComponent = iconMap[slide.icon] ?? Server;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const paragraphs = slide.deepDive.split("\n\n");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Slide-over panel — wider on desktop */}
          <motion.div
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* ── Header with hero image ── */}
            <div className="relative flex-shrink-0 h-40 overflow-hidden">
              <img
                src={slide.imageUrl}
                alt={slide.diagramAlt}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom, #2563eb88 0%, rgba(0,0,0,0.7) 100%)`,
                }}
              />
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Icon + title */}
              <div className="absolute bottom-4 left-5 flex items-end gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
                >
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <BookOpen className="w-3 h-3 text-white/70" />
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Deep Dive</span>
                  </div>
                  <h2 className="text-lg font-bold text-white leading-tight">{slide.title}</h2>
                  <p className="text-xs text-white/75 mt-0.5">{slide.subtitle}</p>
                </div>
              </div>
            </div>

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto">

              {/* Stats grid */}
              <div className="px-5 pt-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {slide.stats.map((stat, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-3 text-center border"
                      style={{ borderColor: "#2563eb30", background: "#2563eb08" }}
                    >
                      <div className="text-base font-bold text-gray-900 leading-tight">{stat.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image + Key Points */}
              <div className="px-5 pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full photo */}
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <img
                    src={slide.imageUrl}
                    alt={slide.diagramAlt}
                    className="w-full h-44 object-cover"
                  />
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-400 italic">{slide.diagramAlt}</p>
                  </div>
                </div>

                {/* Key Points */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-800">Key Concepts</span>
                  </div>
                  <div className="space-y-2">
                    {slide.keyPoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold"
                          style={{ background: "#2563eb" }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-sm text-gray-600 leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="px-5 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-800">Tech Stack</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {slide.techStack.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm"
                      style={{ background: tech.color }}
                    >
                      {tech.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Real World Example */}
              <div className="px-5 pt-5">
                <div
                  className="rounded-2xl p-4 border-l-4"
                  style={{ borderColor: "#2563eb", background: "#2563eb08" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      Real-World Example
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{slide.realWorldExample}</p>
                </div>
              </div>

              {/* Code Snippet */}
              {slide.codeSnippet && (
                <div className="px-5 pt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Code Example · {slide.codeLanguage?.toUpperCase()}
                    </span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="ml-2 text-xs text-gray-500 font-mono">
                        {slide.codeLanguage === "javascript" ? "app.js"
                          : slide.codeLanguage === "sql" ? "query.sql"
                          : "request.http"}
                      </span>
                    </div>
                    <pre className="bg-gray-950 text-green-400 text-xs font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                      {slide.codeSnippet}
                    </pre>
                  </div>
                </div>
              )}

              {/* Deep Dive text */}
              <div className="px-5 pt-5 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-800">Full Explanation</span>
                </div>
                <div className="space-y-3 rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  {paragraphs.map((para, i) => {
                    const lines = para.split("\n");
                    const isList = lines.some(l => l.startsWith("•") || /^\d+\./.test(l));
                    if (isList) {
                      return (
                        <div key={i} className="space-y-1.5">
                          {lines.map((line, j) => {
                            if (line.startsWith("•")) {
                              return (
                                <div key={j} className="flex items-start gap-2 text-sm text-gray-600">
                                  <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-blue-600" />
                                  <span>{line.replace("•", "").trim()}</span>
                                </div>
                              );
                            }
                            if (/^\d+\./.test(line)) {
                              const num = line.match(/^(\d+)\./)?.[1];
                              return (
                                <div key={j} className="flex items-start gap-2.5 text-sm text-gray-600">
                                  <span
                                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
                                    style={{ background: "#2563eb" }}
                                  >{num}</span>
                                  <span>{line.replace(/^\d+\.\s*/, "")}</span>
                                </div>
                              );
                            }
                            return <p key={j} className="text-sm font-semibold text-gray-800">{line}</p>;
                          })}
                        </div>
                      );
                    }
                    return <p key={i} className="text-sm text-gray-600 leading-relaxed">{para}</p>;
                  })}
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Slide {slide.id} of 8 · ElexicoAI Backend Series
              </p>
              <button
                onClick={onClose}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
