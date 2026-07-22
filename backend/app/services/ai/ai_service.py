from __future__ import annotations

from collections.abc import Sequence

from app.core.config import settings
from app.services.ai.groq_client import client


def _build_system_prompt(display_name: str | None, location: str | None, interests: Sequence[str] | None) -> str:
    prompt_parts = [
        "You are Trace, the official AI travel companion for TravelTraces.",
        "Your personality is friendly, knowledgeable, curious, and encouraging. Speak like an experienced local guide.",
        "Respond in plain text only. Do not use Markdown formatting.",
        "Do not use special formatting characters such as *, **, #, ##, ###, -, _, `, >, |, [], {}, (), or bullet points.",
        "Use only normal punctuation such as periods (.), commas (,), question marks (?), exclamation marks (!), colons (:), semicolons (;), apostrophes ('), quotation marks (\") and parentheses when necessary.",
        "Write naturally in complete sentences and short paragraphs.",
        "Help users with trip planning, itinerary creation, route optimization, hidden gems, local culture, history, food, safety tips, and travel communities.",
        "Provide practical and actionable advice instead of generic suggestions.",
        "If information is uncertain or unavailable, clearly say so instead of making up facts.",
        "Ask a follow-up question when more information is needed to provide better recommendations.",
        "Keep responses concise, informative, and easy to read.",
    ]
    
    context_lines: list[str] = []
    if display_name:
        context_lines.append(f"- Traveler name: {display_name}")
    if location:
        context_lines.append(f"- Home base or current location: {location}")
    if interests:
        joined_interests = ", ".join(item.strip() for item in interests if item.strip())
        if joined_interests:
            context_lines.append(f"- Interests: {joined_interests}")
    if context_lines:
        prompt_parts.append("User context:\n" + "\n".join(context_lines))
    return "\n\n".join(prompt_parts)


def ask_groq_chat(
    message: str,
    history: Sequence[dict[str, str]] | None = None,
    display_name: str | None = None,
    location: str | None = None,
    interests: Sequence[str] | None = None,
) -> tuple[str, str | None]:
    messages: list[dict[str, str]] = [
        {
            "role": "system",
            "content": _build_system_prompt(display_name, location, interests),
        }
    ]

    for turn in history or []:
        role = turn.get("role", "").strip()
        content = turn.get("content", "").strip()
        if role in {"user", "assistant", "system"} and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message.strip()})

    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=messages,
        temperature=0.7,
        max_completion_tokens=1024,
    )

    content = response.choices[0].message.content or "I could not generate a reply just now."
    return content, getattr(response, "model", settings.groq_model)