'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
const NAV: Record<string,{href:string;label:string;icon:string}[]> = {
  recruiter:[{href:'/recruiter',label:'Dashboard',icon:'📊'},{href:'/recruiter/jobs',label:'Jobs',icon:'💼'},{href:'/recruiter/candidates',label:'Candidates',icon:'👥'},{href:'/recruiter/pipeline',label:'ATS Pipeline',icon:'🔄'},{href:'/recruiter/interviews',label:'Interviews',icon:'🎙️'},{href:'/recruiter/evaluations',label:'Evaluations',icon:'📋'},{href:'/recruiter/approvals',label:'Approvals',icon:'✅'},{href:'/recruiter/outbox',label:'Comms',icon:'📬'},{href:'/recruiter/analytics',label:'Analytics',icon:'📈'},{href:'/recruiter/assistant',label:'AI Assistant',icon:'🤖'},{href:'/recruiter/audit',label:'Audit',icon:'📝'}],
  interviewer:[{href:'/interviewer',label:'My Schedule',icon:'📅'},{href:'/interviewer/candidates',label:'Candidates',icon:'👥'},{href:'/interviewer/evaluations',label:'Evaluations',icon:'📋'}],
  candidate:[{href:'/portal',label:'My Applications',icon:'📄'},{href:'/portal/interviews',label:'Interviews',icon:'🎙️'},{href:'/portal/support',label:'Support',icon:'❓'}],
  admin:[{href:'/admin',label:'Overview',icon:'🏠'},{href:'/admin/users',label:'Users',icon:'👤'},{href:'/admin/health',label:'Health',icon:'💚'},{href:'/admin/audit',label:'Audit',icon:'📝'}],
};
export function Sidebar({role}:{role:string}) {
  const pathname = usePathname(); const router = useRouter();
  const items = NAV[role]||[];
  async function sw(r:string) {
    const m:Record<string,string>={recruiter:'user-recruiter',interviewer:'user-interviewer',candidate:'user-candidate',admin:'user-admin'};
    await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:m[r]})});
    router.push(r==='candidate'?'/portal':r==='interviewer'?'/interviewer':r==='admin'?'/admin':'/recruiter');
    router.refresh();
  }
  return (
    <div className="w-52 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-slate-800"><div className="font-bold text-white">🤖 AI Recruiter</div><div className="text-slate-500 text-xs">Acme Corp</div></div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-auto">
        {items.map(i=><Link key={i.href} href={i.href} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',pathname===i.href?'bg-blue-600 text-white':'text-slate-400 hover:bg-slate-800 hover:text-white')}><span>{i.icon}</span>{i.label}</Link>)}
      </nav>
      <div className="p-3 border-t border-slate-800">
        <div className="text-xs text-slate-600 mb-1 font-medium">Switch Role</div>
        {['recruiter','interviewer','candidate','admin'].map(r=><button key={r} onClick={()=>sw(r)} className={cn('w-full text-left px-2 py-1 rounded text-xs',r===role?'bg-blue-900 text-blue-300':'text-slate-500 hover:bg-slate-800')}>{r}</button>)}
      </div>
    </div>
  );
}

