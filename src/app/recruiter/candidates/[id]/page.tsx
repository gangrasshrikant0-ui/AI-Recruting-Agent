import Shell from '@/components/Shell';
import CandidateDetail from '@/components/CandidateDetail';
export default function Page({ params }: { params: { id: string } }) {
  return <Shell roles={['recruiter']}><CandidateDetail id={params.id} /></Shell>;
}

