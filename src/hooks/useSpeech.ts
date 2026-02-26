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

/** Pick best Indian English voice from a loaded voices list */
function pickIndianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    // 1st: Google en-IN (Ravi / Heera / Neerja — Chrome built-ins)
    voices.find(v => v.lang === "en-IN" && v.name.toLowerCase().includes("google")) ??
    // 2nd: any named Indian voice
    voices.find(v => v.lang === "en-IN" && /ravi|heera|neerja|veena|lekha/i.test(v.name)) ??
    // 3rd: any en-IN voice
    voices.find(v => v.lang === "en-IN") ??
    // 4th: Google English fallback
    voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("google")) ??
    voices.find(v => v.lang.startsWith("en")) ??
    null
  );
}

/**
 * Returns a Promise that resolves to the best Indian English voice.
 * Handles the Chrome async voice-loading race condition.
 */
function getIndianVoiceAsync(): Promise<SpeechSynthesisVoice | null> {
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(pickIndianVoice(voices));
      return;
    }
    // Voices not loaded yet — wait for the event (fires once on Chrome)
    const handler = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve(pickIndianVoice(window.speechSynthesis.getVoices()));
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    // Safety timeout — resolve with null after 2 s if event never fires
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve(null);
    }, 2000);
  });
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

    const doSpeak = (voice: SpeechSynthesisVoice | null) => {
      const utt = new SpeechSynthesisUtterance(t);
      utt.rate  = 0.85;   // soft, unhurried Indian cadence
      utt.pitch = 1.08;   // gentle warmth — not too high, not flat
      utt.lang  = "en-IN";
      if (voice) utt.voice = voice;

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
    };

    // Async: wait for voices to load (fixes Chrome race condition on Linux)
    getIndianVoiceAsync().then(doSpeak);
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
  readonly isFinal: boolean;
}
interface ISpeechRecognitionEvent {
  readonly results: ArrayLike<ISpeechRecognitionResult>;
}
interface ISpeechRecognitionErrorEvent {
  readonly error: string;
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
  onerror: ((e: ISpeechRecognitionErrorEvent) => void) | null;
}
type SpeechRecognitionCtor = new () => ISpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export type STTError = "not-allowed" | "no-speech" | "network" | "unsupported" | null;

export function useSTT(onResult: (transcript: string) => void) {
  const [listening, setListening]   = useState(false);
  const [supported, setSupported]   = useState(false);
  const [interim, setInterim]       = useState("");       // live preview text
  const [error, setError]           = useState<STTError>(null);
  const recognitionRef              = useRef<ISpeechRecognition | null>(null);
  const onResultRef                 = useRef(onResult);

  // keep callback ref fresh without re-creating recognition
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const rec = new SR();
    rec.continuous     = true;   // keep listening until user stops
    rec.interimResults = true;   // show live text as user speaks
    rec.lang           = "en-IN";

    rec.onresult = (e: ISpeechRecognitionEvent) => {
      let interimText = "";
      let finalText   = "";
      Array.from(e.results as ArrayLike<ISpeechRecognitionResult>).forEach(r => {
        const t = r[0].transcript;
        if (r.isFinal) finalText += t + " ";
        else interimText += t;
      });
      if (interimText) setInterim(interimText);
      if (finalText.trim()) {
        setInterim("");
        onResultRef.current(finalText.trim());
      }
    };

    rec.onend = () => {
      setListening(false);
      setInterim("");
    };

    rec.onerror = (e: ISpeechRecognitionErrorEvent) => {
      setListening(false);
      setInterim("");
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        setError("not-allowed");
      } else if (e.error === "no-speech") {
        setError("no-speech");
      } else if (e.error === "network") {
        setError("network");
      } else {
        setError(null);
      }
    };

    recognitionRef.current = rec;
    return () => { recognitionRef.current?.abort(); };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    setError(null);
    setInterim("");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch { /* already running */ }
  }, [listening]);

  const stopSTT = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  return { listening, supported, interim, error, start, stop: stopSTT };
}
