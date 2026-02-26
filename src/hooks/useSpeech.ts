/**
 * useSpeech.ts
 * Shared TTS + STT hooks used across the app.
 * - globalStop() cancels ANY speech currently playing (called before starting new audio)
 * - useTTS(text) → { state, progress, play, pause, replay, stop }
 * - useSTT()     → { transcript, listening, start, stop, supported }
 */
import { useState, useRef, useEffect, useCallback } from "react";

// ─── Global TTS controller ────────────────────────────────────────────────────
export function globalStop() {
  window.speechSynthesis.cancel();
}

function getBestVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium"))) ??
    voices.find(v => v.lang.startsWith("en")) ??
    null
  );
}

// ─── TTS Hook ─────────────────────────────────────────────────────────────────
export type TTSState = "idle" | "playing" | "paused" | "done" | "error";

export function useTTS(text: string) {
  const [state, setState]       = useState<TTSState>("idle");
  const [progress, setProgress] = useState(0);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);
  // keep latest play ref for replay
  const textRef = useRef(text);
  textRef.current = text;

  // Cancel when unmounted
  useEffect(() => () => { window.speechSynthesis.cancel(); }, []);

  // Reset when text changes
  useEffect(() => {
    window.speechSynthesis.cancel();
    setState("idle");
    setProgress(0);
    uttRef.current = null;
  }, [text]);

  const _speak = useCallback((t: string) => {
    globalStop();
    const utt = new SpeechSynthesisUtterance(t);
    utt.rate  = 0.95;
    utt.pitch = 1.0;
    utt.lang  = "en-US";

    // voices may not be loaded yet — retry once
    const voice = getBestVoice();
    if (voice) utt.voice = voice;
    else {
      window.speechSynthesis.onvoiceschanged = () => {
        const v = getBestVoice();
        if (v && uttRef.current) uttRef.current.voice = v;
      };
    }

    const words = t.split(/\s+/).length;
    let wordIdx = 0;
    utt.onboundary = (e) => {
      if (e.name === "word") {
        wordIdx++;
        setProgress(Math.min(99, Math.round((wordIdx / words) * 100)));
      }
    };
    utt.onend   = () => { setState("done");  setProgress(100); };
    utt.onerror = () => setState("error");

    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
    setState("playing");
  }, []);

  const play = useCallback(() => {
    if (!textRef.current) return;
    if (state === "paused") {
      window.speechSynthesis.resume();
      setState("playing");
      return;
    }
    _speak(textRef.current);
  }, [state, _speak]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setState("paused");
  }, []);

  const replay = useCallback(() => {
    globalStop();
    setState("idle");
    setProgress(0);
    uttRef.current = null;
    setTimeout(() => _speak(textRef.current), 80);
  }, [_speak]);

  const stop = useCallback(() => {
    globalStop();
    setState("idle");
    setProgress(0);
    uttRef.current = null;
  }, []);

  /** Speak a new text immediately, stopping whatever is playing */
  const speak = useCallback((t: string) => {
    if (!t) return;
    _speak(t);
  }, [_speak]);

  return { state, progress, play, pause, replay, stop, speak };
}

// ─── STT Hook ─────────────────────────────────────────────────────────────────
interface ISpeechRecognitionResult {
  readonly [index: number]: { readonly transcript: string };
}
interface ISpeechRecognitionEvent {
  readonly results: ArrayLike<ISpeechRecognitionResult>;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SpeechRecognitionCtor = new () => ISpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export function useSTT(onResult: (transcript: string) => void) {
  const [listening, setListening]   = useState(false);
  const [supported, setSupported]   = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (SR) {
      setSupported(true);
      const rec = new SR();
      rec.continuous      = false;
      rec.interimResults  = false;
      rec.lang            = "en-US";
      rec.onresult = (e: ISpeechRecognitionEvent) => {
        const text = Array.from(e.results as ArrayLike<ISpeechRecognitionResult>)
          .map((r: ISpeechRecognitionResult) => r[0].transcript)
          .join(" ")
          .trim();
        if (text) onResult(text);
      };
      rec.onend  = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
    }
    return () => { recognitionRef.current?.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch { /* already started */ }
  }, [listening]);

  const stopSTT = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, start, stop: stopSTT };
}
