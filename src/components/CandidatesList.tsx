'use client';
import { useEffect, useState } from 'react';

interface Candidate {
  id: string; name: string; email: string; skills: string; experience_years: number; location: string;
}

export default function CandidatesList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/candidates').then(r => r.json()).then(d => { setCandidates(d.candidates || []); setLoading(false); });
  }, []);

  const filtered = candidates.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.skills?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Candidates</h1>
        <a href="/recruiter/candidates/import" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Import CSV</a>
      </div>
      <input
        className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Search candidates…"
        value={search} onChange={e => setSearch(e.target.value)}
      />
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skills</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exp</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-600 text-sm">{c.email}</td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{c.skills}</td>
                <td className="px-4 py-3 text-sm">{c.experience_years}y</td>
                <td className="px-4 py-3">
                  <a href={`/recruiter/candidates/${c.id}`} className="text-blue-600 hover:underline text-sm">View</a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No candidates found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

