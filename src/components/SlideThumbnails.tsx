import { motion } from "framer-motion";
import {
  Server, HardDrive, Zap, Database, Lock, Code2, ArrowLeftRight, Radio,
  type LucideIcon,
} from "lucide-react";
import type { Slide } from "../data/slides";

const iconMap: Record<string, LucideIcon> = {
  Server, HardDrive, Zap, Database, Lock, Code2, ArrowLeftRight, Radio,
};

interface SlideThumbnailsProps {
  slides: Slide[];
  current: number;
  onSelect: (index: number) => void;
}

export default function SlideThumbnails({ slides, current, onSelect }: SlideThumbnailsProps) {
  const progress = Math.round(((current + 1) / slides.length) * 100);

  return (
    <aside className="h-full flex flex-col overflow-hidden" style={{ background: "#ffffff" }}>

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3.5 flex-shrink-0 relative"
        style={{ borderBottom: "1px solid #e8edf5" }}>

        {/* Top label row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}>
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 8 8">
                <rect x="0" y="0" width="3" height="3" rx="0.5" />
                <rect x="5" y="0" width="3" height="3" rx="0.5" />
                <rect x="0" y="5" width="3" height="3" rx="0.5" />
                <rect x="5" y="5" width="3" height="3" rx="0.5" />
              </svg>
            </div>
            <p className="text-[10.5px] font-black text-gray-700 uppercase tracking-[0.16em]">
              Slides
            </p>
          </div>
          <span className="text-[10px] font-black tabular-nums px-2 py-0.5 rounded-full text-blue-600"
            style={{ background: "#2563eb12", border: "1px solid #2563eb25" }}>
            {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-1 rounded-full overflow-hidden"
          style={{ background: "#e8edf5" }}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "linear-gradient(to right, #1d4ed8, #3b82f6)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
        <p className="text-[9.5px] text-gray-400 font-medium mt-1.5">
          {progress}% complete
        </p>
      </div>

      {/* ── Slide list ── */}
      <div className="flex-1 flex flex-col px-2.5 py-2.5 min-h-0 overflow-y-auto">
        {slides.map((slide, i) => {
          const Icon = iconMap[slide.icon] ?? Server;
          const isActive = i === current;
          const isVisited = i < current;

          return (
            <motion.button
              key={slide.id}
              onClick={() => onSelect(i)}
              whileHover={{ x: isActive ? 0 : 3 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 w-full text-left rounded-2xl overflow-hidden transition-all duration-200 relative group cursor-pointer"
              style={{
                background: isActive ? "#2563eb0e" : "transparent",
                border: isActive
                  ? "1px solid #2563eb30"
                  : "1px solid transparent",
                marginBottom: i < slides.length - 1 ? "4px" : 0,
                minHeight: 0,
              }}
            >
              {/* Active left accent bar */}
              {isActive && (
                <motion.div
                  layoutId="activeLine"
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full z-10"
                  style={{ background: "linear-gradient(to bottom, #1d4ed8, #3b82f6)" }}
                />
              )}

              {/* Hover background */}
              {!isActive && (
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                  style={{ background: "#f8faff" }} />
              )}

              <div className="relative flex items-center gap-3 px-3 py-2.5 h-full">

                {/* Slide image thumbnail */}
                <div className="flex-shrink-0 relative w-11 h-11 rounded-xl overflow-hidden"
                  style={{
                    border: isActive ? "1.5px solid #2563eb40" : "1px solid #e2e8f0",
                    boxShadow: isActive ? "0 2px 10px #2563eb18" : "none",
                  }}>
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  {/* Icon overlay on image */}
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, #1d4ed8cc, #2563ebaa)"
                        : "linear-gradient(135deg, rgba(0,0,0,0.45), rgba(0,0,0,0.28))",
                    }}>
                    <Icon className="w-4 h-4 text-white drop-shadow" />
                  </div>
                  {/* Visited tick */}
                  {isVisited && !isActive && (
                    <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center"
                      style={{ border: "1.5px solid white" }}>
                      <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 10 10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 5l2.5 2.5L8 3" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <p className={`text-[12px] font-bold truncate leading-tight transition-colors duration-200 ${
                      isActive ? "text-blue-700" : "text-gray-600 group-hover:text-gray-900"
                    }`}>
                      {slide.title}
                    </p>
                    <span className={`text-[10px] font-black tabular-nums flex-shrink-0 mt-0.5 transition-colors duration-200 ${
                      isActive ? "text-blue-500" : isVisited ? "text-gray-300" : "text-gray-300"
                    }`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className={`text-[10.5px] truncate font-medium transition-colors duration-200 leading-snug ${
                    isActive ? "text-blue-500/80" : "text-gray-400 group-hover:text-gray-500"
                  }`}>
                    {slide.subtitle ?? slide.summary}
                  </p>
                </div>

              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between"
        style={{ borderTop: "1px solid #e8edf5" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] text-gray-400 font-medium">ElexicoAI</span>
        </div>
        <div className="flex gap-1">
          {slides.map((_, i) => (
            <div key={i}
              onClick={() => onSelect(i)}
              className="rounded-full cursor-pointer transition-all duration-300"
              style={{
                width: i === current ? "16px" : "5px",
                height: "5px",
                background: i === current
                  ? "linear-gradient(to right, #1d4ed8, #3b82f6)"
                  : i < current ? "#93c5fd" : "#e2e8f0",
              }} />
          ))}
        </div>
      </div>

    </aside>
  );
}
