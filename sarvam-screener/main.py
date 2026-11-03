import os
from sarvamai import SarvamAI

api_key = os.environ.get("SARVAM_API_KEY")
if not api_key:
    # Try reading from .env if present
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("SARVAM_API_KEY="):
                    api_key = line.strip().split("=", 1)[1].strip()
                    break

if not api_key:
    raise RuntimeError("SARVAM_API_KEY environment variable not set")

client = SarvamAI(api_key=api_key)

response = client.chat.completions.create(
    model="sarvam-105b-conversations",
    messages=[
        {"role": "user", "content": "Hello! Give a 1-sentence greeting."}
    ],
)

print(response.choices[0].message.content)
