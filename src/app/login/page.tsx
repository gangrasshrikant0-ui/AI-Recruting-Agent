'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const USERS = [
  { id: 'user-admin', name: 'Admin User', role: 'Admin', email: 'admin@acme.com', color: 'bg-purple-600' },
  { id: 'user-recruiter', name: 'Priya Recruiter', role: 'Recruiter', email: 'recruiter@acme.com', color: 'bg-blue-600' },
  { id: 'user-interviewer', name: 'Raj Interviewer', role: 'Interviewer', email: 'interviewer@acme.com', color: 'bg-green-600' },
  { id: 'user-candidate', name: 'Arjun Candidate', role: 'Candidate', email: 'candidate@acme.com', color: 'bg-orange-600' },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  async function login(userId: string) {
    setLoading(userId);
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl font-bold text-white mb-2">🤖</div>
          <h1 className="text-2xl font-bold text-white">AI Recruiting Agent</h1>
          <p className="text-slate-400 mt-1">Autonomous voice-first recruitment platform</p>
          <p className="text-slate-500 text-sm mt-1">Demo — click any role to sign in instantly</p>
        </div>
        <div className="space-y-3">
          {USERS.map(u => (
            <button key={u.id} onClick={() => login(u.id)} disabled={!!loading}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all text-left">
              <div className={`w-12 h-12 rounded-full ${u.color} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>{u.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white">{u.name}</div>
                <div className="text-sm text-slate-400">{u.email}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${u.color} flex-shrink-0`}>{u.role}</div>
              {loading === u.id && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"/>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

