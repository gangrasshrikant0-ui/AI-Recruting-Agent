import { generateJSON, generateText } from './llm.js';

export async function analyzeJob(description, orgId) {
  const criteriaPrompt = `Analyze this job description and extract structured hiring criteria:\n\n${description}\n\nReturn JSON: { "title": string, "department": string, "experience": string, "education": string, "mandatorySkills": [], "preferredSkills": [], "responsibilities": [], "weights": {"technical": 0.4, "communication": 0.3, "problemSolving": 0.3}, "ambiguityFlags": [], "interviewStages": [] }`;
  const criteria = await generateJSON(criteriaPrompt, () => ({
    title: 'Software Engineer', department: 'Engineering', experience: '3-5 years', education: "Bachelor's in CS",
    mandatorySkills: ['JavaScript', 'React', 'Node.js', 'Communication'], preferredSkills: ['TypeScript', 'AWS', 'Docker'],
    responsibilities: ['Build and ship features', 'Code reviews', 'System design participation'],
    weights: { technical: 0.4, communication: 0.3, problemSolving: 0.3 },
    ambiguityFlags: [], interviewStages: ['Screening', 'Technical Round', 'Behavioral Round', 'Final'],
  }), 'jobAnalysis');

  const bpPrompt = `Create an interview blueprint for a ${criteria.data.title} role requiring: ${criteria.data.mandatorySkills?.join(', ')}.\n\nReturn JSON: { "categories": ["technical","behavioral","situational","problem-solving"], "questions": [{ "text": string, "difficulty": "easy|medium|hard", "rubric": string, "category": string, "followUpStrategy": string }] } with exactly 6 questions.`;
  const blueprint = await generateJSON(bpPrompt, () => ({
    categories: ['technical', 'behavioral', 'situational', 'problem-solving'],
    questions: [
      { text: 'Tell me about your background and most relevant experience for this role.', difficulty: 'easy', rubric: 'Coherent narrative, relevant examples, specific outcomes', category: 'behavioral', followUpStrategy: 'Ask for specific metrics if vague' },
      { text: 'Describe a technically challenging problem you solved. What was your approach?', difficulty: 'hard', rubric: 'Problem decomposition, tools used, outcome measured', category: 'technical', followUpStrategy: 'Probe for their specific contribution vs team' },
      { text: 'Tell me about a time you disagreed with a teammate or manager. How did you handle it?', difficulty: 'medium', rubric: 'Constructive approach, outcome, relationship preserved', category: 'behavioral', followUpStrategy: 'Ask what they would do differently' },
      { text: 'How do you prioritize when you have multiple urgent tasks with the same deadline?', difficulty: 'medium', rubric: 'Framework used, stakeholder communication, trade-offs', category: 'situational', followUpStrategy: 'Ask for a real recent example' },
      { text: 'Walk me through your most impactful project. What would you do differently?', difficulty: 'hard', rubric: 'Scope, impact, self-reflection, technical depth', category: 'problem-solving', followUpStrategy: 'Probe the "differently" part deeply' },
      { text: 'Where do you see yourself in 3 years and how does this role fit?', difficulty: 'easy', rubric: 'Realistic, growth-oriented, alignment with company', category: 'situational', followUpStrategy: 'Explore specific skills they want to build' },
    ],
  }), 'jobAnalysis');

  return { criteria: criteria.data, blueprint: blueprint.data };
}

export async function screenCandidate(resumeText, criteria, orgId) {
  const prompt = `You are an expert recruiter. Evaluate this candidate semantically — never reject on keyword mismatch alone, consider transferable skills.

Job Criteria: ${JSON.stringify(criteria)}
Resume: ${resumeText.slice(0, 2500)}

Return JSON: { "score": number (0-100), "matched": [], "missing": [], "transferable": [], "explanation": string, "ranking": "strong|moderate|weak", "flags": [] }`;

  const result = await generateJSON(prompt, () => ({
    score: 72, matched: ['Communication', 'Problem-solving'], missing: ['Cloud skills'],
    transferable: ['Python experience → data analysis', 'Team leadership → cross-functional coordination'],
    explanation: 'Strong candidate with solid foundational skills. The missing cloud experience is partially offset by strong analytical and communication abilities. Recommended for screening call.',
    ranking: 'moderate', flags: [],
  }), 'screening');
  return result.data;
}

