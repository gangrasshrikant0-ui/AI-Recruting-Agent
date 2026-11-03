export type Role = "admin" | "recruiter" | "interviewer" | "candidate";
export const users = [
  { id: "u1", name: "Aarav Mehta", role: "admin", email: "admin@demo.ai" },
  { id: "u2", name: "Priya Shah", role: "recruiter", email: "recruiter@demo.ai" },
  { id: "u3", name: "Daniel Chen", role: "interviewer", email: "interviewer@demo.ai" },
  { id: "u4", name: "Maya Iyer", role: "candidate", email: "candidate@demo.ai" }
];
export const jobs = [
  { id: "j1", title: "Senior Full-Stack Engineer", department: "Product Engineering", candidates: 15, stage: "Hiring", match: 84 },
  { id: "j2", title: "ML Platform Engineer", department: "Applied AI", candidates: 8, stage: "Sourcing", match: 78 },
  { id: "j3", title: "Product Designer", department: "Design", candidates: 11, stage: "Interviewing", match: 81 }
];
export const stages = ["Application received","Resume screening","Eligibility review","Interview invitation","Interview scheduled","First round completed","Evaluation pending","Shortlisted","Technical interview","Managerial interview","Final decision","Offer extended","Offer accepted","Hired","Rejected","Withdrawn"];
const candidateNames = ["Maya Iyer","Rohan Patel","Sara Khan","Jon Bell","Nina Kapoor","Luis Garcia","Anika Rao","Owen Smith","Zoya Ali","Karan Singh","Mei Lin","Ishaan Das","Eva Brown","Sam Wilson","Tara Bose","Arjun Nair","Leah Wong","Noah Brooks","Ira Menon","Fatima Noor","Ethan Cole","Pooja Shah","Leo Martin","Riya Sen","Adam Stone"];
export const candidates = Array.from({length:25}, (_,i) => ({ id:`c${i+1}`, name:candidateNames[i], email:`candidate${i+1}@demo.ai`, job:["Senior Full-Stack Engineer","ML Platform Engineer","Product Designer"][i%3], stage:stages[i%stages.length], score:92-i*2, skills:["React","TypeScript",i%2?"Python":"Node.js","SQL"], availability:i%3===0?"Today":"This week", status:i%5===0?"Needs review":"Active" }));
export const blueprint = [
  { category:"Technical", question:"Walk me through a production system you designed end to end.", difficulty:"Hard", rubric:"Architecture trade-offs, scale, observability" },
  { category:"Practical", question:"How would you debug a slow API endpoint in production?", difficulty:"Medium", rubric:"Reproduction, profiling, safe rollout" },
  { category:"Behavioral", question:"Tell me about a time you changed your mind after feedback.", difficulty:"Medium", rubric:"Reflection, ownership, collaboration" },
  { category:"Situational", question:"A release is blocked by a dependency. What do you do?", difficulty:"Easy", rubric:"Communication, prioritization, mitigation" }
];
export const criteria = { title:"Senior Full-Stack Engineer", experience:"5+ years", education:"Computer Science or equivalent experience", mandatory:["TypeScript","React","Node.js","SQL"], preferred:["AWS","GraphQL","Testing"], weights:{technical:35, practical:25, communication:15, behavioral:15, experience:10} };
export const traces = [{agent:"jobAnalysis", model:"mock-gemini", input:"Senior full-stack job description", output:"Criteria and blueprint generated", ts:"Today 09:14"}, {agent:"sourcing", model:"mock-gemini", input:"15 resumes", output:"Ranked candidate pool", ts:"Today 09:18"}, {agent:"evaluation", model:"mock-gemini", input:"Maya interview transcript", output:"Grounded rubric scores", ts:"Today 10:02"}];
export const outbox = [{channel:"Email", recipient:"maya.iyer@demo.ai", subject:"Your interview invitation", status:"Delivered", time:"Today 09:20"}, {channel:"SMS", recipient:"+91 98765 43210", subject:"Interview reminder", status:"Queued", time:"Today 09:22"}];
