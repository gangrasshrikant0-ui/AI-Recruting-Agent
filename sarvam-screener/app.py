"""
Voice Interview Screener — Sarvam AI
Role: Customer Support Executive
Languages: Hindi, Marathi, English
"""

import io
import json
import os

import streamlit as st
from sarvamai import SarvamAI

# ── env / client ────────────────────────────────────────────────────────────
def _load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

_load_env()
API_KEY = os.environ.get("SARVAM_API_KEY", "")
if not API_KEY:
    st.error("SARVAM_API_KEY not found. Add it to your .env file.")
    st.stop()

@st.cache_resource
def get_client():
    return SarvamAI(api_subscription_key=sk_gz9u4k8z_kpYXK5ha1Se5CV8VcdEPihgy)

client = get_client()

# ── constants ────────────────────────────────────────────────────────────────
ROLE = "Customer Support Executive"

LANG_MAP = {
    "English": "en-IN",
    "Hindi": "hi-IN",
    "Marathi": "mr-IN",
}

QUESTIONS = {
    "English": [
        "Tell me about a time you handled a very angry or upset customer. What did you do?",
        "A customer calls saying their order hasn't arrived after 10 days. Walk me through what you would do.",
        "How do you stay calm and focused when you have many difficult calls in a row?",
    ],
    "Hindi": [
        "क्या आप एक ऐसे अनुभव के बारे में बता सकते हैं जब आपने किसी बहुत गुस्से में आए ग्राहक को संभाला हो?",
        "एक ग्राहक कॉल करता है कि उसका ऑर्डर 10 दिन बाद भी नहीं आया। आप क्या करेंगे?",
        "जब एक के बाद एक मुश्किल कॉल आती हैं, तो आप शांत और केंद्रित कैसे रहते हैं?",
    ],
    "Marathi": [
        "तुम्ही एखाद्या खूप रागावलेल्या ग्राहकाला कसे हाताळले, हे सांगाल का?",
        "एक ग्राहक फोन करतो की त्याची ऑर्डर १० दिवसांनंतरही आली नाही. तुम्ही काय कराल?",
        "सलग अनेक अवघड कॉल्स आल्यावर तुम्ही शांत आणि लक्ष केंद्रित कसे राहता?",
    ],
}

FOLLOWUP_PROMPT = """You are an interview coach assistant. The candidate just answered a Customer Support Executive interview question.

Question: {question}
Answer: {answer}

If the answer is vague, too short (under 30 words), or doesn't include a specific example or concrete action, generate ONE sharp follow-up question in {language} to elicit more detail.
If the answer is already detailed and specific, respond with exactly: NO_FOLLOWUP

Respond with only the follow-up question or NO_FOLLOWUP. Nothing else."""

EVAL_PROMPT = """You are an expert hiring manager for a Customer Support Executive role.

Evaluate this candidate strictly based on the interview transcript below.

Return a JSON object with this exact structure:
{{
  "scores": {{
    "communication": {{"score": <1-5>, "quote": "<exact quote from transcript>", "rationale": "<1 sentence>"}},
    "problem_solving": {{"score": <1-5>, "quote": "<exact quote from transcript>", "rationale": "<1 sentence>"}},
    "empathy": {{"score": <1-5>, "quote": "<exact quote from transcript>", "rationale": "<1 sentence>"}}
  }},
  "overall_score": <average of three scores, one decimal>,
  "verdict": "<recommend|maybe|no>",
  "verdict_reason": "<2 sentences max explaining the verdict>",
  "disclaimer": "Human recruiter review required before any hiring decision."
}}

Scoring guide:
- 5: Exceptional, specific example, empathetic, structured response
- 4: Good, mostly specific
- 3: Adequate, somewhat vague
- 2: Below average, very generic
- 1: Poor, irrelevant or no real answer

Verdict guide:
- recommend: overall_score >= 4.0
- maybe: overall_score 2.5–3.9
- no: overall_score < 2.5

Transcript (language: {language}):
{transcript}

Return ONLY the JSON. No markdown, no explanation."""

