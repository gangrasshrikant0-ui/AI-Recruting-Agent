# Sarvam AI Voice Interview Screener

Indian-language first-round voice interview screener built with Sarvam AI and Streamlit.

## Features
- **Multilingual Support**: Hindi, Marathi, and English first-round interviews.
- **Audio Capture**: Browser mic recording with `st.audio_input`.
- **Speech-to-Text**: Transcribes candidate voice responses with Sarvam `saaras:v2`.
- **Intelligent Follow-ups**: Evaluates vagueness and prompts follow-up questions using `sarvam-105b-conversations`.
- **Competency Scorecard**: Structured scoring across Communication, Problem-solving, and Empathy with transcript evidence.

## Quickstart

```bash
pip install -r requirements.txt
export SARVAM_API_KEY="your_api_key_here"
streamlit run app.py
```
