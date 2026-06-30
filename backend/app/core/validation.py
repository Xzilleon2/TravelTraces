from __future__ import annotations

import html
import json
import re
from typing import Any

from pydantic import ConfigDict

try:
    import bleach
except Exception:  # pragma: no cover - dependency fallback for constrained local shells
    bleach = None  # type: ignore[assignment]


STRICT_MODEL_CONFIG = ConfigDict(extra="forbid", str_strip_whitespace=True)
CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
TAG_RE = re.compile(r"<[^>]*>")
SAFE_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$")
SAFE_EMAIL_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,185}\.[^@\s]{2,20}$")

ALLOWED_RICH_TAGS = [
    "a",
    "b",
    "blockquote",
    "br",
    "div",
    "em",
    "i",
    "li",
    "ol",
    "p",
    "span",
    "strong",
    "u",
    "ul",
]
ALLOWED_RICH_ATTRIBUTES = {
    "a": ["href", "rel", "target", "title"],
    "*": ["class"],
}
ALLOWED_PROTOCOLS = ["http", "https", "mailto"]


def clean_plain_text(value: str | None, *, max_length: int, field_name: str) -> str | None:
    if value is None:
        return None
    cleaned = TAG_RE.sub("", CONTROL_CHARS_RE.sub("", str(value))).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    if not cleaned:
        raise ValueError(f"{field_name} cannot be empty.")
    if len(cleaned) > max_length:
        raise ValueError(f"{field_name} must be {max_length} characters or fewer.")
    return cleaned


def clean_optional_plain_text(value: str | None, *, max_length: int, field_name: str) -> str | None:
    if value is None:
        return None
    cleaned = TAG_RE.sub("", CONTROL_CHARS_RE.sub("", str(value))).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    if len(cleaned) > max_length:
        raise ValueError(f"{field_name} must be {max_length} characters or fewer.")
    return cleaned or None


def clean_rich_html(value: str | None, *, max_length: int = 1000) -> str:
    if not value:
        return ""
    raw = CONTROL_CHARS_RE.sub("", str(value)).strip()
    if len(raw) > max_length:
        raise ValueError(f"HTML content must be {max_length} characters or fewer.")
    if bleach is None:
        return html.escape(raw)
    return bleach.clean(
        raw,
        tags=ALLOWED_RICH_TAGS,
        attributes=ALLOWED_RICH_ATTRIBUTES,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
    )


def validate_safe_id(value: str, *, field_name: str) -> str:
    cleaned = clean_plain_text(value, max_length=120, field_name=field_name)
    if cleaned is None or not SAFE_ID_RE.fullmatch(cleaned):
        raise ValueError(f"{field_name} must contain only letters, numbers, dot, underscore, colon, or hyphen.")
    return cleaned


def normalize_group_ids(values: list[str]) -> list[str]:
    seen: set[str] = set()
    normalized: list[str] = []
    for value in values:
        group_id = validate_safe_id(value, field_name="group_id")
        if group_id not in seen:
            normalized.append(group_id)
            seen.add(group_id)
    return normalized


def normalize_email(value: str) -> str:
    cleaned = clean_plain_text(value, max_length=254, field_name="email")
    if cleaned is None:
        raise ValueError("email is required.")
    lowered = cleaned.lower()
    if not SAFE_EMAIL_RE.fullmatch(lowered):
        raise ValueError("email must be a valid address.")
    return lowered


def validate_custom_graph(payload: dict[str, Any] | None) -> dict[str, Any] | None:
    if payload is None:
        return None
    if not isinstance(payload, dict):
        raise ValueError("custom_graph must be a JSON object.")
    encoded = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    if len(encoded.encode("utf-8")) > 50_000:
        raise ValueError("custom_graph is too large.")

    nodes = payload.get("nodes") or []
    edges = payload.get("edges") or []
    if not isinstance(nodes, list) or not isinstance(edges, list):
        raise ValueError("custom_graph nodes and edges must be lists.")
    if len(nodes) > 500 or len(edges) > 2_000:
        raise ValueError("custom_graph exceeds node or edge limits.")

    cleaned_nodes: list[dict[str, Any]] = []
    node_ids: set[str] = set()
    for node in nodes:
        if not isinstance(node, dict):
            raise ValueError("custom_graph nodes must be objects.")
        node_id = validate_safe_id(str(node.get("id", "")), field_name="node_id")
        lat = float(node.get("lat"))
        lon = float(node.get("lon"))
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise ValueError("custom_graph node coordinates are out of range.")
        cleaned_nodes.append({"id": node_id, "lat": lat, "lon": lon})
        node_ids.add(node_id)

    cleaned_edges: list[dict[str, Any]] = []
    for edge in edges:
        if not isinstance(edge, dict):
            raise ValueError("custom_graph edges must be objects.")
        source = validate_safe_id(str(edge.get("from", "")), field_name="edge_from")
        target = validate_safe_id(str(edge.get("to", "")), field_name="edge_to")
        if source not in node_ids or target not in node_ids:
            raise ValueError("custom_graph edges must reference known nodes.")
        weight_raw = edge.get("weight_m")
        weight_m = float(weight_raw) if weight_raw is not None else None
        if weight_m is not None and not (0 < weight_m <= 10_000_000):
            raise ValueError("custom_graph edge weights are out of range.")
        cleaned_edges.append(
            {
                "from": source,
                "to": target,
                "weight_m": weight_m,
                "bidirectional": bool(edge.get("bidirectional", True)),
            }
        )

    return {"nodes": cleaned_nodes, "edges": cleaned_edges}
