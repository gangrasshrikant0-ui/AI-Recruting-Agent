"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, Mic, MicOff, Pause, Play, RotateCcw, Send, Volume2 } from "lucide-react";

type Phase = "consent" | "mic" | "interview" | "complete";
type Segment = { text: string; confidence: number; final: boolean };
type Question = { id: string; category: string; difficulty: number; text: string };
type Decision = { action: string; nextQuestion: string; nextQuestionId: string; confidence: number; lowConfidence: boolean; contradiction: boolean; reason: string; answered?: number; durationMs?: number };
type SavedState = { phase: Phase; sessionId: string; startedAt: number; question: Question; answer: string; segments: Segment[]; history: Array<{ question: string; answer: string }>; turns: number; paused: boolean; demo: boolean };

const initialQuestion: Question = { id: "architecture", category: "technical", difficulty: 3, text: "Walk me through a production system you designed end to end." };
const demoAnswers = [
  "I designed a TypeScript service with a React client, PostgreSQL, queues, and metrics. It handled 10,000 requests per minute and we reduced errors by 35 percent.",
  "I would reproduce the issue, inspect traces and database timings, profile the endpoint, then ship a measured fix behind a safe rollout.",
  "I built a candidate workflow personally, including the React screens and Node API. I validated it with integration tests and production metrics.",
  "I would communicate the risk, find a temporary workaround, and agree on a rollback plan while escalating the dependency owner.",
  "After feedback that my design was too complex, I removed two services, measured latency, and improved onboarding for the team.",
  "I would revisit the queue choice if traffic patterns changed, using error rate, p95 latency, and operational cost as evidence.",
];

