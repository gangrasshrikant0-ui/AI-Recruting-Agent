import { Shell } from '@/components/Shell'; import { JobView } from '@/components/JobView';
export default function P({params}:{params:{id:string}}){return<Shell roles={['recruiter','admin','interviewer']}><JobView id={params.id}/></Shell>}

