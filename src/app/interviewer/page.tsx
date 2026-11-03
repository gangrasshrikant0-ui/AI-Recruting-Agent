import Shell from '@/components/Shell';
import InterviewsList from '@/components/InterviewsList';
export default function Page() {
  return <Shell roles={['interviewer']}><InterviewsList role="interviewer" /></Shell>;
}
