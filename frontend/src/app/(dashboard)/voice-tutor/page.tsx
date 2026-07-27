"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  User,
  Volume2,
  Waves,
} from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/lib/api";
import { cn } from "@/lib/utils";

type Phase = "ready" | "listening" | "transcribing" | "thinking" | "done" | "error";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const win = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

function pickRecorderMime() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

async function blobToWav(blob: Blob): Promise<Blob> {
  const ctx = new AudioContext({ sampleRate: 16000 });
  try {
    const arrayBuf = await blob.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
    const channels = decoded.numberOfChannels;
    const length = decoded.length;
    const mono = new Float32Array(length);
    for (let c = 0; c < channels; c += 1) {
      const data = decoded.getChannelData(c);
      for (let i = 0; i < length; i += 1) mono[i] += data[i] / channels;
    }
    return encodeWav(mono, decoded.sampleRate);
  } finally {
    await ctx.close();
  }
}

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const clean = text.replace(/[#*_`]/g, "").trim().slice(0, 600);
  if (!clean) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(clean);
  utter.rate = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) => /^en/i.test(v.lang));
  if (preferred) utter.voice = preferred;
  window.speechSynthesis.speak(utter);
}

function isWeakTranscript(text: string) {
  const cleaned = text.trim();
  if (!cleaned) return true;
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 3) return false;
  if (cleaned.length >= 18) return false;
  const compact = cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
  return /^(thankyou|thanks|you|yeah|yep|no|ok|okay|uh|um|huh|hmm)$/.test(compact);
}

