import Shell from '@/components/Shell';
import InterviewsList from '@/components/InterviewsList';
export default function Page() {
  return <Shell roles={['candidate']}><InterviewsList role="candidate" /></Shell>;
}
