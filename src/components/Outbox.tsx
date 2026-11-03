'use client';
import { useEffect, useState } from 'react';

export default function Outbox() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/outbox').then(r => r.json()).then(d => { setMessages(d.messages || []); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Notifications Outbox</h1>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Body</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {messages.map(m => (
              <tr key={m.id} className="hover:bg-gray-50 text-sm">
                <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{m.channel}</span></td>
                <td className="px-4 py-3 text-gray-600">{m.recipient}</td>
                <td className="px-4 py-3 font-medium">{m.subject}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{m.body}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{m.status}</span></td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No messages yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