export default function VoiceTutorPage() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [listening, setListening] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState(
    "Press Start listening, speak your question, then press Stop."
  );
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [level, setLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const [recordMs, setRecordMs] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const askingRef = useRef(false);
  const mountedRef = useRef(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelRafRef = useRef<number | null>(null);
  const peakLevelRef = useRef(0);
  const recordStartedAtRef = useRef(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listeningRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const liveSpeechRef = useRef("");

  const stopLevelMeter = useCallback(() => {
    if (levelRafRef.current != null) {
      cancelAnimationFrame(levelRafRef.current);
      levelRafRef.current = null;
    }
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    try {
      void audioCtxRef.current?.close();
    } catch {}
    audioCtxRef.current = null;
    analyserRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
    return () => {
      mountedRef.current = false;
      listeningRef.current = false;
      stopLevelMeter();
      try {
        recognitionRef.current?.abort();
      } catch {}
      try {
        mediaRecorderRef.current?.stop();
      } catch {}
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [stopLevelMeter]);

  function startLevelMeter(stream: MediaStream) {
    stopLevelMeter();
    peakLevelRef.current = 0;
    setPeakLevel(0);
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        let sumSq = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / data.length);
        if (rms > peakLevelRef.current) {
          peakLevelRef.current = rms;
          setPeakLevel(rms);
        }
        setLevel(rms);
        levelRafRef.current = requestAnimationFrame(tick);
      };
      void ctx.resume();
      tick();
    } catch {}
  }

  function startBrowserSpeech() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    try {
      recognitionRef.current?.abort();
    } catch {}
    liveSpeechRef.current = "";
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: Event) => {
      const ev = event as unknown as {
        resultIndex: number;
        results: SpeechRecognitionResultList;
      };
      let finalText = liveSpeechRef.current;
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
        const piece = ev.results[i]?.[0]?.transcript ?? "";
        if (ev.results[i].isFinal) {
          finalText = `${finalText} ${piece}`.replace(/\s+/g, " ").trim();
        } else {
          interim += piece;
        }
      }
      liveSpeechRef.current = finalText;
      const next = `${finalText} ${interim}`.replace(/\s+/g, " ").trim();
      if (next) {
        setTranscript(next);
        setStatus("Speech detected — keep talking, then press Stop.");
      }
    };
    recognition.onerror = () => {};
    recognition.onend = () => {
      if (!listeningRef.current || !mountedRef.current) return;
      try {
        recognition.start();
      } catch {}
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {}
  }

  const askAi = useCallback(async (text: string) => {
    const question = text.trim();
    if (!question || askingRef.current) return;
    askingRef.current = true;
    setPending(true);
    setPhase("thinking");
    setError("");
    setStatus("StudyMind is preparing a clear explanation…");
    try {
      const { reply: aiReply } = await aiApi.chat(question);
      if (!mountedRef.current) return;
      setReply(aiReply || "No reply received.");
      setPhase("done");
      setStatus("Answer ready — listen or read below.");
      speakText(aiReply || "");
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "Voice tutor failed");
      setPhase("error");
      setStatus("Could not get a reply. Try again.");
    } finally {
      askingRef.current = false;
      if (mountedRef.current) setPending(false);
    }
  }, []);

  async function startRecording() {
    setError("");
    setReply("");
    setTranscript("");
    liveSpeechRef.current = "";
    chunksRef.current = [];
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
          channelCount: 1,
        },
      });
    } catch {
      setError("Microphone permission denied. Allow mic access for this site and try again.");
      setPhase("error");
      setStatus("Microphone permission required");
      return;
    }

    mediaStreamRef.current = stream;
    const mime = pickRecorderMime();
    let recorder: MediaRecorder;
    try {
      recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 128000 })
        : new MediaRecorder(stream);
    } catch {
      try {
        recorder = new MediaRecorder(stream);
      } catch {
        stream.getTracks().forEach((t) => t.stop());
        setError("Recording is not supported in this browser. Type your question below.");
        setPhase("error");
        return;
      }
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorderRef.current = recorder;
    recorder.start(250);
    startLevelMeter(stream);
    startBrowserSpeech();
    listeningRef.current = true;
    recordStartedAtRef.current = Date.now();
    setRecordMs(0);
    recordTimerRef.current = setInterval(() => {
      setRecordMs(Date.now() - recordStartedAtRef.current);
    }, 200);
    setListening(true);
    setPhase("listening");
    setStatus("Mic is on — speak your full question, then press Stop.");
  }

  async function stopRecordingAndAsk() {
    const elapsed = Date.now() - recordStartedAtRef.current;
    if (elapsed < 1500) {
      setError("Keep speaking a bit longer, then press Stop.");
      return;
    }

    listeningRef.current = false;
    setListening(false);
    setPhase("transcribing");
    setStatus("Transcribing your voice…");
    setPending(true);
    stopLevelMeter();

    try {
      recognitionRef.current?.stop();
    } catch {}

    const liveText = (liveSpeechRef.current || transcript).trim();

    const recorder = mediaRecorderRef.current;
    const audioBlob = await new Promise<Blob | null>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        const type = (recorder?.mimeType || "audio/webm").split(";")[0] || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        resolve(blob.size > 400 ? blob : null);
      };
      if (!recorder || recorder.state === "inactive") {
        finish();
        return;
      }
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => setTimeout(finish, 400);
      try {
        if (recorder.state === "recording") recorder.requestData();
        recorder.stop();
      } catch {
        finish();
      }
      setTimeout(finish, 3000);
    });

    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;

    if (liveText && !isWeakTranscript(liveText)) {
      setTranscript(liveText);
      setPending(false);
      await askAi(liveText);
      return;
    }

    if (!audioBlob) {
      setPending(false);
      setError("No usable audio was recorded. Allow the mic, speak clearly, then Stop.");
      setPhase("error");
      setStatus("No audio captured — try again.");
      return;
    }

    try {
      let uploadBlob = audioBlob;
      try {
        uploadBlob = await blobToWav(audioBlob);
      } catch {
        uploadBlob = new Blob([audioBlob], {
          type: (audioBlob.type || "audio/webm").split(";")[0] || "audio/webm",
        });
      }

      const { text } = await aiApi.transcribe(uploadBlob);
      if (!mountedRef.current) return;
      const cleaned = (text || "").trim();
      setTranscript(cleaned || liveText);

      const best = !isWeakTranscript(cleaned)
        ? cleaned
        : !isWeakTranscript(liveText)
          ? liveText
          : cleaned || liveText;

      if (!best || isWeakTranscript(best)) {
        setError(
          best
            ? `Heard only “${best}”. Speak the full question clearly, closer to the mic, then Stop.`
            : "Could not understand the audio. Speak closer and try again, or type your question."
        );
        setPhase("error");
        setStatus("Transcription unclear — try again.");
        setPending(false);
        return;
      }

      setTranscript(best);
      setPending(false);
      await askAi(best);
    } catch (e) {
      if (!mountedRef.current) return;
      if (liveText && !isWeakTranscript(liveText)) {
        setTranscript(liveText);
        setPending(false);
        await askAi(liveText);
        return;
      }
      setError(e instanceof Error ? e.message : "Transcription failed");
      setPhase("error");
      setStatus("Could not transcribe audio.");
      setPending(false);
    }
  }

  async function toggleListen() {
    if (pending) return;
    if (listening) {
      await stopRecordingAndAsk();
      return;
    }
    await startRecording();
  }

  async function askTyped() {
    const text = typed.trim() || transcript.trim();
    if (!text) {
      setError("Type a question or use the microphone first.");
      return;
    }
    setTranscript(text);
    setTyped("");
    await askAi(text);
  }

  const bars = Array.from({ length: 12 }, (_, i) => {
    const boosted = Math.min(1, level * 8);
    const threshold = (i + 1) / 14;
    const active = listening && boosted > threshold * 0.2;
    const height = active ? 8 + Math.min(28, boosted * 36 * (1 + (i % 3) * 0.15)) : 6;
    return height;
  });

  return (
    <PageShell
      inset
      header={<TopBar title="Voice Tutor" subtitle="Guided voice sessions with StudyMind AI" />}
    >
      <div className="mx-auto w-full max-w-5xl space-y-4 pb-2">
        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <GlassCard className="flex flex-col items-center p-6 text-center sm:p-8">
            <div className="relative mb-6">
              <div
                className={cn(
                  "absolute inset-0 rounded-full bg-[#c9a84c]/20 blur-2xl",
                  listening && "animate-pulse"
                )}
              />
              <div
                className={cn(
                  "relative flex h-36 w-36 items-center justify-center rounded-full border border-[#c9a84c]/40 bg-gradient-to-br from-[#c9a84c]/30 to-[#8a6420]/20",
                  listening && "ring-2 ring-[#e2b96f]/45"
                )}
              >
                {pending || phase === "transcribing" || phase === "thinking" ? (
                  <Loader2 className="h-14 w-14 animate-spin text-[#e2b96f]" />
                ) : listening ? (
                  <Waves className="h-14 w-14 text-[#e2b96f]" />
                ) : phase === "done" ? (
                  <Sparkles className="h-14 w-14 text-[#e2b96f]" />
                ) : (
                  <Volume2 className="h-14 w-14 text-[#e2b96f]" />
                )}
              </div>
            </div>

            <div className="mb-4 flex h-10 items-end justify-center gap-1">
              {bars.map((h, i) => (
                <span
                  key={i}
                  className={cn(
                    "w-1.5 rounded-full transition-all duration-75",
                    listening ? "bg-[#e2b96f]" : "bg-[#c9a84c]/25"
                  )}
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>

            <h2 className="text-lg font-semibold">
              {phase === "listening"
                ? "Listening"
                : phase === "transcribing"
                  ? "Transcribing"
                  : phase === "thinking"
                    ? "Thinking"
                    : phase === "done"
                      ? "Answer ready"
                      : "Ready when you are"}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted">{status}</p>
            {listening ? (
              <p className="mt-1 text-xs text-[#e2b96f]/80">
                Recording {Math.max(1, Math.round(recordMs / 1000))}s
                {peakLevel > 0.02 ? " · voice detected" : " · speak louder"}
              </p>
            ) : null}

            <Button
              className="mt-7 min-w-[11rem]"
              size="lg"
              variant={listening ? "danger" : "default"}
              disabled={pending}
              onClick={() => void toggleListen()}
            >
              {listening ? (
                <>
                  <MicOff className="h-4 w-4" />
                  Stop &amp; continue
                </>
              ) : pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working…
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  {phase === "done" || phase === "error" ? "Ask again" : "Start listening"}
                </>
              )}
            </Button>

            <div className="mt-6 w-full max-w-md border-t border-[var(--panel-divider)] pt-5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void askTyped();
                  }}
                  placeholder="Type your question…"
                  disabled={pending || listening}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-[#c9a84c]/40"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-10 shrink-0"
                  disabled={pending || listening || (!typed.trim() && !transcript.trim())}
                  onClick={() => void askTyped()}
                >
                  <Send className="h-4 w-4" />
                  Ask
                </Button>
              </div>
            </div>
          </GlassCard>

          <div className="flex flex-col gap-3">
            <GlassCard className="flex-1 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c9a84c]/15 text-[#e2b96f]">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Your question</p>
                  <p className="text-[11px] text-muted">
                    {listening ? "Live transcript while you speak…" : "Captured speech or typed input"}
                  </p>
                </div>
              </div>
              {transcript ? (
                <p className="rounded-xl border border-[#c9a84c]/20 bg-[#c9a84c]/8 px-3 py-3 text-sm leading-relaxed text-[#f0d08a]">
                  {transcript}
                  {listening ? <span className="ml-1 animate-pulse text-[#e2b96f]">▌</span> : null}
                </p>
              ) : (
                <p className="rounded-xl border border-dashed border-[var(--panel-border)] px-3 py-6 text-center text-sm text-muted">
                  {listening
                    ? "Speak now… text may appear live, or after Stop."
                    : phase === "transcribing"
                      ? "Turning speech into text…"
                      : "Your question will appear here."}
                </p>
              )}
            </GlassCard>

            <GlassCard className="flex-[1.2] p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c9a84c]/15 text-[#e2b96f]">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">StudyMind answer</p>
                  <p className="text-[11px] text-muted">Spoken aloud and shown as text</p>
                </div>
              </div>
              {pending || phase === "transcribing" || phase === "thinking" ? (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-subtle)] px-3 py-6 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-[#e2b96f]" />
                  {phase === "transcribing" ? "Transcribing voice…" : "Preparing answer…"}
                </div>
              ) : reply ? (
                <p className="max-h-[280px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-[var(--panel-border)] bg-[var(--panel-subtle)] px-3 py-3 text-sm leading-relaxed text-foreground">
                  {reply}
                </p>
              ) : (
                <p className="rounded-xl border border-dashed border-[var(--panel-border)] px-3 py-6 text-center text-sm text-muted">
                  The AI reply will appear here after you ask.
                </p>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
