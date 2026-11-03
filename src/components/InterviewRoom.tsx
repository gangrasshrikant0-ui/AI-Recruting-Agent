'use client';
import { useEffect, useRef, useState } from 'react';

type Stage = 'loading' | 'consent' | 'mic-check' | 'interview' | 'done';

interface Turn { role: 'ai' | 'candidate'; text: string; ts: number; }

export default function InterviewRoom({ id }: { id: string }) {
  const [stage, setStage] = useState<Stage>('loading');
  const [interview, setInterview] = useState<any>(null);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [currentQ, setCurrentQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { load(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcript]);

  async function load() {
    const r = await fetch(`/api/interviews/${id}`);
    const d = await r.json();
    if (!d.interview) { setError('Interview not found'); setStage('done'); return; }
    const iv = d.interview;
    setInterview(iv);
    const t: Turn[] = iv.transcript ? JSON.parse(iv.transcript) : [];
    setTranscript(t);
    if (iv.completed) { setStage('done'); return; }
    if (!iv.consent_given) { setStage('consent'); return; }
    if (t.length === 0) { setStage('mic-check'); return; }
    const lastAI = [...t].reverse().find(x => x.role === 'ai');
    if (lastAI) setCurrentQ(lastAI.text);
    setStage('interview');
  }

  async function giveConsent() {
    await fetch(`/api/interviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consent_given: 1 }) });
    setStage('mic-check');
  }

  async function startInterview() {
    setStage('interview');
    const r = await fetch(`/api/interviews/${id}/turn`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer: '' }) });
    const d = await r.json();
    if (d.question) {
      setCurrentQ(d.question);
      speak(d.question);
      setTranscript(prev => [...prev, { role: 'ai', text: d.question, ts: Date.now() }]);
    }
    if (d.completed) setStage('done');
  }

  async function submitAnswer() {
    if (!answer.trim()) return;
    setSubmitting(true);
    stopListening();
    const myAnswer = answer;
    setAnswer('');
    setTranscript(prev => [...prev, { role: 'candidate', text: myAnswer, ts: Date.now() }]);
    const r = await fetch(`/api/interviews/${id}/turn`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer: myAnswer }) });
    const d = await r.json();
    if (d.completed) { setStage('done'); setSubmitting(false); return; }
    if (d.question) {
      setCurrentQ(d.question);
      speak(d.question);
      setTranscript(prev => [...prev, { role: 'ai', text: d.question, ts: Date.now() }]);
    }
    setSubmitting(false);
  }

  function speak(text: string) {
    if (typeof window === 'undefined') return;
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    window.speechSynthesis?.speak(u);
  }

  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setTextMode(true); return; }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-IN';
    r.onresult = (e: any) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (final) setAnswer(prev => prev + ' ' + final);
    };
    r.onerror = () => { setListening(false); setTextMode(true); };
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    r.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  if (stage === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-500">Loading interview…</div>
    </div>
  );

  if (stage === 'done') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-3">Interview Complete!</h1>
        <p className="text-gray-600 mb-6">{error || 'Thank you for completing your interview. A recruiter will review your responses and get back to you soon.'}</p>
        <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
          <h2 className="font-semibold mb-2 text-sm uppercase text-gray-500">Your Transcript</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transcript.map((t, i) => (
              <div key={i} className={`text-sm p-2 rounded ${t.role === 'ai' ? 'bg-blue-50' : 'bg-green-50'}`}>
                <span className="font-medium">{t.role === 'ai' ? '🤖 AI' : '👤 You'}:</span> {t.text}
              </div>
            ))}
          </div>
        </div>
        <a href="/" className="text-blue-600 hover:underline text-sm">← Back to Dashboard</a>
      </div>
    </div>
  );

  if (stage === 'consent') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg">
        <div className="text-4xl mb-4">🎙️</div>
        <h1 className="text-2xl font-bold mb-3">Voice Interview</h1>
        <p className="text-gray-600 mb-4">This AI-powered interview will:</p>
        <ul className="text-sm text-gray-600 space-y-2 mb-6 list-disc list-inside">
          <li>Ask you up to 5 questions about your experience</li>
          <li>Record and transcribe your voice answers</li>
          <li>Use AI to evaluate your responses</li>
          <li>Share results with a human recruiter for review</li>
        </ul>
        <p className="text-xs text-gray-400 mb-6">By clicking "I Agree", you consent to recording and AI-assisted evaluation of this interview.</p>
        <button onClick={giveConsent} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
          I Agree — Start Interview
        </button>
      </div>
    </div>
  );

  if (stage === 'mic-check') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg text-center">
        <div className="text-4xl mb-4">🎤</div>
        <h1 className="text-2xl font-bold mb-3">Mic Check</h1>
        <p className="text-gray-600 mb-6">Make sure your microphone is working. You can also use text mode.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={startInterview} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
            🎙️ Start with Voice
          </button>
          <button onClick={() => { setTextMode(true); startInterview(); }} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300">
            ⌨️ Text Only
          </button>
        </div>
      </div>
    </div>
  );

  // interview stage
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="font-bold text-lg">AI Interview</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setTextMode(!textMode)} className="text-xs px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50">
            {textMode ? '🎙️ Voice Mode' : '⌨️ Text Mode'}
          </button>
          <span className="text-xs text-gray-400">{id}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main interview area */}
        <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
          {currentQ && (
            <div className="bg-blue-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
              <p className="text-sm font-medium opacity-75 mb-2">🤖 AI Interviewer</p>
              <p className="text-lg leading-relaxed">{currentQ}</p>
              <button onClick={() => speak(currentQ)} className="mt-3 text-xs opacity-75 hover:opacity-100">🔊 Repeat</button>
            </div>
          )}

          <div className="flex-1 mb-4">
            <textarea
              className="w-full h-32 border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={listening ? 'Listening… speak your answer' : 'Type your answer or use voice…'}
              value={answer} onChange={e => setAnswer(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            {!textMode && (
              <button
                onClick={listening ? stopListening : startListening}
                className={`px-5 py-3 rounded-xl font-medium text-sm flex-1 ${listening ? 'bg-red-100 text-red-700 border-2 border-red-300 animate-pulse' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {listening ? '⏹ Stop Recording' : '🎙 Record Answer'}
              </button>
            )}
            <button
              onClick={submitAnswer}
              disabled={submitting || !answer.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 flex-1">
              {submitting ? 'Submitting…' : 'Submit Answer →'}
            </button>
          </div>
        </div>

        {/* Transcript sidebar */}
        <div className="w-72 bg-white border-l p-4 overflow-y-auto hidden md:block">
          <h2 className="text-xs font-semibold uppercase text-gray-400 mb-3">Transcript</h2>
          <div className="space-y-2">
            {transcript.map((t, i) => (
              <div key={i} className={`text-xs p-2 rounded-lg ${t.role === 'ai' ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-700'}`}>
                <span className="font-medium">{t.role === 'ai' ? 'AI:' : 'You:'}</span> {t.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

