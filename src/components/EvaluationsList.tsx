'use client';
import { useEffect, useState } from 'react';

export default function EvaluationsList() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch('/api/interviews').then(r => r.json()).then(d => {
      setInterviews((d.interviews || []).filter((i: any) => i.completed));
      setLoading(false);
    });
  }, []);

  async function evaluate(id: string) {
    setEvaluating(id);
    const r = await fetch(`/api/interviews/${id}/evaluate`, { method: 'POST' });
    const d = await r.json();
    setResults(prev => ({ ...prev, [id]: d.evaluation }));
    setEvaluating(null);
  }

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Evaluations</h1>
      <div className="space-y-4">
        {interviews.map(iv => (
          <div key={iv.id} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold">{iv.candidate_name}</h2>
                <p className="text-sm text-gray-500">{iv.job_title} · {iv.id}</p>
              </div>
              <button onClick={() => evaluate(iv.id)} disabled={evaluating === iv.id}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
                {evaluating === iv.id ? 'Evaluating…' : 'Generate Evaluation'}
              </button>
            </div>
            {results[iv.id] && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-blue-600">{results[iv.id].overall_score}/100</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    results[iv.id].verdict === 'strong_match' ? 'bg-green-100 text-green-700' :
                    results[iv.id].verdict === 'potential_match' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>{results[iv.id].verdict?.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-sm text-gray-700">{results[iv.id].summary}</p>
                {results[iv.id].competencies && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {Object.entries(results[iv.id].competencies).map(([k, v]: [string, any]) => (
                      <div key={k} className="text-xs">
                        <span className="font-medium capitalize">{k}: </span>
                        <span className="text-blue-600">{v.score}/10</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {interviews.length === 0 && <p className="text-center text-gray-400 py-12">No completed interviews yet.</p>}
      </div>
    </div>
  );
}

