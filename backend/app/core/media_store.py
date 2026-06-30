from __future__ import annotations

import base64
import re
import secrets
from pathlib import Path
from typing import Any

from app.core.mapping import utc_now


ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_IMAGE_BYTES = 3 * 1024 * 1024
MAX_TOTAL_IMAGE_BYTES = 10 * 1024 * 1024


def safe_filename(value: str, fallback: str = "travel-photo") -> str:
    stem = Path(value or fallback).stem
    stem = re.sub(r"[^A-Za-z0-9._-]+", "-", stem).strip(".-_")
    return (stem or fallback)[:80]


def _decode_data_url(data_url: str, expected_mime: str) -> bytes:
    prefix = f"data:{expected_mime};base64,"
    if not data_url.startswith(prefix):
        raise ValueError("Photo payload does not match its declared MIME type.")
    try:
        return base64.b64decode(data_url[len(prefix):], validate=True)
    except Exception as exc:
        raise ValueError("Photo payload is not valid base64.") from exc


def persist_photo_attachments(raw_photos: list[dict[str, Any]], *, upload_root: Path, pin_id: str) -> list[dict[str, Any]]:
    attachments: list[dict[str, Any]] = []
    total_size = 0
    target_dir = upload_root / "travel-posts"
    target_dir.mkdir(parents=True, exist_ok=True)

    for index, raw in enumerate(raw_photos[:12]):
        mime_type = str(raw.get("mime_type") or "").lower()
        if mime_type not in ALLOWED_IMAGE_TYPES:
            raise ValueError("Only JPG, JPEG, PNG, and WEBP photos are allowed.")
        declared_size = int(raw.get("size_bytes") or 0)
        data_url = str(raw.get("data_url") or "")
        image_bytes = _decode_data_url(data_url, mime_type)
        if declared_size and abs(declared_size - len(image_bytes)) > 8:
            raise ValueError("Photo metadata size does not match payload size.")
        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise ValueError("Each photo must be 3 MB or smaller.")
        total_size += len(image_bytes)
        if total_size > MAX_TOTAL_IMAGE_BYTES:
            raise ValueError("Total photo upload size must be 10 MB or smaller.")

        ext = ALLOWED_IMAGE_TYPES[mime_type]
        filename = f"{pin_id}-{index + 1}-{secrets.token_hex(8)}-{safe_filename(str(raw.get('filename') or 'photo'))}{ext}"
        path = target_dir / filename
        path.write_bytes(image_bytes)
        relative_url = f"/media/uploads/travel-posts/{filename}"
        attachments.append(
            {
                "filename": filename,
                "original_filename": safe_filename(str(raw.get("filename") or filename)),
                "mime_type": "image/jpeg" if mime_type == "image/jpg" else mime_type,
                "size_bytes": len(image_bytes),
                "preview_url": relative_url,
                "thumbnail_url": relative_url,
                "captured_at": str(raw.get("captured_at") or utc_now()),
                "source": raw.get("source") if raw.get("source") in {"upload", "exif", "gps", "camera"} else "upload",
            }
        )

    return attachments
