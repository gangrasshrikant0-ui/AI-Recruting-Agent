'use client';
import { useState } from 'react';

export default function CandidateImport() {
  const [csv, setCsv] = useState('');
  const [jobId, setJobId] = useState('job-1');
  const [result, setResult] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function importCSV() {
    setLoading(true);
    setResult([]);
    const lines = csv.trim().split('\n').filter(Boolean);
    const log: string[] = [];
    for (const line of lines) {
      const parts = line.split(',');
      const [name, email, phone, skills, experience_years, location] = parts;
      if (!name || !email) { log.push(`Skipped: ${line}`); continue; }
      const r = await fetch('/api/candidates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone?.trim(), skills: skills?.trim(), experience_years: parseInt(experience_years) || 0, location: location?.trim(), job_id: jobId })
      });
      const d = await r.json();
      log.push(d.id ? `✓ ${name.trim()} (${d.id})` : `✗ ${name.trim()}: ${d.error}`);
    }
    setResult(log);
    setLoading(false);
  }

  return (
    <div className="p-8 max-w-2xl">
      <a href="/recruiter/candidates" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Back</a>
      <h1 className="text-2xl font-bold mb-6">Import Candidates (CSV)</h1>
      <p className="text-sm text-gray-500 mb-4">Format: <code>name,email,phone,skills,experience_years,location</code></p>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Job ID</label>
        <select className="border rounded px-3 py-2 text-sm w-full" value={jobId} onChange={e => setJobId(e.target.value)}>
          <option value="job-1">job-1</option>
          <option value="job-2">job-2</option>
          <option value="job-3">job-3</option>
        </select>
      </div>

      <textarea
        className="w-full border rounded-xl p-4 h-48 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        placeholder={"Rahul Sharma,rahul@example.com,9876543210,Python React,3,Mumbai"}
        value={csv} onChange={e => setCsv(e.target.value)}
      />

      <button onClick={importCSV} disabled={loading || !csv.trim()}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Importing…' : 'Import'}
      </button>

      {result.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-xl p-4">
          <h2 className="font-semibold mb-2">Results</h2>
          <ul className="text-sm space-y-1 font-mono">
            {result.map((r, i) => <li key={i} className={r.startsWith('✓') ? 'text-green-700' : 'text-red-600'}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

