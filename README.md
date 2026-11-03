# AI Recruiting Agent 🤖🎯

Autonomous voice-first multi-agent recruitment platform built with Next.js 14, TypeScript, Tailwind CSS, SQLite, and Gemini LLM.

Also includes an Indian-language **Sarvam AI Voice Interview Screener** (`/sarvam-screener`) powered by Sarvam STT and LLM models.

## Features
- **Job Analysis (M1)**: Extract structured criteria & generate interview blueprints from JDs.
- **Sourcing & Screening (M2)**: Candidate parsing, semantic matching, and pool deduplication.
- **Engagement (M3)**: Multilingual invites, automated outbox notifications, and candidate consent.
- **Voice Interview Room (M4+M5)**: Browser Web Speech API (continuous STT + TTS), dynamic interview engine, reload-safe session state.
- **AI Evaluation (M6)**: Rubric-based scoring across competencies with grounded transcript evidence.
- **Reporting & Analytics (M7+M10)**: Real-time pipeline kanban, verdict distributions, and audit trails.
- **Role-based Authentication**: Fast role switcher for Admin, Recruiter, Interviewer, and Candidate.
- **Sarvam AI Indian-Language Voice Screener (`/sarvam-screener`)**: Hindi, Marathi, and English voice screening with `saaras:v2` and `sarvam-105b-conversations`.

## Getting Started

### AI Recruiting Agent (Next.js Platform)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here # Optional: deterministic mocks used if empty
   DB_PATH=./recruiting.db
   SESSION_SECRET=recruiting-secret-key-32chars-min
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Sarvam AI Voice Screener (Streamlit App)

1. **Install Python Dependencies**
   ```bash
   cd sarvam-screener
   pip install -r requirements.txt
   ```

2. **Run Streamlit**
   ```bash
   export SARVAM_API_KEY=your_sarvam_key
   streamlit run app.py
   ```
   Open [http://localhost:8501](http://localhost:8501) in your browser.
