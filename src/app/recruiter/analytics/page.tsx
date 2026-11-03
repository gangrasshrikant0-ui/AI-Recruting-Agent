import Shell from '@/components/Shell';
import Analytics from '@/components/Analytics';
export default function Page() {
  return <Shell roles={['recruiter', 'admin']}><Analytics /></Shell>;
}

