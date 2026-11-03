import Shell from '@/components/Shell';
import EvaluationsList from '@/components/EvaluationsList';
export default function Page() {
  return <Shell roles={['recruiter']}><EvaluationsList /></Shell>;
}

