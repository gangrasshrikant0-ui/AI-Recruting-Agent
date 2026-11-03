'use client';
import { useEffect, useState } from 'react'; import Link from 'next/link';
export function JobView({id}:{id:string}) {
  const [job,setJob]=useState<Record<string,unknown>|null>(null);
  const [cands,setCands]=useState<Record<string,unknown>[]>([]);
  const [busy,setBusy]=useState(false);
  useEffect(()=>{fetch(`/api/jobs/${id}`).then(r=>r.json()).then(d=>setJob(d.job));fetch(`/api/candidates?jobId=${id}`).then(r=>r.json()).then(d=>setCands(d.candidates||[]));}, [id]);
  async function analyze(){setBusy(true);const r=await fetch(`/api/jobs/${id}/analyze`,{method:'POST'});const d=await r.json();setJob(j=>j?{...j,criteria:JSON.stringify(d.criteria),blueprint:JSON.stringify(d.blueprint)}:null);setBusy(false);}
  if(!job)return<div className="p-6 text-slate-400">Loading...</div>;
  const cr=job.criteria?JSON.parse(job.criteria as string):null;
  const bp=job.blueprint?JSON.parse(job.blueprint as string):null;
  return(<div className="p-6 space-y-5 max-w-5xl">
    <div className="flex justify-between items-start">
      <div><h1 className="text-2xl font-bold">{job.title as string}</h1><p className="text-slate-400">{job.department as string}</p></div>
      <div className="flex gap-2">
        <button onClick={analyze} disabled={busy} className="px-4 py-2 bg-purple-600 rounded-lg text-sm disabled:opacity-50">{busy?'🤖 Analyzing...':'🤖 Re-analyze'}</button>
        <Link href={`/recruiter/candidates?jobId=${id}`} className="px-4 py-2 bg-blue-600 rounded-lg text-sm">View Candidates</Link>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-5">
      {cr&&<div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h2 className="font-semibold mb-3">📋 AI Criteria</h2>
        <div className="space-y-2 text-sm">
          <div><span className="text-slate-500">Experience:</span> {cr.experience}</div>
          <div><span className="text-slate-500">Must-have:</span><div className="flex flex-wrap gap-1 mt-1">{cr.mandatorySkills?.map((s:string)=><span key={s} className="px-2 py-0.5 bg-blue-900 text-blue-300 rounded text-xs">{s}</span>)}</div></div>
          <div><span className="text-slate-500">Stages:</span> {cr.interviewStages?.join(' → ')}</div>
        </div>
      </div>}
      {bp&&<div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h2 className="font-semibold mb-3">🗺️ Blueprint ({bp.questions?.length} Qs)</h2>
        <div className="space-y-2">{bp.questions?.slice(0,3).map((q:Record<string,string>,i:number)=>(
          <div key={i} className="text-xs border border-slate-700 rounded p-2">
            <div className="text-slate-300">{q.text}</div>
            <div className="flex gap-1 mt-1"><span className={`px-1 rounded ${q.difficulty==='hard'?'bg-red-900 text-red-300':q.difficulty==='medium'?'bg-yellow-900 text-yellow-300':'bg-green-900 text-green-300'}`}>{q.difficulty}</span><span className="text-slate-500">{q.category}</span></div>
          </div>
        ))}</div>
      </div>}
    </div>
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex justify-between mb-3"><h2 className="font-semibold">Candidates ({cands.length})</h2><Link href={`/recruiter/candidates/import`} className="text-sm text-blue-400">+ Import CSV</Link></div>
      {cands.slice(0,8).map(c=>(
        <div key={String(c.id)} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
          <div><span className="font-medium">{c.name as string}</span><span className="text-slate-400 text-sm ml-2">{c.email as string}</span></div>
          <div className="flex items-center gap-2">
            {typeof c.match_score === 'number' && <span className="text-green-400 text-sm font-medium">{Math.round(c.match_score)}%</span>}
            <span className="text-xs px-2 py-0.5 bg-slate-700 rounded">{c.stage as string||'—'}</span>
            <Link href={`/recruiter/candidates/${c.id}`} className="text-xs text-blue-400">View →</Link>
          </div>
        </div>
      ))}
    </div>
  </div>);
}
export default JobView;

