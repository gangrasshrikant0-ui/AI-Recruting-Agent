import Shell from '@/components/Shell';
import AuditLog from '@/components/AuditLog';
export default function Page() {
  return <Shell roles={['recruiter', 'admin']}><AuditLog /></Shell>;
}

