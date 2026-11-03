'use client';
import { useEffect, useState } from 'react';
import { PIPELINE_STAGES } from '@/lib/utils';

export default function Pipeline() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/applications').then(r => r.json()).then(d => { setApplications(d.applications || []); setLoading(false); });
  }, []);

  async function moveStage(id: string, stage: string) {
    await fetch(`/api/applications/${id}/stage`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage }) });
    const d = await fetch('/api/applications').then(r => r.json());
    setApplications(d.applications || []);
  }

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;

  const visibleStages = PIPELINE_STAGES.slice(0, 8);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Pipeline</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {visibleStages.map(stage => {
          const apps = applications.filter(a => a.stage === stage);
          return (
            <div key={stage} className="min-w-52 bg-gray-100 rounded-xl p-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-600 uppercase">{stage}</h3>
                <span className="bg-white text-gray-700 text-xs px-2 py-0.5 rounded-full">{apps.length}</span>
              </div>
              <div className="space-y-2">
                {apps.map(app => (
                  <div key={app.id} className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="font-medium text-sm">{app.candidate_name}</p>
                    <p className="text-xs text-gray-500 mb-2">{app.job_title}</p>
                    <div className="flex gap-1">
                      {visibleStages.indexOf(stage) < visibleStages.length - 1 && (
                        <button onClick={() => moveStage(app.id, visibleStages[visibleStages.indexOf(stage) + 1])}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">→</button>
                      )}
                      {visibleStages.indexOf(stage) > 0 && (
                        <button onClick={() => moveStage(app.id, visibleStages[visibleStages.indexOf(stage) - 1])}
                          className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">←</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

