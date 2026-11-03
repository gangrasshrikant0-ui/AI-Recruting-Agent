# AI Recruiting Agent 🤖🎯

Autonomous voice-first multi-agent recruitment platform built with Next.js 14, TypeScript, Tailwind CSS, SQLite, and Gemini LLM.

## Features
- **Job Analysis (M1)**: Extract structured criteria & generate interview blueprints from JDs.
- **Sourcing & Screening (M2)**: Candidate parsing, semantic matching, and pool deduplication.
- **Engagement (M3)**: Multilingual invites, automated outbox notifications, and candidate consent.
- **Voice Interview Room (M4+M5)**: Browser Web Speech API (continuous STT + TTS), dynamic interview engine, reload-safe session state.
- **AI Evaluation (M6)**: Rubric-based scoring across competencies with grounded transcript evidence.
- **Reporting & Analytics (M7+M10)**: Real-time pipeline kanban, verdict distributions, and audit trails.
- **Role-based Authentication**: Fast role switcher for Admin, Recruiter, Interviewer, and Candidate.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here # Optional: deterministic mocks used if empty
DB_PATH=./recruiting.db
SESSION_SECRET=recruiting-secret-key-32chars-min
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
