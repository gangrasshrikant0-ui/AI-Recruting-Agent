'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
export function Dashboard() {
  const [s,setS]=useState<Record<string,unknown>|null>(null);
  const [ap,setAp]=useState<unknown[]>([]);
  useEffect(()=>{fetch('/api/analytics').then(r=>r.json()).then(setS);fetch('/api/approvals').then(r=>r.json()).then(d=>setAp((d.approvals||[]).filter((a:Record<string,unknown>)=>a.status==='pending')));}, []);
  const stat=(label:string,val:unknown,icon:string,color:string)=>(
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="text-2xl">{icon}</div><div className={`text-3xl font-bold mt-1 ${color}`}>{String(val??'...')}</div><div className="text-slate-400 text-sm">{label}</div>
    </div>
  );
  return(
    <div className="p-6 space-y-5">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-slate-400 text-sm">Acme Corp · Hiring Overview</p></div>
        <div className="flex gap-2"><Link href="/recruiter/jobs/new" className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700">+ New Job</Link><Link href="/recruiter/candidates/import" className="px-4 py-2 bg-slate-700 rounded-lg text-sm hover:bg-slate-600">📥 Import</Link></div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {stat('Applications',s?.totalApps,'📄','text-blue-400')}
        {stat('Active Jobs',s?.totalJobs,'💼','text-green-400')}
        {stat('Interviews',s?.totalInterviews,'🎙️','text-purple-400')}
        {stat('Pending Approvals',ap.length,'⏳','text-orange-400')}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h2 className="font-semibold mb-3">Pipeline</h2>
          {((s?.byStage as Array<{stage:string;count:number}>)||[]).slice(0,8).map(x=>(
            <div key={x.stage} className="flex items-center gap-2 mb-1.5">
              <div className="text-slate-400 text-xs w-36 truncate">{x.stage}</div>
              <div className="flex-1 bg-slate-700 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{width:`${Math.min(100,x.count*15)}%`}}/></div>
              <div className="text-xs text-slate-300 w-4">{x.count}</div>
            </div>
          ))}
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">🤖 AI Insights</h2>
          <p className="text-slate-300 text-sm leading-relaxed">{s?.insights as string||'Loading...'}</p>
          {ap.length>0&&<div className="pt-3 border-t border-slate-700"><div className="text-orange-400 text-sm font-medium mb-2">⏳ {ap.length} Pending</div><Link href="/recruiter/approvals" className="text-blue-400 text-sm hover:underline">Review approvals →</Link></div>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {([['💼','Jobs','/recruiter/jobs'],['👥','Candidates','/recruiter/candidates'],['🔄','ATS Pipeline','/recruiter/pipeline'],['🎙️','Interviews','/recruiter/interviews'],['📈','Analytics','/recruiter/analytics'],['🤖','AI Assistant','/recruiter/assistant']] as [string,string,string][]).map(([icon,label,href])=>(
          <Link key={href} href={href} className="bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-xl p-3 transition-colors"><div className="text-xl mb-1">{icon}</div><div className="font-medium text-sm">{label}</div></Link>
        ))}
      </div>
    </div>
  );
}

