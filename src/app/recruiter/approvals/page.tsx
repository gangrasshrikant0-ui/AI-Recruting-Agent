import Shell from '@/components/Shell';
import Approvals from '@/components/Approvals';
export default function Page() {
  return <Shell roles={['recruiter', 'admin']}><Approvals /></Shell>;
}

