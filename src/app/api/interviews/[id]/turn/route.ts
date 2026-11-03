import { NextRequest, NextResponse } from 'next/server';

function getDB() {
  const Database = require('better-sqlite3');
  const path = require('path');
  return new Database(path.resolve(process.env.DB_PATH || './recruiting.db'));
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDB();
  try {
    const { answer } = await req.json();
    const interview = db.prepare('SELECT * FROM interviews WHERE id=?').get(params.id) as any;
    if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const transcript: any[] = interview.transcript ? JSON.parse(interview.transcript) : [];
    const blueprint = interview.blueprint ? JSON.parse(interview.blueprint) : { questions: [] };
    const questions = blueprint.questions || [];

    if (answer) {
      transcript.push({ role: 'candidate', text: answer, ts: Date.now() });
    }

    const answeredCount = transcript.filter((t: any) => t.role === 'candidate').length;
    const completed = answeredCount >= questions.length;

    let nextQuestion: string | null = null;
    if (!completed && questions[answeredCount]) {
      nextQuestion = questions[answeredCount].text || questions[answeredCount];
      transcript.push({ role: 'ai', text: nextQuestion, ts: Date.now() });
    }

    db.prepare('UPDATE interviews SET transcript=?,completed=?,updated_at=? WHERE id=?')
      .run(JSON.stringify(transcript), completed ? 1 : 0, Date.now(), params.id);

    if (completed) {
      db.prepare("UPDATE applications SET stage='First round completed',updated_at=? WHERE candidate_id=? AND job_id=?")
        .run(Date.now(), interview.candidate_id, interview.job_id);
    }

    return NextResponse.json({ action: nextQuestion ? 'ask' : 'done', question: nextQuestion, completed });
  } finally { db.close(); }
}

