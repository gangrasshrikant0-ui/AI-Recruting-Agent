'use client';
import { useState } from 'react';

const SUGGESTIONS = [
  'Summarize pipeline status',
  'Which candidates should I prioritize?',
  'Show overdue interviews',
  'What jobs have the most applicants?',
];

export default function AssistantChat({ role }: { role?: string }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: 'Hi! I\'m your Recruiting Assistant. Ask me anything about your pipeline, candidates, or interviews.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send(text?: string) {
    const query = text || input;
    if (!query.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setInput('');
    setLoading(true);
    try {
      const r = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: query, role }) });
      const d = await r.json();
      setMessages(prev => [...prev, { role: 'assistant', content: d.reply || d.error || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error contacting assistant.' }]);
    }
    setLoading(false);
  }

  return (
    <div className="p-8 flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-4">Recruiter Assistant</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => send(s)} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100 border border-blue-200">
            {s}
          </button>
        ))}
      </div>
      <div className="flex-1 bg-white rounded-xl shadow p-4 overflow-y-auto mb-4 space-y-3 min-h-80 max-h-[500px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-lg px-4 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 bg-gray-100 rounded-2xl text-sm text-gray-500">Thinking…</div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ask anything…"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
          Send
        </button>
      </div>
    </div>
  );
}

