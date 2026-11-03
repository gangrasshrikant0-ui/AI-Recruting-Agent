import InterviewRoom from '@/components/InterviewRoom';
export default function Page({ params }: { params: { id: string } }) {
  return <InterviewRoom id={params.id} />;
}