# ── helpers ──────────────────────────────────────────────────────────────────
def transcribe_audio(audio_bytes: bytes, lang_code: str) -> str:
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "recording.wav"
    resp = client.speech_to_text.transcribe(
        file=audio_file,
        model="saaras:v2",
        language_code=lang_code,
    )
    return resp.transcript.strip()

def get_followup(question: str, answer: str, language: str) -> str | None:
    prompt = FOLLOWUP_PROMPT.format(question=question, answer=answer, language=language)
    resp = client.chat.completions(
        model="sarvam-105b-conversations",
        messages=[{"role": "user", "content": prompt}],
    )
    result = resp.choices[0].message.content.strip()
    return None if result == "NO_FOLLOWUP" else result

def evaluate(transcript_lines: list[dict], language: str) -> dict:
    formatted = "\n\n".join(
        f"Q: {t['question']}\nA: {t['answer']}"
        + (f"\nFollow-up: {t['followup']}\nFollow-up Answer: {t['followup_answer']}" if t.get("followup") else "")
        for t in transcript_lines
    )
    prompt = EVAL_PROMPT.format(language=language, transcript=formatted)
    resp = client.chat.completions(
        model="sarvam-105b-conversations",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800,
    )
    raw = resp.choices[0].message.content.strip()
    # strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())

def score_color(score: int) -> str:
    if score >= 4:
        return "🟢"
    if score >= 3:
        return "🟡"
    return "🔴"

def verdict_badge(verdict: str) -> str:
    return {"recommend": "✅ RECOMMEND", "maybe": "🤔 MAYBE", "no": "❌ NO"}.get(verdict.lower(), verdict.upper())

