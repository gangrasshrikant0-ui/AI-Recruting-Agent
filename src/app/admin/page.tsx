import Shell from '@/components/Shell';
import Dashboard from '@/components/Dashboard';
export default function Page() {
  return <Shell roles={['admin']}><Dashboard role="admin" /></Shell>;
}
