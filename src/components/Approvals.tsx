'use client';
import { useEffect, useState } from 'react';

export default function Approvals() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const d = await fetch('/api/approvals').then(r => r.json());
    setApprovals(d.approvals || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function decide(id: string, decision: string) {
    await fetch(`/api/approvals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision, reason: '' }) });
    load();
  }

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;

  const pending = approvals.filter(a => a.status === 'pending');
  const done = approvals.filter(a => a.status !== 'pending');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Approvals Inbox</h1>
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-orange-600">Pending ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(a => (
              <div key={a.id} className="bg-white rounded-xl shadow p-5 flex items-start justify-between">
                <div>
                  <p className="font-medium">{a.type?.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-gray-500 mt-1">{a.description || JSON.stringify(a.payload || {}).slice(0, 100)}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => decide(a.id, 'approved')} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700">Approve</button>
                  <button onClick={() => decide(a.id, 'rejected')} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <h2 className="text-lg font-semibold mb-3 text-gray-600">Resolved ({done.length})</h2>
      <div className="space-y-2">
        {done.map(a => (
          <div key={a.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
            <p className="text-sm">{a.type?.replace(/_/g, ' ')}</p>
            <span className={`px-2 py-1 rounded text-xs font-medium ${a.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
          </div>
        ))}
        {done.length === 0 && <p className="text-gray-400 text-sm">None yet.</p>}
      </div>
    </div>
  );
}

