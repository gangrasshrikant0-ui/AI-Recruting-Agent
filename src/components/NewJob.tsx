'use client';
import { useState } from 'react'; import { useRouter } from 'next/navigation';
export function NewJob() {
  const router = useRouter();
  const [f,setF]=useState({title:'',department:'',description:''});
  const [state,setState]=useState('idle');
  const [result,setResult]=useState<Record<string,unknown>|null>(null);
  async function submit() {
    setState('creating');
    const r = await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)});
    const {id} = await r.json();
    if (f.description) { setState('analyzing'); const ar=await fetch(`/api/jobs/${id}/analyze`,{method:'POST'}); setResult(await ar.json()); }
    setState('done'); setTimeout(()=>router.push(`/recruiter/jobs/${id}`),1200);
  }
  return(<div className="p-6 max-w-2xl space-y-4">
    <h1 className="text-2xl font-bold">Create Job</h1>
    <input value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))} placeholder="Job Title" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"/>
    <input value={f.department} onChange={e=>setF(p=>({...p,department:e.target.value}))} placeholder="Department" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"/>
    <textarea value={f.description} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="Paste job description — AI will analyze it..." rows={8} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"/>
    <button onClick={submit} disabled={state!=='idle'||!f.title} className="px-6 py-2 bg-blue-600 rounded-lg disabled:opacity-50">
      {state==='creating'?'Creating...':state==='analyzing'?'🤖 AI Analyzing...':state==='done'?'✅ Done!':'Create + Analyze'}
    </button>
    {result&&<div className="bg-slate-800 border border-green-700 rounded-xl p-4 text-sm text-green-300">✅ AI found {(result.criteria as Record<string,unknown[]>)?.mandatorySkills?.length??0} key skills · {(result.blueprint as Record<string,unknown[]>)?.questions?.length??0} interview questions generated</div>}
  </div>);
}
export default NewJob;

