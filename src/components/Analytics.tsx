'use client';
import { useEffect, useState } from 'react';

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;

  const byStage: Record<string, number> = data?.byStage || {};
  const verdicts: Record<string, number> = data?.verdicts || {};
  const max = Math.max(...Object.values(byStage), 1);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Jobs', value: data?.totalJobs ?? '—' },
          { label: 'Candidates', value: data?.totalCandidates ?? '—' },
          { label: 'Interviews', value: data?.totalInterviews ?? '—' },
          { label: 'Evaluations', value: data?.totalEvaluations ?? '—' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl shadow p-5">
            <p className="text-gray-500 text-sm">{kpi.label}</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold mb-4">Pipeline by Stage</h2>
          <div className="space-y-2">
            {Object.entries(byStage).map(([stage, count]) => (
              <div key={stage}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 truncate">{stage}</span>
                  <span className="font-medium ml-2">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold mb-4">Verdict Distribution</h2>
          <div className="space-y-3">
            {Object.entries(verdicts).map(([v, count]) => (
              <div key={v} className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${v === 'strong_match' ? 'bg-green-100 text-green-700' : v === 'potential_match' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {v?.replace(/_/g, ' ')}
                </span>
                <span className="text-lg font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data?.insights && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold mb-3">AI Insights</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{data.insights}</p>
        </div>
      )}
    </div>
  );
}

