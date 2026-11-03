import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from './Sidebar';
export function Shell({children,roles}:{children:React.ReactNode;roles?:string[]}) {
  const userId = cookies().get('user_id')?.value;
  const role = cookies().get('user_role')?.value||'recruiter';
  if (!userId) redirect('/login');
  if (roles&&!roles.includes(role)) redirect('/login');
  return <div className="flex min-h-screen bg-slate-950 text-slate-100"><Sidebar role={role}/><main className="flex-1 overflow-auto">{children}</main></div>;
}