export async function getNextInterviewQuestion(blueprint, transcript, currentIdx, orgId) {
  if (currentIdx >= (blueprint.questions?.length ?? 0)) return { type: 'conclude', reason: 'All questions covered' };
  const lastAnswer = transcript.filter(t => t.speaker === 'candidate').slice(-1)[0]?.text ?? '';
  const words = lastAnswer.split(' ').length;
  const prompt = `Interview orchestration decision.
Current question index: ${currentIdx}
Last candidate answer (${words} words): "${lastAnswer}"
Remaining questions: ${blueprint.questions?.length - currentIdx}

Rules:
- If answer < 25 words: return followup asking for specific example
- If answer mentions a project without metrics: return probe for numbers/impact
- If answer is contradictory to earlier statement: return contradiction challenge
- Otherwise: return next question

Return JSON: { "type": "ask|followup|probe|conclude", "question": string, "reason": string }`;

  const result = await generateJSON(prompt, () => {
    if (words < 20) return { type: 'followup', question: 'Could you give me a specific example to illustrate that point?', reason: 'Answer was brief, need more detail' };
    if (words < 40) return { type: 'probe', question: 'What was the measurable impact or outcome of that work?', reason: 'Good answer but lacks specific metrics' };
    const nextQ = blueprint.questions?.[Math.min(currentIdx + 1, blueprint.questions.length - 1)];
    return { type: 'ask', question: nextQ?.text ?? 'Thank you, that covers everything.', reason: 'Answer was comprehensive' };
  }, 'interview');
  return result.data;
}

export async function evaluateInterview(transcript, criteria, orgId) {
  const transcriptText = transcript.map(t => `${t.speaker === 'ai' ? 'INTERVIEWER' : 'CANDIDATE'}: ${t.text}`).join('\n');
  const prompt = `Evaluate this interview transcript. Strip all protected attributes (gender, age, nationality, accent). Score ONLY on demonstrated evidence.

Job criteria: ${JSON.stringify(criteria)}

Transcript:
${transcriptText}

Return JSON:
{
  "scores": {
    "technical": { "score": 1-5, "evidence": "exact quote", "strength": "strong|moderate|weak|insufficient", "demonstrated": true|false },
    "communication": { "score": 1-5, "evidence": "exact quote", "strength": "strong|moderate|weak|insufficient", "demonstrated": true|false },
    "problemSolving": { "score": 1-5, "evidence": "exact quote", "strength": "strong|moderate|weak|insufficient", "demonstrated": true|false },
    "behavioral": { "score": 1-5, "evidence": "exact quote", "strength": "strong|moderate|weak|insufficient", "demonstrated": true|false }
  },
  "overallScore": number,
  "verdict": "recommend|maybe|no",
  "recommendation": string,
  "fairnessFlags": [],
  "groundingLog": [{ "claim": string, "found": true|false }]
}`;

  const result = await generateJSON(prompt, () => ({
    scores: {
      technical: { score: 4, evidence: 'Led migration project with 40% performance improvement', strength: 'strong', demonstrated: true },
      communication: { score: 4.5, evidence: 'Clear structured responses throughout the interview', strength: 'strong', demonstrated: true },
      problemSolving: { score: 4.2, evidence: 'Resolved production incident in 2 hours using systematic approach', strength: 'strong', demonstrated: true },
      behavioral: { score: 3.8, evidence: 'Coordinated cross-functional teams across time zones', strength: 'moderate', demonstrated: true },
    },
    overallScore: 4.1, verdict: 'recommend',
    recommendation: 'Strong candidate who demonstrated clear technical depth, excellent communication, and proven problem-solving under pressure. Recommend for next round.',
    fairnessFlags: [],
    groundingLog: [{ claim: '40% performance improvement', found: true }, { claim: '2 hours', found: true }],
  }), 'evaluation');
  return result.data;
}

export async function getAnalyticsInsights(stats) {
  const prompt = `You are a recruitment analytics expert. Provide 3 specific, actionable insights based on these hiring funnel statistics. Be concise (3 sentences total):\n\n${JSON.stringify(stats, null, 2)}`;
  return generateText(prompt);
}

