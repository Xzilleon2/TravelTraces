from __future__ import annotations

from collections.abc import Sequence

from app.core.config import settings
from app.services.ai.groq_client import client


MAX_PINS_IN_PROMPT = 5


def _build_system_prompt(
    display_name: str | None,
    location: str |None,
    interests: Sequence[str] | None,
    pins: Sequence[dict] | None,
) -> str:
    prompt_parts = [
        "You are Trace, the official AI travel companion for TravelTraces.",

        "Your personality is friendly, knowledgeable, curious, and encouraging.",
        "Speak like an experienced local guide.",

        "Respond in plain text only.",
        "Do not use Markdown formatting.",
        "Do not use bullet points or numbered lists unless the user explicitly asks for them.",
        "Do not use *, **, #, _, `, >, |, tables, or code blocks.",
        "Use natural sentences and short paragraphs.",

        "Help users with trip planning, itineraries, route optimization, hidden gems, local history, food, travel stories, travel communities, and safety tips.",

        "Provide practical and actionable advice.",
        "Never invent locations, businesses, or facts.",
        "If information is uncertain or unavailable, clearly say so.",

        "Always use the user's saved TravelTraces pins whenever they ask about routes, itineraries, nearby attractions, recommendations, travel plans, or locations related to their own trips.",

        "Treat saved pins as trusted context.",
        "You may use their titles, categories, addresses, and coordinates when creating personalized travel recommendations.",

        "Only use the saved pins when they are relevant to the user's request.",
        "Do not force references to saved pins for general travel questions.",

        "If there are no saved pins and the user asks for personalized routes, nearby recommendations from their saved places, or itineraries based on their TravelTraces locations, politely explain that no saved locations were found and ask them to create their first location pin from the Maps page before requesting personalized route planning.",

        "If there are no saved pins but the question is a general travel question, answer that the user can find information about their travels by creating location pins on the Maps page.",
    ]

    user_context: list[str] = []

    if display_name:
        user_context.append(f"Traveler Name: {display_name}")

    if location:
        user_context.append(f"Current Location: {location}")

    if interests:
        cleaned = [interest.strip() for interest in interests if interest.strip()]
        if cleaned:
            user_context.append(
                f"Travel Interests: {', '.join(cleaned)}"
            )

    if user_context:
        prompt_parts.append(
            "User Profile:\n" + "\n".join(user_context)
        )

    if pins:
        prompt_parts.append(
            f"The user currently has {len(pins)} saved TravelTraces pins."
        )

        prompt_parts.append(
            "Saved TravelTraces Locations:"
        )

        for index, pin in enumerate(pins[:MAX_PINS_IN_PROMPT], start=1):
            prompt_parts.append(
                (
                    f"{index}. "
                    f"Title: {pin.get('title') or 'Untitled'}; "
                    f"Category: {pin.get('category') or 'Unknown'}; "
                    f"Address: {pin.get('address') or 'Unknown'}; "
                    f"Latitude: {pin.get('latitude')}; "
                    f"Longitude: {pin.get('longitude')}"
                )
            )

        if len(pins) > MAX_PINS_IN_PROMPT:
            prompt_parts.append(
                f"There are {len(pins) - MAX_PINS_IN_PROMPT} additional saved pins not shown."
            )

    else:
        prompt_parts.append(
            "The user currently has no saved TravelTraces pins."
        )

    return "\n\n".join(prompt_parts)


def ask_groq_chat(
    message: str,
    history: Sequence[dict[str, str]] | None = None,
    display_name: str | None = None,
    location: str | None = None,
    interests: Sequence[str] | None = None,
    pins: Sequence[dict] | None = None,
) -> tuple[str, str | None]:

    messages: list[dict[str, str]] = [
        {
            "role": "system",
            "content": _build_system_prompt(
                display_name=display_name,
                location=location,
                interests=interests,
                pins=pins,
            ),
        }
    ]

    for turn in history or []:
        role = turn.get("role", "").strip()
        content = turn.get("content", "").strip()

        if role in {"user", "assistant", "system"} and content:
            messages.append(
                {
                    "role": role,
                    "content": content,
                }
            )

    messages.append(
        {
            "role": "user",
            "content": message.strip(),
        }
    )

    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=messages,
        temperature=0.7,
        max_completion_tokens=1024,
    )

    content = (
        response.choices[0].message.content
        or "I could not generate a reply just now."
    )

    return content, getattr(response, "model", settings.groq_model)