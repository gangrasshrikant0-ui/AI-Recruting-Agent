const path = require('path');
const Database = require('better-sqlite3');
const DB_PATH = process.env.DB_PATH || './recruiting.db';
const db = new Database(path.resolve(DB_PATH));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS orgs (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, email TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, password_hash TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, title TEXT NOT NULL, department TEXT, description TEXT, criteria TEXT, blueprint TEXT, status TEXT DEFAULT 'draft', created_by TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS candidates (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, email TEXT NOT NULL, name TEXT NOT NULL, phone TEXT, resume_text TEXT, profile TEXT, tags TEXT, language TEXT DEFAULT 'en', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, job_id TEXT NOT NULL, candidate_id TEXT NOT NULL, stage TEXT DEFAULT 'Application received', match_score REAL, match_report TEXT, recruiter_notes TEXT, assigned_recruiter TEXT, stage_history TEXT, retention_flag INTEGER DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS interviews (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, application_id TEXT NOT NULL, candidate_id TEXT NOT NULL, job_id TEXT NOT NULL, scheduled_at INTEGER, duration INTEGER DEFAULT 30, status TEXT DEFAULT 'scheduled', transcript TEXT, consent_given INTEGER DEFAULT 0, consent_ts INTEGER, meeting_link TEXT, session_state TEXT, language TEXT DEFAULT 'en', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS evaluations (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, interview_id TEXT NOT NULL, scores TEXT, overall_score REAL, verdict TEXT, recommendation TEXT, recruiter_override TEXT, override_reason TEXT, grounding_log TEXT, fairness_flags TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS approvals (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, type TEXT NOT NULL, entity_id TEXT NOT NULL, requested_by TEXT, approved_by TEXT, status TEXT DEFAULT 'pending', reason TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS agent_traces (id TEXT PRIMARY KEY, org_id TEXT, agent TEXT NOT NULL, model TEXT, prompt_version TEXT, input TEXT, output TEXT, latency_ms INTEGER, ts INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, channel TEXT NOT NULL, recipient TEXT NOT NULL, subject TEXT, body TEXT, status TEXT DEFAULT 'pending', idempotency_key TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, org_id TEXT, user_id TEXT, action TEXT NOT NULL, entity_type TEXT, entity_id TEXT, before_val TEXT, after_val TEXT, ts INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS scheduled_slots (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, interview_id TEXT NOT NULL, start_ts INTEGER NOT NULL, end_ts INTEGER NOT NULL, timezone TEXT, attendance_status TEXT DEFAULT 'pending', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS job_queue (id TEXT PRIMARY KEY, org_id TEXT, type TEXT NOT NULL, payload TEXT, status TEXT DEFAULT 'pending', attempts INTEGER DEFAULT 0, result TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, entity_type TEXT, entity_id TEXT, author_id TEXT, body TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
`);

const now = Date.now();
const ORG = 'org-demo';
function ins(t, r) {
  const k = Object.keys(r);
  try { db.prepare(`INSERT OR IGNORE INTO ${t} (${k.join(',')}) VALUES (${k.map(()=>'?').join(',')})`).run(...Object.values(r)); } catch(e) {}
}

ins('orgs', {id:ORG, name:'Acme Corp', created_at:now, updated_at:now});
[
  {id:'user-admin', name:'Admin User', email:'admin@acme.com', role:'admin'},
  {id:'user-recruiter', name:'Priya Recruiter', email:'recruiter@acme.com', role:'recruiter'},
  {id:'user-interviewer', name:'Raj Interviewer', email:'interviewer@acme.com', role:'interviewer'},
  {id:'user-candidate', name:'Arjun Candidate', email:'candidate@acme.com', role:'candidate'},
].forEach(u => ins('users', {...u, org_id:ORG, password_hash:'demo', created_at:now, updated_at:now}));

const JOBS = [
  {id:'job-1', title:'Customer Support Executive', department:'Support'},
  {id:'job-2', title:'Senior Software Engineer', department:'Engineering'},
  {id:'job-3', title:'Product Manager', department:'Product'},
];
JOBS.forEach(j => ins('jobs', {...j, org_id:ORG, description:`We are hiring a ${j.title} for our ${j.department} team. Requirements: 2-5 years experience, strong communication, problem-solving skills.`,
  criteria:JSON.stringify({title:j.title, department:j.department, experience:'2-5 years', mandatorySkills:['communication','problem-solving','teamwork'], preferredSkills:['leadership'], weights:{technical:0.4,communication:0.3,problemSolving:0.3}, interviewStages:['Screening','Technical','Behavioral','Final']}),
  blueprint:JSON.stringify({categories:['technical','behavioral','situational'], questions:[
    {text:'Tell me about your background and relevant experience.',difficulty:'easy',category:'behavioral',rubric:'Look for clear narrative, specific examples',followUpStrategy:'Ask for specific metrics or outcomes'},
    {text:'Describe a challenging situation you faced at work and how you resolved it.',difficulty:'medium',category:'behavioral',rubric:'STAR format, concrete resolution',followUpStrategy:'Probe for personal contribution vs team'},
    {text:'How do you prioritize tasks when everything is urgent?',difficulty:'medium',category:'situational',rubric:'Systematic approach, tools/frameworks used',followUpStrategy:'Ask for a real example'},
    {text:'Where do you see yourself in 3-5 years?',difficulty:'easy',category:'situational',rubric:'Alignment with role and company',followUpStrategy:'Explore motivation'},
  ]}),
  status:'active', created_by:'user-recruiter', created_at:now, updated_at:now}));

const CANDS = [
  {name:'Arjun Sharma', email:'arjun@example.com', skills:'JavaScript, React, Node.js', exp:'3 years'},
  {name:'Priya Patel', email:'priya.p@example.com', skills:'Python, Django, PostgreSQL', exp:'5 years'},
  {name:'Rahul Gupta', email:'rahul.g@example.com', skills:'Java, Spring Boot, Microservices', exp:'4 years'},
  {name:'Sneha Reddy', email:'sneha.r@example.com', skills:'Customer support, CRM, Zendesk', exp:'2 years'},
  {name:'Vikram Singh', email:'vikram.s@example.com', skills:'Product management, Agile, Jira', exp:'6 years'},
  {name:'Ananya Iyer', email:'ananya.i@example.com', skills:'Data analysis, SQL, Tableau', exp:'3 years'},
  {name:'Karthik Nair', email:'karthik.n@example.com', skills:'DevOps, Kubernetes, CI/CD', exp:'5 years'},
  {name:'Divya Menon', email:'divya.m@example.com', skills:'UX design, Figma, user research', exp:'4 years'},
  {name:'Suresh Kumar', email:'suresh.k@example.com', skills:'Sales, negotiation, CRM', exp:'7 years'},
  {name:'Meera Joshi', email:'meera.j@example.com', skills:'Marketing, SEO, content strategy', exp:'3 years'},
  {name:'Aditya Bansal', email:'aditya.b@example.com', skills:'Machine learning, Python, TensorFlow', exp:'4 years'},
  {name:'Rohini Das', email:'rohini.d@example.com', skills:'HR, recruitment, onboarding', exp:'5 years'},
  {name:'Nikhil Mehta', email:'nikhil.m@example.com', skills:'Finance, accounting, Excel', exp:'3 years'},
  {name:'Pooja Verma', email:'pooja.v@example.com', skills:'Communication, customer service', exp:'2 years'},
  {name:'Sanjay Rao', email:'sanjay.r@example.com', skills:'Leadership, strategy, operations', exp:'10 years'},
];
const STAGES = ['Application received','Resume screening','Interview invitation','Interview scheduled','First round completed','Shortlisted','Offer extended','Evaluation pending'];

CANDS.forEach((c, i) => {
  const cid = `cand-${i+1}`;
  const jobId = i < 5 ? 'job-1' : i < 10 ? 'job-2' : 'job-3';
  const stage = STAGES[i % STAGES.length];
  const appId = `app-${i+1}`;
  ins('candidates', {id:cid, org_id:ORG, email:c.email, name:c.name, phone:`+91 98${String(10000000+i)}`, resume_text:`${c.name}\n${c.email}\n\nSummary: Experienced professional with ${c.exp} in ${c.skills}.\n\nExperience:\n- Senior role at TechCorp (${c.exp})\n- Previously at StartupXYZ (2 years)\n\nSkills: ${c.skills}\n\nEducation:\nB.Tech Computer Science, IIT Delhi, 2018\n\nCertifications: Relevant certifications in field`, profile:JSON.stringify({skills:c.skills.split(',').map(s=>s.trim()), experience:c.exp}), language:'en', created_at:now-86400000*(15-i), updated_at:now});
  ins('applications', {id:appId, org_id:ORG, job_id:jobId, candidate_id:cid, stage, match_score:60+Math.floor(Math.random()*35), match_report:JSON.stringify({matched:c.skills.split(',').slice(0,2).map(s=>s.trim()), missing:['cloud skills'], transferable:[]}), assigned_recruiter:'user-recruiter', stage_history:JSON.stringify([{stage:'Application received',ts:now-86400000*5},{stage,ts:now}]), created_at:now-86400000*(15-i), updated_at:now});

  if (i < 4) {
    const intId = `int-${i+1}`;
    const done = i < 2;
    const tr = JSON.stringify([
      {speaker:'ai',text:`Hello ${c.name}! Welcome to your interview for ${JOBS[jobId==='job-1'?0:jobId==='job-2'?1:2].title}. Tell me about your background and relevant experience.`,ts:now-1800000},
      {speaker:'candidate',text:`Thank you! I have ${c.exp} of experience working with ${c.skills}. At TechCorp, I led a key migration project that improved performance by 40% and was delivered 2 weeks ahead of schedule. I coordinated with cross-functional teams across 3 time zones.`,ts:now-1780000,confidence:0.94},
      {speaker:'ai',text:'That sounds impressive. Can you describe a specific challenge you faced during that project and how you overcame it?',ts:now-1760000},
      {speaker:'candidate',text:'During a critical production incident mid-migration, I quickly assembled a war room with engineers and stakeholders. I broke down the problem systematically, identified the root cause within 30 minutes, and we resolved it in 2 hours, preventing an estimated 5 lakh rupees in revenue loss.',ts:now-1740000,confidence:0.96},
      {speaker:'ai',text:'Excellent. How do you prioritize tasks when you have multiple urgent deadlines?',ts:now-1720000},
      {speaker:'candidate',text:'I use a mix of urgency-importance matrix and stakeholder impact analysis. I first assess business impact, then communicate transparently with all parties about trade-offs. I believe in setting clear expectations rather than overpromising.',ts:now-1700000,confidence:0.91},
    ]);
    ins('interviews', {id:intId, org_id:ORG, application_id:appId, candidate_id:cid, job_id:jobId, scheduled_at:now-86400000*2, duration:30, status:done?'completed':'scheduled', transcript:done?tr:null, consent_given:1, consent_ts:now-86400000*3, language:'en', session_state:JSON.stringify({currentQuestion:done?4:0, completed:done, answers:[]}), meeting_link:`https://meet.acme.demo/${intId}`, created_at:now-86400000*3, updated_at:now-86400000*2});
    if (done) {
      const scores = JSON.stringify({technical:{score:4,evidence:'Led migration project with 40% performance improvement',strength:'strong',demonstrated:true}, communication:{score:4.5,evidence:'Clear structured responses, proactive stakeholder communication',strength:'strong',demonstrated:true}, problemSolving:{score:4.2,evidence:'Resolved production incident in 2 hours systematically',strength:'strong',demonstrated:true}, behavioral:{score:3.8,evidence:'Cross-functional coordination mentioned with specific outcomes',strength:'moderate',demonstrated:true}});
      ins('evaluations', {id:`eval-${i+1}`, org_id:ORG, interview_id:intId, scores, overall_score:4.1, verdict:'recommend', recommendation:`${c.name} demonstrates strong technical leadership and excellent communication. The production incident example shows both problem-solving ability and calm under pressure. Strongly recommend for the next round.`, grounding_log:JSON.stringify([{claim:'40% performance improvement',found:true},{claim:'2 hours resolution',found:true},{claim:'5 lakh rupees',found:true}]), fairness_flags:JSON.stringify([]), created_at:now-86400000, updated_at:now-86400000});
    }
  }
});

for (let i=0;i<6;i++) {
  ins('outbox', {id:`outbox-${i}`, org_id:ORG, channel:i%2===0?'email':'sms', recipient:CANDS[i%CANDS.length].email, subject:'Interview Invitation — Acme Corp', body:`Dear ${CANDS[i%CANDS.length].name},\n\nCongratulations! You have been shortlisted for the position at Acme Corp. Please confirm your availability for an AI-assisted first-round interview.\n\nThe interview is conducted by our AI system and takes approximately 20-30 minutes. A human recruiter will review all responses.\n\nBest regards,\nAcme Corp Hiring Team`, status:i<4?'sent':'pending', created_at:now-3600000*(6-i), updated_at:now});
}
ins('approvals',{id:'appr-1',org_id:ORG,type:'shortlist',entity_id:'app-3',requested_by:'user-recruiter',status:'pending',created_at:now-3600000,updated_at:now-3600000});
ins('approvals',{id:'appr-2',org_id:ORG,type:'shortlist',entity_id:'app-4',requested_by:'user-recruiter',status:'approved',approved_by:'user-admin',created_at:now-7200000,updated_at:now-3600000});
ins('approvals',{id:'appr-3',org_id:ORG,type:'evaluation_override',entity_id:'eval-1',requested_by:'user-interviewer',status:'pending',created_at:now-1800000,updated_at:now-1800000});

console.log('✅ DB initialized + seeded: 1 org, 4 users, 3 jobs, 15 candidates, 4 interviews (2 completed with evals)');
db.close();

