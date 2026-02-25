import { motion } from "framer-motion";
import {
  Server, HardDrive, Zap, Database, Lock, Code2, ArrowLeftRight, Radio,
  type LucideIcon,
} from "lucide-react";
import type { Slide } from "../data/slides";

const iconMap: Record<string, LucideIcon> = {
  Server, HardDrive, Zap, Database, Lock, Code2, ArrowLeftRight, Radio,
};

interface SlideCanvasProps {
  slide: Slide;
}

export default function SlideCanvas({ slide }: SlideCanvasProps) {
  const IconComponent = iconMap[slide.icon] ?? Server;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden flex flex-col md:flex-row"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 32px rgba(0,0,30,0.08), 0 0 0 1px rgba(0,0,0,0.03), 0 0 60px #2563eb0a",
      }}>

      {/* ══ LEFT — Image Panel (52% width) ══ */}
      <div className="relative md:w-[52%] h-64 md:h-full flex-shrink-0 overflow-hidden">
        <motion.img
          src={slide.imageUrl}
          alt={slide.diagramAlt}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
        />

        {/* Deep gradient overlays */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #2563eb55 0%, #2563eb22 35%, rgba(6,7,9,0.55) 100%)" }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, transparent 50%, rgba(5,9,18,0.65) 100%)" }} />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.18]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")" }} />

        {/* Slide number badge */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="absolute top-5 left-5">
          <span className="text-[12px] font-black px-3.5 py-1.5 rounded-full text-white border border-white/20"
            style={{ background: "#2563ebcc", backdropFilter: "blur(12px)" }}>
            {String(slide.id).padStart(2, "0")} / 08
          </span>
        </motion.div>

        {/* Icon badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 300 }}
          className="absolute top-5 right-5 w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.18)" }}>
          <IconComponent className="w-5 h-5 text-white" />
        </motion.div>

        {/* Bottom caption */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-20"
          style={{ background: "linear-gradient(to top, rgba(4,7,20,0.92) 0%, transparent 100%)" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-[2px] rounded-full bg-blue-400" />
            <div className="w-4 h-[2px] rounded-full opacity-50 bg-blue-400" />
          </div>
          <p className="text-[12px] text-white/60 italic leading-snug">{slide.diagramAlt}</p>
        </div>

        {/* Blue glow edge */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{ background: "linear-gradient(to right, transparent, #2563eb80, transparent)" }} />
      </div>

      {/* ══ RIGHT — Content Panel ══ */}
      <div className="flex flex-col flex-1 min-h-0 relative overflow-hidden">

        {/* Dot-grid background */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.07) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }} />

        {/* Blue ambient glow */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, #2563eb12 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }} />

        <div className="relative z-10 flex flex-col h-full overflow-y-auto scrollbar-light px-8 py-6 gap-5">

          {/* Tag */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}>
            <span className="inline-flex items-center gap-2 text-[11px] font-black px-3.5 py-1.5 rounded-full border tracking-widest uppercase text-blue-600"
              style={{ background: "#2563eb14", borderColor: "#2563eb35" }}>
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full flex-shrink-0 bg-blue-600" />
              {slide.summary}
            </span>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}>
            <h2 className="text-[1.85rem] md:text-[2.1rem] font-black text-gray-900 leading-[1.1] tracking-tight">
              {slide.title}
            </h2>
            <p className="text-[15px] font-semibold mt-2 leading-snug text-blue-600">
              {slide.subtitle}
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.28, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ originX: 0 }}
            className="flex items-center gap-2">
            <div className="h-[2px] w-12 rounded-full bg-blue-600" />
            <div className="h-[2px] w-6 rounded-full opacity-40 bg-blue-600" />
            <div className="h-[2px] w-3 rounded-full opacity-15 bg-blue-600" />
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32, duration: 0.5 }}
            className="text-[14px] text-gray-700 leading-[1.85] flex-1">
            {slide.description}
          </motion.p>

          {/* Key points */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.14em] mb-3">
              Key Takeaways
            </p>
            <div className="grid grid-cols-1 gap-2">
              {slide.keyPoints.slice(0, 4).map((kp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.44 + i * 0.07, duration: 0.3 }}
                  className="flex items-start gap-3 group">
                  <div className="mt-[4px] w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center"
                    style={{ background: "#2563eb18", border: "1px solid #2563eb30" }}>
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  </div>
                  <p className="text-[13px] text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                    {kp}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
