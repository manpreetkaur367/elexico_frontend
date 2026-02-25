import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Eye, EyeOff, Sparkles, ChevronRight,
  Server, Database, Shield, Zap, Globe, ArrowRight,
} from "lucide-react";

const CODE = "2026";

interface GatekeeperProps {
  onUnlock: () => void;
}

const features = [
  { icon: Server, label: "Architecture", desc: "Servers, cloud & containers" },
  { icon: Database, label: "Databases", desc: "SQL, NoSQL & caching layers" },
  { icon: Shield, label: "Security", desc: "Auth, JWT & OAuth 2.0" },
  { icon: Zap, label: "Real-Time", desc: "WebSockets & event streaming" },
];

export default function Gatekeeper({ onUnlock }: GatekeeperProps) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (value === CODE) {
      onUnlock();
    } else {
      setShake(true);
      setError(true);
      setValue("");
      setTimeout(() => { setShake(false); setError(false); }, 600);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f8ff 100%)" }}>

      {/* Background layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-64 -left-64 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, #3b82f628 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div className="absolute -bottom-64 -right-64 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, #2563eb1e 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.10) 1px, transparent 0)",
            backgroundSize: "36px 36px",
          }} />
      </div>

      {/* Main card — split layout */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className={`relative w-full max-w-4xl mx-4 rounded-3xl overflow-hidden flex ${shake ? "animate-shake" : ""}`}
        style={{
          boxShadow: "0 40px 100px rgba(37,99,235,0.14), 0 12px 40px rgba(0,0,0,0.08)",
          border: "1px solid rgba(59,130,246,0.15)",
        }}
      >
        {/* LEFT PANEL */}
        <div className="hidden md:flex flex-col justify-between w-[52%] p-10 relative overflow-hidden"
          style={{ background: "linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 45%, #2563eb 100%)" }}>

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)" }} />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 65%)" }} />
            <div className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }} />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 28px)",
              }} />
          </div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-[1.35rem] font-black text-white tracking-tight">ElexicoAI</span>
            </div>
            <p className="text-blue-300 text-[11px] font-medium ml-[52px]">
              Backend Engineering Platform
            </p>
          </motion.div>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative z-10 py-6">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-7"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}>
              <Globe className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-[1.7rem] font-black text-white leading-[1.2] tracking-tight mb-3">
              Backend Engineering<br />
              <span style={{ color: "#93c5fd" }}>Deep Dive</span>
            </h2>
            <p className="text-blue-200 text-[13px] leading-relaxed max-w-xs">
              8 curated modules covering the complete backend engineering stack — from servers to real-time systems.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              <div className="flex -space-x-2">
                {["#1e40af", "#1d4ed8", "#2563eb"].map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-blue-900 flex items-center justify-center text-[9px] font-black text-white"
                    style={{ background: c }}>
                    {["BE", "FE", "DS"][i]}
                  </div>
                ))}
              </div>
              <span className="text-blue-200 text-[12px] font-medium">8 modules · 40+ topics</span>
            </div>
          </motion.div>

          {/* Feature grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="relative z-10 grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.07 }}
                className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.12)" }}>
                  <Icon className="w-3.5 h-3.5 text-blue-200" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-white">{label}</p>
                  <p className="text-[10px] text-blue-300 leading-tight mt-0.5">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col justify-center relative overflow-hidden"
          style={{ background: "#ffffff" }}>

          <div className="absolute top-0 left-0 right-0 h-[3px] md:hidden"
            style={{ background: "linear-gradient(to right, #2563eb, #3b82f6)" }} />
          <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
            style={{ background: "radial-gradient(circle, #2563eb08 0%, transparent 65%)", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none"
            style={{ background: "radial-gradient(circle, #2563eb06 0%, transparent 65%)", transform: "translate(-30%, 30%)" }} />

          <div className="relative z-10 px-8 md:px-10 py-10">

            {/* Mobile logo */}
            <div className="flex md:hidden items-center gap-2 mb-8">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black text-gray-900">Elexico<span className="text-blue-600">AI</span></span>
            </div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}>
              <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.18em] mb-2">
                Secure Access
              </p>
              <h1 className="text-[1.65rem] font-black text-gray-900 tracking-tight leading-tight mb-2">
                Welcome back
              </h1>
              <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                Enter your access code to open the ElexicoAI workspace.
              </p>
            </motion.div>

            {/* Divider */}
            <div className="my-7 flex items-center gap-3">
              <div className="flex-1 h-px"
                style={{ background: "linear-gradient(to right, #e2e8f0, transparent)" }} />
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                <Lock className="w-3 h-3 text-gray-400" />
              </div>
              <div className="flex-1 h-px"
                style={{ background: "linear-gradient(to left, #e2e8f0, transparent)" }} />
            </div>

            {/* Input */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.16em]">
                Access Code
              </label>
              <div className={`relative flex items-center rounded-xl overflow-hidden transition-all duration-200 ${
                error
                  ? "ring-2 ring-red-400/60"
                  : "ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-blue-500/50"
              }`}
                style={{ background: "#f8faff" }}>
                <input
                  ref={inputRef}
                  type={show ? "text" : "password"}
                  value={value}
                  onChange={(e) => { setValue(e.target.value); setError(false); }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="••••"
                  maxLength={10}
                  className="flex-1 bg-transparent px-4 py-3.5 text-gray-900 placeholder-gray-400 text-sm font-mono focus:outline-none tracking-[0.3em]"
                  autoFocus
                />
                <button type="button" onClick={() => setShow((s) => !s)}
                  className="px-4 py-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[11px] text-red-500 mt-2 pl-1 font-semibold flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-[9px] font-black flex-shrink-0">!</span>
                    Incorrect code — please try again.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Submit */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.4 }}
              whileHover={{ scale: 1.02, boxShadow: "0 10px 35px rgba(37,99,235,0.38)" }}
              whileTap={{ scale: 0.97 }}
              onClick={submit}
              className="w-full mt-4 py-3.5 rounded-xl text-[13px] font-black text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)",
                boxShadow: "0 4px 20px rgba(37,99,235,0.28)",
              }}>
              Enter Workspace
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            {/* Footer */}
            <div className="mt-8 pt-5 flex items-center justify-between"
              style={{ borderTop: "1px solid #f1f5f9" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-[11px] text-gray-400 font-medium">System online</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-gray-300" />
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
                  ElexicoAI v2.0
                </span>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
