'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const USERS = [
  { id: 'user-recruiter', name: 'Priya Recruiter', role: 'Recruiter', email: 'recruiter@acme.com', color: 'bg-blue-600', desc: 'Full ATS, JDs, pipeline, candidate scoring & approvals' },
  { id: 'user-candidate', name: 'Arjun Candidate', role: 'Candidate', email: 'candidate@acme.com', color: 'bg-orange-600', desc: 'Candidate portal, applications & voice interview' },
  { id: 'user-interviewer', name: 'Raj Interviewer', role: 'Interviewer', email: 'interviewer@acme.com', color: 'bg-emerald-600', desc: 'Assigned schedules, interview rooms & scorecards' },
  { id: 'user-admin', name: 'Admin User', role: 'Admin', email: 'admin@acme.com', color: 'bg-purple-600', desc: 'System governance, user administration & audit logs' },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function login(userId: string) {
    setLoading(userId);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const { user } = await res.json();
      if (user.role === 'candidate') router.push('/portal');
      else if (user.role === 'interviewer') router.push('/interviewer');
      else if (user.role === 'admin') router.push('/admin');
      else router.push('/recruiter');
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-4xl mb-3 shadow-inner">
            🤖🎯
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Recruiting Agent Platform</h1>
          <p className="text-slate-400 text-sm mt-1">Autonomous voice-first recruitment & ATS suite</p>
        </div>

        {/* Quick Launch Cards for Voice Screener & Interview Room */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Link
            href="/recruiter/sarvam"
            onClick={async () => { await login('user-recruiter'); }}
            className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500/60 transition group text-left"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">🎙️</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">Sarvam AI</span>
            </div>
            <div className="font-semibold text-white text-sm group-hover:text-emerald-300 transition">Voice Screener</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Hindi / Marathi / English first-round screener</div>
          </Link>

          <Link
            href="/interview/int-3"
            className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-blue-500/30 hover:border-blue-500/60 transition group text-left"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">🗣️</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">Web Speech</span>
            </div>
            <div className="font-semibold text-white text-sm group-hover:text-blue-300 transition">Live Interview Room</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Real-time STT / TTS interactive test session</div>
          </Link>
        </div>

        {/* Persona Select */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider px-1 mb-3">
            Select Demo Persona to Sign In
          </div>
          <div className="space-y-2.5">
            {USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => login(u.id)}
                disabled={!!loading}
                className="w-full flex items-center gap-3.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-500 transition-all text-left"
              >
                <div className={`w-10 h-10 rounded-xl ${u.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                  {u.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{u.name}</span>
                    <span className="text-[11px] text-slate-400">({u.role})</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">{u.desc}</div>
                </div>
                {loading === u.id && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