# ── session state init ────────────────────────────────────────────────────────
def init_state():
    defaults = {
        "stage": "setup",          # setup | interview | followup | done
        "language": "English",
        "q_index": 0,
        "transcript": [],          # list of dicts per question
        "current_answer": "",
        "current_followup": None,
        "evaluation": None,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

init_state()

# ── UI ────────────────────────────────────────────────────────────────────────
st.set_page_config(page_title="Voice Interview Screener", page_icon="🎙️", layout="centered")

st.title("🎙️ Voice Interview Screener")
st.caption(f"Role: **{ROLE}** · Powered by Sarvam AI")
st.divider()

# ── STAGE: setup ─────────────────────────────────────────────────────────────
if st.session_state.stage == "setup":
    st.subheader("Welcome, Candidate 👋")
    st.write(
        "You will be asked **3 interview questions** for the role of "
        f"**{ROLE}**. Record your answer after each question. "
        "The interview takes about 5–7 minutes."
    )
    st.write("---")
    lang = st.selectbox("Select your preferred language:", list(LANG_MAP.keys()))
    st.session_state.language = lang

    if st.button("Start Interview →", type="primary", use_container_width=True):
        st.session_state.stage = "interview"
        st.rerun()

# ── STAGE: interview ──────────────────────────────────────────────────────────
elif st.session_state.stage == "interview":
    lang = st.session_state.language
    lang_code = LANG_MAP[lang]
    questions = QUESTIONS[lang]
    qi = st.session_state.q_index

    # progress
    st.progress((qi) / len(questions), text=f"Question {qi + 1} of {len(questions)}")

    st.subheader(f"Question {qi + 1}")
    st.info(questions[qi])

    st.write("**Record your answer below:**")
    audio = st.audio_input("🎤 Click to record", key=f"audio_q{qi}")

    if audio:
        with st.spinner("Transcribing your answer…"):
            try:
                transcript = transcribe_audio(audio.getvalue(), lang_code)
            except Exception as e:
                st.error(f"Transcription failed: {e}")
                st.stop()

        st.success("Transcribed:")
        st.write(f"_{transcript}_")
        st.session_state.current_answer = transcript

        if st.button("Submit Answer →", type="primary", key=f"submit_q{qi}"):
            with st.spinner("Checking if a follow-up is needed…"):
                try:
                    followup = get_followup(questions[qi], transcript, lang)
                except Exception:
                    followup = None

            st.session_state.current_followup = followup
            if followup:
                st.session_state.stage = "followup"
            else:
                st.session_state.transcript.append({
                    "question": questions[qi],
                    "answer": transcript,
                    "followup": None,
                    "followup_answer": None,
                })
                st.session_state.q_index += 1
                if st.session_state.q_index >= len(questions):
                    st.session_state.stage = "done"
                else:
                    st.session_state.current_answer = ""
            st.rerun()

# ── STAGE: followup ───────────────────────────────────────────────────────────
elif st.session_state.stage == "followup":
    lang = st.session_state.language
    lang_code = LANG_MAP[lang]
    qi = st.session_state.q_index

    st.progress((qi) / 3, text=f"Question {qi + 1} of 3 — Follow-up")
    st.subheader("Follow-up Question")
    st.warning(st.session_state.current_followup)

    st.write("**Record your follow-up answer:**")
    audio = st.audio_input("🎤 Click to record", key=f"audio_fu{qi}")

    if audio:
        with st.spinner("Transcribing…"):
            try:
                fu_transcript = transcribe_audio(audio.getvalue(), lang_code)
            except Exception as e:
                st.error(f"Transcription failed: {e}")
                st.stop()

        st.success("Transcribed:")
        st.write(f"_{fu_transcript}_")

        if st.button("Submit Follow-up →", type="primary", key=f"submit_fu{qi}"):
            st.session_state.transcript.append({
                "question": QUESTIONS[lang][qi],
                "answer": st.session_state.current_answer,
                "followup": st.session_state.current_followup,
                "followup_answer": fu_transcript,
            })
            st.session_state.q_index += 1
            st.session_state.current_followup = None
            st.session_state.current_answer = ""

            if st.session_state.q_index >= 3:
                st.session_state.stage = "done"
            else:
                st.session_state.stage = "interview"
            st.rerun()

# ── STAGE: done / scorecard ───────────────────────────────────────────────────
elif st.session_state.stage == "done":
    st.subheader("⏳ Generating your scorecard…")

    if st.session_state.evaluation is None:
        with st.spinner("Evaluating interview… (takes ~10 seconds)"):
            try:
                result = evaluate(st.session_state.transcript, st.session_state.language)
                st.session_state.evaluation = result
            except Exception as e:
                st.error(f"Evaluation failed: {e}")
                st.stop()
        st.rerun()

    result = st.session_state.evaluation
    scores = result["scores"]
    verdict = result["verdict"]

    # ── Verdict banner ────────────────────────────────────────────────────────
    st.divider()
    col_v, col_s = st.columns([2, 1])
    with col_v:
        st.markdown(f"## {verdict_badge(verdict)}")
        st.caption(result.get("verdict_reason", ""))
    with col_s:
        st.metric("Overall Score", f"{result.get('overall_score', '—')} / 5")

    st.warning("⚠️ " + result.get("disclaimer", "Human recruiter review required."))
    st.divider()

    # ── Competency scorecard ──────────────────────────────────────────────────
    st.subheader("📊 Competency Scorecard")
    competencies = [
        ("communication", "💬 Communication"),
        ("problem_solving", "🧠 Problem Solving"),
        ("empathy", "❤️ Empathy"),
    ]

    for key, label in competencies:
        s = scores.get(key, {})
        score_val = s.get("score", 0)
        with st.expander(f"{score_color(score_val)} {label} — {score_val}/5", expanded=True):
            st.write(s.get("rationale", ""))
            st.markdown(f"> *\"{s.get('quote', '')}\"*")

    # ── Full transcript ───────────────────────────────────────────────────────
    st.divider()
    st.subheader("📝 Full Interview Transcript")
    for i, t in enumerate(st.session_state.transcript, 1):
        with st.expander(f"Q{i}: {t['question'][:60]}…"):
            st.markdown(f"**Q:** {t['question']}")
            st.markdown(f"**A:** {t['answer']}")
            if t.get("followup"):
                st.markdown(f"**Follow-up:** {t['followup']}")
                st.markdown(f"**Follow-up A:** {t['followup_answer']}")

    st.divider()
    if st.button("🔄 Start New Interview", use_container_width=True):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()

