'use client';
import { useEffect, useState } from 'react';

export default function CandidateDetail({ id }: { id: string }) {
  const [candidate, setCandidate] = useState<any>(null);
  const [screening, setScreening] = useState(false);
  const [screenResult, setScreenResult] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/candidates/${id}`).then(r => r.json()).then(d => setCandidate(d.candidate));
    fetch('/api/jobs').then(r => r.json()).then(d => { setJobs(d.jobs || []); if (d.jobs?.[0]) setSelectedJob(d.jobs[0].id); });
  }, [id]);

  async function screen() {
    setScreening(true);
    const r = await fetch(`/api/candidates/${id}/screen`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job_id: selectedJob }) });
    const d = await r.json();
    setScreenResult(d.result);
    setScreening(false);
  }

  async function createInterview() {
    const r = await fetch('/api/interviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidate_id: id, job_id: selectedJob }) });
    const d = await r.json();
    if (d.id) setMsg(`Interview created: ${d.id}. Go to Interviews.`);
  }

  if (!candidate) return <div className="p-8 text-gray-500">Loading…</div>;

  return (
    <div className="p-8 max-w-3xl">
      <a href="/recruiter/candidates" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Back</a>
      <h1 className="text-2xl font-bold mb-2">{candidate.name}</h1>
      <p className="text-gray-500 mb-1">{candidate.email} · {candidate.phone}</p>
      <p className="text-gray-500 mb-4">{candidate.location} · {candidate.experience_years}y exp</p>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="font-semibold mb-2">Skills</h2>
        <p className="text-sm text-gray-700">{candidate.skills}</p>
      </div>

      {candidate.resume_text && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold mb-2">Resume</h2>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-48 overflow-auto">{candidate.resume_text}</pre>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="font-semibold mb-3">Actions</h2>
        <select className="border rounded px-3 py-2 text-sm mb-3 w-full" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={screen} disabled={screening} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
            {screening ? 'Screening…' : 'Screen with AI'}
          </button>
          <button onClick={createInterview} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Schedule Interview
          </button>
        </div>
        {msg && <p className="mt-3 text-green-600 text-sm">{msg}</p>}
      </div>

      {screenResult && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold mb-3">AI Screening Result</h2>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl font-bold text-blue-600">{screenResult.score}/100</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${screenResult.recommendation === 'recommend' ? 'bg-green-100 text-green-700' : screenResult.recommendation === 'maybe' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              {screenResult.recommendation}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{screenResult.summary}</p>
          {screenResult.matched_skills?.length > 0 && (
            <p className="text-sm"><span className="font-medium">Matched:</span> {screenResult.matched_skills.join(', ')}</p>
          )}
          {screenResult.missing_skills?.length > 0 && (
            <p className="text-sm mt-1"><span className="font-medium">Missing:</span> {screenResult.missing_skills.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}

