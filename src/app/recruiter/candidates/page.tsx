import Shell from '@/components/Shell';
import CandidatesList from '@/components/CandidatesList';
export default function Page() {
  return <Shell roles={['recruiter']}><CandidatesList /></Shell>;
}

