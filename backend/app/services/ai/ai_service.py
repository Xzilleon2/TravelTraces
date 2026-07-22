from app.services.ai.groq_client import client
from app.core.config import settings


def ask_groq(prompt: str) -> str:

    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {
                "role": "system",
                "content": "You are a helpful travel assistant."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
        max_completion_tokens=1024,
    )

    return response.choices[0].message.content