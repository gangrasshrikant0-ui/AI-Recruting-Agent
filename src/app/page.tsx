import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
export default function Home() {
  const role = cookies().get('user_role')?.value;
  const userId = cookies().get('user_id')?.value;
  if (!userId) redirect('/login');
  if (role === 'candidate') redirect('/portal');
  if (role === 'interviewer') redirect('/interviewer');
  if (role === 'admin') redirect('/admin');
  redirect('/recruiter');
}

