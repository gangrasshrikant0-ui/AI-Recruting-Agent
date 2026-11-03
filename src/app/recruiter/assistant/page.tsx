import Shell from '@/components/Shell';
import AssistantChat from '@/components/AssistantChat';
export default function Page() {
  return <Shell roles={['recruiter']}><AssistantChat role="recruiter" /></Shell>;
}
