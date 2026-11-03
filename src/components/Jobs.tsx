'use client';
import { useEffect, useState } from 'react'; import Link from 'next/link';
export function Jobs() {
  const [jobs,setJobs]=useState<Record<string,unknown>[]>([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{fetch('/api/jobs').then(r=>r.json()).then(d=>{setJobs(d.jobs||[]);setLoading(false);});}, []);
  return(<div className="p-6 space-y-4">
    <div className="flex justify-between"><h1 className="text-2xl font-bold">Jobs</h1><Link href="/recruiter/jobs/new" className="px-4 py-2 bg-blue-600 rounded-lg text-sm">+ New Job</Link></div>
    {loading?<div className="text-slate-400">Loading...</div>:jobs.map(j=>(
      <div key={String(j.id)} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
        <div><div className="font-semibold">{j.title as string}</div><div className="text-slate-400 text-sm">{j.department as string} · {j.status as string}</div></div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs ${j.status==='active'?'bg-green-900 text-green-300':'bg-slate-700 text-slate-400'}`}>{j.status as string}</span>
          <Link href={`/recruiter/jobs/${j.id}`} className="px-3 py-1 bg-slate-700 rounded text-sm">View →</Link>
        </div>
      </div>
    ))}
  </div>);
}

