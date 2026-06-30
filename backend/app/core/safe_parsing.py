from __future__ import annotations

import json
from typing import Any


def parse_json_object(raw: str | bytes, *, max_bytes: int) -> dict[str, Any]:
    if isinstance(raw, str):
        raw_bytes = raw.encode("utf-8")
    else:
        raw_bytes = raw
    if len(raw_bytes) > max_bytes:
        raise ValueError("JSON payload exceeds the allowed size.")
    parsed = json.loads(raw_bytes.decode("utf-8"))
    if not isinstance(parsed, dict):
        raise ValueError("JSON payload must be an object.")
    return parsed


def reject_pickle_for_user_input(*_: Any, **__: Any) -> None:
    raise RuntimeError("pickle is forbidden for user-supplied TravelPlaces data.")


def reject_unsafe_yaml_for_user_input(*_: Any, **__: Any) -> None:
    raise RuntimeError("Unsafe YAML loaders are forbidden for user-supplied TravelPlaces data.")
