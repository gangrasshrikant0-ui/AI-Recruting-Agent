import Shell from '@/components/Shell';
import SarvamScreener from '@/components/SarvamScreener';

export default function Page() {
  return (
    <Shell roles={['recruiter', 'admin']}>
      <SarvamScreener />
    </Shell>
  );
}

