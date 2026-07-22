from groq import Groq

from app.core.config import settings

client = Groq(
    api_key=settings.groq_api_key
)