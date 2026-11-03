'use client';
import { useEffect, useState } from 'react';

interface Interview {
  id: string; candidate_name: string; job_title: string; status: string; completed: number; scheduled_at: number;
}

export default function InterviewsList({ role }: { role?: string }) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/interviews').then(r => r.json()).then(d => { setInterviews(d.interviews || []); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Interviews</h1>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {interviews.map(iv => (
              <tr key={iv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{iv.candidate_name || iv.id}</td>
                <td className="px-4 py-3 text-gray-600">{iv.job_title || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${iv.completed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {iv.completed ? 'Completed' : iv.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a href={`/interview/${iv.id}`} className="text-blue-600 hover:underline text-sm">
                    {iv.completed ? 'View' : 'Start'}
                  </a>
                </td>
              </tr>
            ))}
            {interviews.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No interviews yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

