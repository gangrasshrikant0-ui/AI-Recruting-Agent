import Shell from '@/components/Shell';
import Outbox from '@/components/Outbox';
export default function Page() {
  return <Shell roles={['recruiter', 'admin']}><Outbox /></Shell>;
}