export default function InterviewRoom() {
  const [state, setState] = useState<SavedState>({ phase: "consent", sessionId: "", startedAt: 0, question: initialQuestion, answer: "", segments: [], history: [], turns: 0, paused: false, demo: false });
  const [consent, setConsent] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [voiceRunning, setVoiceRunning] = useState(false);
  const [textOnly, setTextOnly] = useState(false);
  const [speakingRate, setSpeakingRate] = useState(1);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState("");
  const rec = useRef<any>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  const setPersistedState = useCallback((next: SavedState | ((current: SavedState) => SavedState)) => {
    setState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      stateRef.current = value;
      if (typeof window !== "undefined") localStorage.setItem("talentos-interview", JSON.stringify(value));
      return value;
    });
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("talentos-interview");
      if (saved) setState(JSON.parse(saved));
    } catch { setError("Saved interview state could not be restored."); }
    return () => { rec.current?.stop(); if (silenceTimer.current) clearTimeout(silenceTimer.current); };
  }, []);

  const speak = useCallback((text: string) => {
    if (textOnly || !("speechSynthesis" in window) || !text) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speakingRate;
    speechSynthesis.speak(utterance);
  }, [speakingRate, textOnly]);

  const startInterview = async (demo = false, consentOverride = false, announce = true) => {
    if (!consent && !consentOverride) return setError("Consent is required before starting.");
    setError("");
    const sessionId = state.sessionId || `interview-${crypto.randomUUID()}`;
    try {
      const response = await fetch("/api/interview", { method: "POST", headers: { "content-type": "application/json", "Idempotency-Key": sessionId }, body: JSON.stringify({ action: "start", sessionId, idempotencyKey: sessionId }) });
      if (!response.ok) throw new Error("Interview could not be started.");
      const data = await response.json();
      setPersistedState({ ...stateRef.current, phase: "interview", sessionId, startedAt: data.startedAt, question: data.question, answer: "", segments: [], history: [], turns: 0, paused: false, demo });
      if (announce) speak(data.question.text);
    } catch (e) { setError(e instanceof Error ? e.message : "Interview could not be started."); }
  };

  const startMicCheck = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return setError("Microphone is unavailable. Use text-only mode.");
    try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach((track) => track.stop()); setMicReady(true); } catch { setError("Microphone permission was denied. Text-only mode remains available."); }
  };

  const finishListening = () => { rec.current?.stop(); setVoiceRunning(false); if (silenceTimer.current) clearTimeout(silenceTimer.current); };
  const listen = () => {
    if (voiceRunning) return finishListening();
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) return setTextOnly(true);
    const recognition = new Recognition();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const segments: Segment[] = [];
      for (let i = 0; i < event.results.length; i += 1) segments.push({ text: event.results[i][0].transcript, confidence: event.results[i][0].confidence || 0.5, final: event.results[i].isFinal });
      const transcript = segments.map((segment) => segment.text).join(" ");
      setPersistedState((current) => ({ ...current, answer: transcript, segments }));
      if (/^(repeat|say that again|repeat the question|clarify)/i.test(transcript.trim())) { speak(stateRef.current.question.text); setPersistedState((current) => ({ ...current, answer: "", segments: [] })); }
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => { finishListening(); setError("We paused because no speech was detected. You can continue typing or try again."); }, 8000);
    };
    recognition.onerror = () => { setVoiceRunning(false); setError("Voice recognition disconnected. Your saved transcript is safe; retry or use text mode."); };
    recognition.onend = () => setVoiceRunning(false);
    rec.current = recognition; recognition.start(); setVoiceRunning(true);
  };

  const submit = async (answerOverride?: string) => {
    const answer = answerOverride ?? state.answer;
    if (!answer.trim()) return setError("Add an answer or use Skip.");
    setError("");
    const response = await fetch("/api/interview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: state.sessionId, answer, question: state.question.text, questionId: state.question.id, difficulty: state.question.difficulty, history: state.history }) });
    if (!response.ok) return setError("The interview agent is unavailable. Retry this turn.");
    const data: Decision = await response.json();
    setDecision(data);
    if (data.action === "complete" || state.turns >= 5) { setPersistedState((current) => ({ ...current, phase: "complete", answer: "", segments: [], turns: current.turns + 1 })); return; }
    setPersistedState((current) => ({ ...current, question: { ...current.question, id: data.nextQuestionId, text: data.nextQuestion, difficulty: Math.min(3, Math.max(1, current.question.difficulty + (answer.length > 180 ? 1 : -1))) }, history: [...current.history, { question: current.question.text, answer }], answer: "", segments: [], turns: current.turns + 1 }));
    speak(data.nextQuestion);
  };

  const runDemo = async () => {
    await startInterview(true, true);
    for (const answer of demoAnswers) { await new Promise((resolve) => setTimeout(resolve, 350)); await submit(answer); }
  };
  const skip = () => { setPersistedState((current) => ({ ...current, answer: "Candidate skipped this question." })); submit("Candidate skipped this question."); };
  const togglePause = () => { if (state.paused) { speechSynthesis.resume(); setPersistedState((current) => ({ ...current, paused: false })); } else { finishListening(); speechSynthesis.pause(); setPersistedState((current) => ({ ...current, paused: true })); } };
  useEffect(() => {
    if (state.phase !== "interview" || !state.startedAt) return;
    const timer = setInterval(() => {
      if (Date.now() - stateRef.current.startedAt >= 20 * 60 * 1000) setPersistedState((current) => ({ ...current, phase: "complete" }));
    }, 1000);
    return () => clearInterval(timer);
  }, [state.phase, state.startedAt, setPersistedState]);
  const reset = () => { localStorage.removeItem("talentos-interview"); setDecision(null); setConsent(false); setMicReady(false); setPersistedState({ phase: "consent", sessionId: "", startedAt: 0, question: initialQuestion, answer: "", segments: [], history: [], turns: 0, paused: false, demo: false }); };

  if (state.phase === "consent") return <div className="glass p-6 max-w-3xl"><div className="text-xs accent uppercase tracking-widest">AI interview · consent</div><h2 className="text-xl font-semibold mt-1">Before we begin</h2><p className="muted text-sm mt-3">This interview uses AI transcription and adaptive questions. Your answers are recorded for evaluation. You can pause, request a human, or use text-only mode at any time.</p><label className="flex items-center gap-3 mt-6 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I consent to recording, transcription, and AI-assisted evaluation.</label><div className="flex gap-2 mt-6">{micReady ? <button onClick={() => startInterview()} className="bg-teal-300 text-slate-950 px-4 py-2 rounded-lg font-semibold text-sm">Start interview</button> : <button onClick={() => { setConsent(true); startMicCheck(); }} className="bg-teal-300 text-slate-950 px-4 py-2 rounded-lg font-semibold text-sm">Consent & mic check</button>}<button onClick={() => { setTextOnly(true); setMicReady(true); startInterview(false, true, false); }} className="border border-slate-700 px-4 py-2 rounded-lg text-sm">Text-only accessible mode</button><button onClick={() => runDemo()} className="bg-indigo-400/20 text-indigo-200 px-4 py-2 rounded-lg text-sm">Demo interview · 6 turns</button></div>{error&&<p className="text-rose-300 text-sm mt-4">{error}</p>}</div>;
  if (state.phase === "mic") return null;
  if (state.phase === "complete") return <div className="glass p-8 max-w-3xl text-center"><CheckCircle2 size={44} className="mx-auto text-teal-300"/><h2 className="text-2xl font-semibold mt-4">Interview complete</h2><p className="muted mt-2">Your answers are saved. A recruiter will review the grounded evaluation and next steps.</p><button onClick={reset} className="mt-6 border border-slate-700 px-4 py-2 rounded-lg text-sm flex gap-2 mx-auto"><RotateCcw size={16}/> Start again</button></div>;
  return <div className="glass p-6 max-w-3xl"><div className="flex justify-between items-center mb-5"><div><div className="text-xs accent uppercase tracking-widest">AI interview · {state.demo ? "demo candidate" : "software engineering"}</div><h2 className="text-xl font-semibold mt-1">Adaptive voice screen</h2></div><div className="flex gap-2 items-center"><span className="text-xs px-2 py-1 rounded bg-emerald-400/10 text-emerald-300">{micReady || textOnly ? "Ready" : "Text mode"}</span><span className="text-xs muted">{state.turns}/6 turns</span></div></div><div className="flex gap-1 mb-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className={`h-1 flex-1 rounded ${i < state.turns ? "bg-teal-300" : i === state.turns ? "bg-indigo-400" : "bg-slate-700"}`} />)}</div><div className="bg-slate-900 rounded-xl p-5 mb-4"><div className="flex justify-between text-xs muted mb-2"><span>Question {state.turns + 1} · {state.question.category}</span><span>Difficulty {state.question.difficulty}/3</span></div><p className="text-lg">{state.question.text}</p><button onClick={() => speak(state.question.text)} className="mt-4 text-xs text-teal-300 flex items-center gap-2"><Volume2 size={14}/> Replay question</button></div><div className="flex items-center gap-3 mb-2"><label className="text-xs muted">Speaking rate</label><input aria-label="Speaking rate" type="range" min="0.7" max="1.3" step="0.1" value={speakingRate} onChange={(e) => setSpeakingRate(Number(e.target.value))}/><span className="text-xs muted">{speakingRate.toFixed(1)}x</span><button onClick={() => setTextOnly(!textOnly)} className="ml-auto text-xs text-teal-300">{textOnly ? "Enable voice" : "Text-only mode"}</button></div><div className="mb-3 text-xs">Low confidence transcript segments are <span className="bg-amber-400/30 text-amber-200 px-1 rounded">highlighted</span> for review.</div><div aria-live="polite" className="flex flex-wrap gap-1 mb-2 min-h-6">{state.segments.map((segment, i) => <span key={i} className={`text-xs px-1 rounded ${segment.confidence < 0.75 ? "bg-amber-400/30 text-amber-100" : "text-slate-400"}`}>{segment.text}</span>)}</div><textarea value={state.answer} onChange={(e) => setPersistedState((current) => ({ ...current, answer: e.target.value }))} placeholder="Speak or type your answer..." className="w-full min-h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-300"/><div className="flex flex-wrap gap-2 mt-3"><button onClick={listen} disabled={state.paused} className={`px-4 py-2 rounded-lg flex gap-2 items-center ${voiceRunning ? "bg-rose-400/20 text-rose-300" : "bg-indigo-400/20 text-indigo-200"}`}>{voiceRunning ? <MicOff size={16}/> : <Mic size={16}/>} {voiceRunning ? "Stop listening" : "Voice answer"}</button><button onClick={togglePause} className="border border-slate-700 px-3 py-2 rounded-lg flex gap-2 items-center">{state.paused ? <Play size={16}/> : <Pause size={16}/>} {state.paused ? "Resume" : "Pause"}</button><button onClick={() => submit()} disabled={!state.answer.trim() || state.paused} className="px-4 py-2 rounded-lg bg-teal-300 text-slate-950 font-semibold flex gap-2 items-center disabled:opacity-40"><Send size={16}/> Submit</button><button onClick={skip} disabled={state.paused} className="border border-slate-700 px-3 py-2 rounded-lg text-sm">Skip</button></div>{decision&&<div className="mt-4 p-3 rounded-lg bg-amber-400/10 border border-amber-300/20 text-sm"><span className="text-amber-200">Confidence {Math.round(decision.confidence * 100)}%</span> · {decision.reason}{decision.contradiction&&<span className="text-rose-300"> · Contradiction flagged</span>}</div>}{error&&<p className="text-rose-300 text-sm mt-4 flex gap-2 items-center"><Clock3 size={15}/>{error}</p>}</div>;
}
