from __future__ import annotations

import json
import math
import secrets
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.core.database import TravelPlacesDatabase
from app.core.mapping import utc_now


REMOVED_DEFAULT_TOURIST_SPOTS = {"Samal Island", "Mount Apo", "Tinuy-an Falls"}


class ScopedMapStore:
    def __init__(self, path: Path | None = None) -> None:
        backend_root = Path(__file__).resolve().parents[2]
        self.path = path or backend_root / "data" / "map_state.json"
        db_path = Path(settings.database_path)
        if not db_path.is_absolute():
            db_path = backend_root / db_path
        self.db = TravelPlacesDatabase(db_path)
        self._lock = threading.RLock()

    def list_maps(self, viewer_id: str, group_ids: list[str], owner_id: str | None = None) -> list[dict[str, Any]]:
        data = self._read()
        maps = data.get("user_maps", [])
        if owner_id:
            maps = [item for item in maps if item.get("owner_id") == owner_id]
        return [item for item in maps if self._can_view(item, viewer_id, group_ids)]

    def get_map(self, map_id: str) -> dict[str, Any] | None:
        data = self._read()
        return next((item for item in data.get("user_maps", []) if item.get("map_id") == map_id), None)

    def create_map(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        record = {
            "map_id": str(uuid.uuid4()),
            "created_at": now,
            "updated_at": now,
            "group_ids": [],
            **payload,
        }
        data = self._read()
        data.setdefault("user_maps", [])
        data["user_maps"].append(record)
        self._write(data)
        return record

    def ensure_default_map(self, owner_id: str) -> dict[str, Any]:
        data = self._read()
        data.setdefault("user_maps", [])
        existing = next((item for item in data["user_maps"] if item.get("owner_id") == owner_id and item.get("is_default")), None)
        if existing:
            return existing
        return self.create_map(
            {
                "title": "My Travel Map",
                "description": "Default personal workspace",
                "scope": "private",
                "owner_id": owner_id,
                "creator_id": owner_id,
                "is_default": True,
                "group_ids": [],
            }
        )

    def list_pins(
        self,
        viewer_id: str,
        group_ids: list[str],
        map_id: str | None = None,
        owner_id: str | None = None,
    ) -> list[dict[str, Any]]:
        data = self._read()
        pins = data["pins"]
        if map_id:
            pins = [pin for pin in pins if pin.get("map_id") == map_id]
        if owner_id:
            pins = [pin for pin in pins if pin.get("creator_id") == owner_id]
        return [pin for pin in pins if self._can_view(pin, viewer_id, group_ids)]

    def create_pin(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        record = {
            "pin_id": str(uuid.uuid4()),
            "post_id": str(uuid.uuid4()),
            "created_at": now,
            "updated_at": now,
            "group_ids": [],
            "media": None,
            "photos": [],
            "map_id": None,
            "address": "",
            **payload,
        }
        record["post_id"] = record.get("post_id") or record["pin_id"]
        data = self._read()
        data["pins"].append(record)
        self._write(data)
        return record

    def delete_pin(self, pin_id: str, creator_id: str) -> bool:
        data = self._read()
        removed = [pin for pin in data.get("pins", []) if pin.get("pin_id") == pin_id and pin.get("creator_id") == creator_id]
        if not removed:
            return False
        data["pins"] = [pin for pin in data.get("pins", []) if not (pin.get("pin_id") == pin_id and pin.get("creator_id") == creator_id)]
        self._delete_pin_media_files(removed)
        self._write(data)
        return True

    def list_routes(self, viewer_id: str, group_ids: list[str]) -> list[dict[str, Any]]:
        data = self._read()
        return [route for route in data["routes"] if self._can_view(route, viewer_id, group_ids)]

    def create_route(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        record = {
            "record_id": str(uuid.uuid4()),
            "created_at": now,
            "updated_at": now,
            "group_ids": [],
            **payload,
        }
        data = self._read()
        data["routes"].append(record)
        self._write(data)
        return record

    def create_tracking_session(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        record = {
            "created_at": now,
            "updated_at": now,
            "last_location": None,
            "group_ids": [],
            **payload,
        }
        data = self._read()
        sessions = [session for session in data["tracking_sessions"] if session["session_id"] != record["session_id"]]
        sessions.append(record)
        data["tracking_sessions"] = sessions
        self._write(data)
        return record

    def get_tracking_session(self, session_id: str) -> dict[str, Any] | None:
        data = self._read()
        return next((session for session in data["tracking_sessions"] if session.get("session_id") == session_id), None)

    def update_tracking_location(self, session_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        data = self._read()
        now = utc_now()
        updated = None
        for session in data["tracking_sessions"]:
            if session.get("session_id") == session_id:
                session["last_location"] = payload
                session["updated_at"] = now
                updated = session
                break
        if updated:
            self._write(data)
        return updated

    def list_circles(self, viewer_id: str) -> list[dict[str, Any]]:
        data = self._read()
        migrated = self._ensure_default_circles(data, viewer_id)
        circles = [
            circle
            for circle in data["circles"]
            if circle.get("owner_id") == viewer_id or any(member.get("user_id") == viewer_id for member in circle.get("members", []))
        ]
        if migrated:
            self._write(data)
        return circles

    def get_circle(self, circle_id: str) -> dict[str, Any] | None:
        data = self._read()
        return next((circle for circle in data["circles"] if circle.get("circle_id") == circle_id), None)

    def create_circle(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        owner_id = payload["owner_id"]
        circle_id = str(uuid.uuid4())
        record = {
            "circle_id": circle_id,
            "group_id": f"circle-{circle_id}",
            "name": payload["name"],
            "owner_id": owner_id,
            "created_at": now,
            "updated_at": now,
            "members": [
                {
                    "user_id": owner_id,
                    "display_name": payload.get("display_name") or "You",
                    "role": payload.get("role") or "Other",
                    "phone": payload.get("phone") or "",
                    "avatar": payload.get("avatar") or "",
                    "admin": True,
                    "location_sharing_enabled": True,
                    "joined_at": now,
                }
            ],
        }
        data = self._read()
        data["circles"].append(record)
        self._write(data)
        return record

    def update_circle(self, circle_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        data = self._read()
        updated = None
        for circle in data["circles"]:
            if circle.get("circle_id") == circle_id:
                if payload.get("name"):
                    circle["name"] = payload["name"]
                circle["updated_at"] = utc_now()
                updated = circle
                break
        if updated:
            self._write(data)
        return updated

    def create_circle_invite(self, circle_id: str, creator_id: str, ttl_hours: int = 48) -> dict[str, Any] | None:
        data = self._read()
        circle = next((item for item in data["circles"] if item.get("circle_id") == circle_id), None)
        if not circle:
            return None
        now = datetime.now(timezone.utc)
        code = self._new_invite_code(data)
        record = {
            "invite_id": str(uuid.uuid4()),
            "circle_id": circle_id,
            "code": code,
            "created_by": creator_id,
            "created_at": now.isoformat(),
            "expires_at": (now + timedelta(hours=ttl_hours)).isoformat(),
            "uses": 0,
        }
        data["circle_invites"].append(record)
        self._write(data)
        return record

    def join_circle(self, invite_code: str, member: dict[str, Any]) -> dict[str, Any] | None:
        data = self._read()
        now = datetime.now(timezone.utc)
        normalized = invite_code.strip().upper()
        invite = next((item for item in data["circle_invites"] if item.get("code", "").upper() == normalized), None)
        if not invite:
            return None
        try:
            expires_at = datetime.fromisoformat(invite["expires_at"])
        except Exception:
            return None
        if expires_at < now:
            invite["expired"] = True
            self._write(data)
            return None
        circle = next((item for item in data["circles"] if item.get("circle_id") == invite.get("circle_id")), None)
        if not circle:
            return None
        members = circle.setdefault("members", [])
        user_id = member["user_id"]
        existing = next((item for item in members if item.get("user_id") == user_id), None)
        if existing:
            existing.update({key: value for key, value in member.items() if value not in (None, "")})
            existing["joined_at"] = existing.get("joined_at") or utc_now()
        else:
            members.append(
                {
                    "user_id": user_id,
                    "display_name": member.get("display_name") or user_id,
                    "role": member.get("role") or "Other",
                    "phone": member.get("phone") or "",
                    "avatar": member.get("avatar") or "",
                    "admin": False,
                    "location_sharing_enabled": True,
                    "joined_at": utc_now(),
                }
            )
        invite["uses"] = int(invite.get("uses") or 0) + 1
        circle["updated_at"] = utc_now()
        self._write(data)
        return circle

    def update_circle_member(self, circle_id: str, member_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        data = self._read()
        updated = None
        for circle in data["circles"]:
            if circle.get("circle_id") != circle_id:
                continue
            for member in circle.get("members", []):
                if member.get("user_id") == member_id:
                    for key in ("display_name", "role", "phone", "avatar", "admin", "location_sharing_enabled"):
                        if key in payload and payload[key] is not None:
                            member[key] = payload[key]
                    circle["updated_at"] = utc_now()
                    updated = member
                    break
        if updated:
            self._write(data)
        return updated

    def leave_circle(self, circle_id: str, member_id: str) -> dict[str, Any] | None:
        data = self._read()
        updated = None
        for circle in data["circles"]:
            if circle.get("circle_id") != circle_id:
                continue
            circle["members"] = [member for member in circle.get("members", []) if member.get("user_id") != member_id]
            circle["updated_at"] = utc_now()
            updated = circle
            break
        if updated:
            self._write(data)
        return updated

    def list_saved_places(self, circle_id: str) -> list[dict[str, Any]]:
        data = self._read()
        return [place for place in data["saved_places"] if place.get("circle_id") == circle_id]

    def create_saved_place(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        record = {
            "place_id": str(uuid.uuid4()),
            "created_at": now,
            "updated_at": now,
            "radius_m": 180,
            **payload,
        }
        data = self._read()
        data["saved_places"].append(record)
        self._write(data)
        return record

    def list_tracked_devices(self, circle_id: str) -> list[dict[str, Any]]:
        data = self._read()
        return [device for device in data["tracked_devices"] if device.get("circle_id") == circle_id]

    def create_tracked_device(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        record = {
            "device_id": str(uuid.uuid4()),
            "created_at": now,
            "updated_at": now,
            "battery_percent": None,
            "last_seen": None,
            "last_coordinate": None,
            **payload,
        }
        data = self._read()
        data["tracked_devices"].append(record)
        self._write(data)
        return record

    def update_member_location(self, payload: dict[str, Any]) -> dict[str, Any]:
        data = self._read()
        circle_id = payload["circle_id"]
        user_id = payload["user_id"]
        now = utc_now()
        previous = next(
            (
                item
                for item in data["member_locations"]
                if item.get("circle_id") == circle_id and item.get("user_id") == user_id
            ),
            None,
        )
        previous_inside = set(previous.get("inside_place_ids") or []) if previous else set()
        previous_activity = previous.get("activity") if previous else None
        inside = self._places_containing(data, circle_id, payload.get("coordinate"))
        sharing_enabled = bool(payload.get("sharing_enabled", True))
        record = {
            "circle_id": circle_id,
            "user_id": user_id,
            "coordinate": payload.get("coordinate") if sharing_enabled else None,
            "accuracy_m": payload.get("accuracy_m"),
            "activity": payload.get("activity") or "stationary",
            "sharing_enabled": sharing_enabled,
            "visibility_scope": payload.get("visibility_scope") or "travel_group",
            "event_id": payload.get("event_id"),
            "travel_group_id": payload.get("travel_group_id") or circle_id,
            "status_text": "Checked in" if payload.get("activity") == "check-in" else "Location sharing off" if not sharing_enabled else "Active now",
            "inside_place_ids": inside if sharing_enabled else [],
            "updated_at": now,
        }
        data["member_locations"] = [
            item
            for item in data["member_locations"]
            if not (item.get("circle_id") == circle_id and item.get("user_id") == user_id)
        ]
        data["member_locations"].append(record)

        if sharing_enabled:
            for place_id in set(inside) - previous_inside:
                self._append_circle_event(data, circle_id, user_id, "arrived", place_id=place_id)
            for place_id in previous_inside - set(inside):
                self._append_circle_event(data, circle_id, user_id, "left", place_id=place_id)
            if payload.get("activity") == "driving" and previous_activity != "driving":
                self._append_circle_event(data, circle_id, user_id, "starts_driving")
            if payload.get("activity") == "check-in":
                self._append_circle_event(data, circle_id, user_id, "check_in")

        self._write(data)
        return record

    def list_member_locations(self, circle_id: str) -> list[dict[str, Any]]:
        data = self._read()
        return [item for item in data["member_locations"] if item.get("circle_id") == circle_id]

    def list_circle_events(self, circle_id: str, limit: int = 20) -> list[dict[str, Any]]:
        data = self._read()
        events = [item for item in data["circle_events"] if item.get("circle_id") == circle_id]
        return sorted(events, key=lambda item: item.get("created_at", ""), reverse=True)[:limit]

    def mark_circle_event_read(self, circle_id: str, event_id: str, user_id: str) -> dict[str, Any] | None:
        data = self._read()
        updated = None
        for event in data["circle_events"]:
            if event.get("circle_id") == circle_id and event.get("event_id") == event_id:
                read_by = set(event.get("read_by") or [])
                read_by.add(user_id)
                event["read_by"] = sorted(read_by)
                updated = event
                break
        if updated:
            self._write(data)
        return updated

    def delete_circle_event(self, circle_id: str, event_id: str, user_id: str) -> bool:
        data = self._read()
        circle = next((item for item in data["circles"] if item.get("circle_id") == circle_id), {})
        is_admin = circle.get("owner_id") == user_id or any(
            member.get("user_id") == user_id and member.get("admin") for member in circle.get("members", [])
        )
        before = len(data["circle_events"])
        data["circle_events"] = [
            event
            for event in data["circle_events"]
            if not (
                event.get("circle_id") == circle_id
                and event.get("event_id") == event_id
                and (is_admin or event.get("user_id") == user_id)
            )
        ]
        changed = len(data["circle_events"]) != before
        if changed:
            self._write(data)
        return changed

    def get_notification_preferences(self, user_id: str) -> dict[str, Any]:
        data = self._read()
        existing = next((item for item in data["notification_preferences"] if item.get("user_id") == user_id), None)
        if existing:
            return existing
        record = {
            "user_id": user_id,
            "meetup_arrivals": True,
            "destination_arrivals": True,
            "check_ins": True,
            "checkpoints": True,
            "group_ride_start": True,
            "event_arrivals": True,
        }
        data["notification_preferences"].append(record)
        self._write(data)
        return record

    def update_notification_preferences(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        data = self._read()
        existing = next((item for item in data["notification_preferences"] if item.get("user_id") == user_id), None)
        if not existing:
            existing = {"user_id": user_id}
            data["notification_preferences"].append(existing)
        for key in ("meetup_arrivals", "destination_arrivals", "check_ins", "checkpoints", "group_ride_start", "event_arrivals"):
            if key in payload and payload[key] is not None:
                existing[key] = bool(payload[key])
        for key in ("meetup_arrivals", "destination_arrivals", "check_ins", "checkpoints", "group_ride_start", "event_arrivals"):
            existing.setdefault(key, True)
        self._write(data)
        return existing

    def list_tourist_collections(self, owner_id: str) -> list[dict[str, Any]]:
        data = self._read()
        self._ensure_default_tourist_collections(data, owner_id)
        self._write(data)
        return [item for item in data["travel_collections"] if item.get("owner_id") == owner_id]

    def create_tourist_collection(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        record = {
            "collection_id": str(uuid.uuid4()),
            "created_at": now,
            "updated_at": now,
            "description": "",
            **payload,
        }
        data = self._read()
        data["travel_collections"].append(record)
        self._write(data)
        return record

    def delete_tourist_collection(self, collection_id: str, owner_id: str) -> bool:
        data = self._read()
        before = len(data["travel_collections"])
        data["travel_collections"] = [
            item
            for item in data["travel_collections"]
            if not (item.get("collection_id") == collection_id and item.get("owner_id") == owner_id)
        ]
        for spot in data["saved_tourist_spots"]:
            if spot.get("collection_id") == collection_id and spot.get("saved_by") == owner_id:
                spot["collection_id"] = None
        changed = len(data["travel_collections"]) != before
        if changed:
            self._write(data)
        return changed

    def list_saved_tourist_spots(self, saved_by: str, collection_id: str | None = None) -> list[dict[str, Any]]:
        data = self._read()
        self._ensure_default_tourist_collections(data, saved_by)
        self._write(data)
        spots = [item for item in data["saved_tourist_spots"] if item.get("saved_by") == saved_by]
        if collection_id:
            spots = [item for item in spots if item.get("collection_id") == collection_id]
        return sorted(spots, key=lambda item: item.get("saved_at", ""), reverse=True)

    def create_saved_tourist_spot(self, payload: dict[str, Any]) -> dict[str, Any]:
        record = {
            "place_id": str(uuid.uuid4()),
            "saved_at": utc_now(),
            "notes": "",
            "collection_id": None,
            **payload,
        }
        data = self._read()
        data["saved_tourist_spots"].append(record)
        self._write(data)
        return record

    def delete_saved_tourist_spot(self, place_id: str, saved_by: str) -> bool:
        data = self._read()
        before = len(data["saved_tourist_spots"])
        data["saved_tourist_spots"] = [
            item
            for item in data["saved_tourist_spots"]
            if not (item.get("place_id") == place_id and item.get("saved_by") == saved_by)
        ]
        changed = len(data["saved_tourist_spots"]) != before
        if changed:
            self._write(data)
        return changed

    def delete_user_data(self, user_id: str) -> dict[str, int]:
        data = self._read()
        counts: dict[str, int] = {}
        self._delete_pin_media_files([pin for pin in data.get("pins", []) if pin.get("creator_id") == user_id])
        for key, user_field in (
            ("pins", "creator_id"),
            ("routes", "creator_id"),
            ("tracking_sessions", "creator_id"),
            ("user_maps", "owner_id"),
            ("meetup_requests", "creator_id"),
            ("saved_places", "creator_id"),
            ("tracked_devices", "owner_id"),
            ("member_locations", "user_id"),
            ("circle_events", "user_id"),
            ("notification_preferences", "user_id"),
            ("travel_collections", "owner_id"),
            ("saved_tourist_spots", "saved_by"),
        ):
            before = len(data.get(key, []))
            data[key] = [item for item in data.get(key, []) if item.get(user_field) != user_id]
            counts[key] = before - len(data[key])

        removed_circles = 0
        for circle in list(data["circles"]):
            if circle.get("owner_id") == user_id:
                data["circles"].remove(circle)
                removed_circles += 1
                continue
            circle["members"] = [member for member in circle.get("members", []) if member.get("user_id") != user_id]
        counts["circles"] = removed_circles
        data["circle_invites"] = [invite for invite in data["circle_invites"] if invite.get("created_by") != user_id]
        self._write(data)
        return counts

    def _delete_pin_media_files(self, pins: list[dict[str, Any]]) -> None:
        upload_root = Path(__file__).resolve().parents[2] / "data" / "uploads"
        for pin in pins:
            for photo in pin.get("photos") or []:
                preview_url = str(photo.get("preview_url") or "")
                if not preview_url.startswith("/media/uploads/"):
                    continue
                relative = preview_url.removeprefix("/media/uploads/").replace("/", "\\")
                target = (upload_root / relative).resolve()
                if upload_root.resolve() in target.parents and target.exists():
                    target.unlink(missing_ok=True)

    def _read(self) -> dict[str, Any]:
        with self._lock:
            self.db.initialize()
            if self.db.is_empty() and self.path.exists():
                with self.path.open("r", encoding="utf-8") as handle:
                    legacy = json.load(handle)
                for key, value in self._empty_state().items():
                    legacy.setdefault(key, value)
                self.db.save_state(legacy)
            data = self.db.load_state()
            data.setdefault("pins", [])
            data.setdefault("routes", [])
            data.setdefault("tracking_sessions", [])
            data.setdefault("user_maps", [])
            data.setdefault("meetup_requests", [])
            data.setdefault("circles", [])
            data.setdefault("circle_invites", [])
            data.setdefault("saved_places", [])
            data.setdefault("tracked_devices", [])
            data.setdefault("member_locations", [])
            data.setdefault("circle_events", [])
            data.setdefault("notification_preferences", [])
            data.setdefault("travel_collections", [])
            data.setdefault("saved_tourist_spots", [])
            migrated = False
            cleaned_tourist_spots = [
                spot
                for spot in data["saved_tourist_spots"]
                if spot.get("name") not in REMOVED_DEFAULT_TOURIST_SPOTS
            ]
            if len(cleaned_tourist_spots) != len(data["saved_tourist_spots"]):
                data["saved_tourist_spots"] = cleaned_tourist_spots
                migrated = True
            for pin in data["pins"]:
                if "map_id" not in pin:
                    pin["map_id"] = "legacy-default"
                    migrated = True
                if "photos" not in pin:
                    pin["photos"] = [pin["media"]] if pin.get("media") else []
                    migrated = True
                if "post_id" not in pin:
                    pin["post_id"] = pin.get("pin_id")
                    migrated = True
                if "address" not in pin:
                    pin["address"] = ""
                    migrated = True
            if migrated:
                self.db.save_state(data)
            return data

    def _write_unlocked(self, data: dict[str, Any]) -> None:
        self.db.save_state(data)

    def create_meetup_request(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        record = {
            "request_id": str(uuid.uuid4()),
            "created_at": now,
            "updated_at": now,
            "scope": "private",
            "group_ids": [],
            "participants": [],
            "fair_region": {},
            "midpoint": {},
            "suggestions": [],
            "fallback_strategy": [],
            "scoring_weights": {},
            **payload,
        }
        data = self._read()
        data.setdefault("meetup_requests", [])
        data["meetup_requests"].append(record)
        self._write(data)
        return record

    def _write(self, data: dict[str, Any]) -> None:
        with self._lock:
            self._write_unlocked(data)

    @staticmethod
    def _can_view(record: dict[str, Any], viewer_id: str, group_ids: list[str]) -> bool:
        scope = record.get("scope")
        creator_id = record.get("creator_id")
        if scope == "public":
            return True
        if scope == "private":
            return bool(viewer_id and creator_id == viewer_id)
        if scope == "group":
            record_groups = set(record.get("group_ids") or [])
            return bool(viewer_id and (creator_id == viewer_id or record_groups.intersection(group_ids)))
        return False

    def can_view(self, record: dict[str, Any], viewer_id: str, group_ids: list[str]) -> bool:
        return self._can_view(record, viewer_id, group_ids)

    @staticmethod
    def _empty_state() -> dict[str, Any]:
        return {
            "pins": [],
            "routes": [],
            "tracking_sessions": [],
            "user_maps": [],
            "meetup_requests": [],
            "circles": [],
            "circle_invites": [],
            "saved_places": [],
            "tracked_devices": [],
            "member_locations": [],
            "circle_events": [],
            "notification_preferences": [],
            "travel_collections": [],
            "saved_tourist_spots": [],
        }

    @staticmethod
    def _new_invite_code(data: dict[str, Any]) -> str:
        existing = {str(invite.get("code", "")).upper() for invite in data.get("circle_invites", [])}
        while True:
            code = f"{secrets.choice('ABCDEFGHJKLMNPQRSTUVWXYZ')}{secrets.randbelow(900000) + 100000}"
            if code not in existing:
                return code

    def _ensure_default_circles(self, data: dict[str, Any], viewer_id: str) -> bool:
        if not viewer_id:
            return False
        has_circle = any(
            circle.get("owner_id") == viewer_id or any(member.get("user_id") == viewer_id for member in circle.get("members", []))
            for circle in data["circles"]
        )
        if has_circle:
            return False
        now = utc_now()
        defaults = [
            {
                "circle_id": f"{viewer_id}-davao-riders",
                "group_id": f"{viewer_id}-davao-riders",
                "name": "Davao Riders",
                "owner_id": viewer_id,
                "created_at": now,
                "updated_at": now,
                "members": [
                    {
                        "user_id": viewer_id,
                        "display_name": "Maria Santos",
                        "role": "Organizer",
                        "phone": "+15550101010",
                        "avatar": "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=80&h=80&fit=crop&auto=format",
                        "admin": True,
                        "location_sharing_enabled": True,
                        "joined_at": now,
                    },
                    {
                        "user_id": "john",
                        "display_name": "John",
                        "role": "Rider",
                        "phone": "+15550101011",
                        "avatar": "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=80&h=80&fit=crop&auto=format",
                        "admin": False,
                        "location_sharing_enabled": True,
                        "joined_at": now,
                    },
                    {
                        "user_id": "joel",
                        "display_name": "Joel",
                        "role": "Guide",
                        "phone": "+15550101012",
                        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format",
                        "admin": True,
                        "location_sharing_enabled": False,
                        "joined_at": now,
                    },
                ],
            },
            {
                "circle_id": f"{viewer_id}-weekend-adventure",
                "group_id": f"{viewer_id}-weekend-adventure",
                "name": "Weekend Adventure Crew",
                "owner_id": viewer_id,
                "created_at": now,
                "updated_at": now,
                "members": [
                    {
                        "user_id": viewer_id,
                        "display_name": "Maria Santos",
                        "role": "Photographer",
                        "phone": "+15550101010",
                        "avatar": "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=80&h=80&fit=crop&auto=format",
                        "admin": True,
                        "location_sharing_enabled": True,
                        "joined_at": now,
                    },
                    {
                        "user_id": "ana",
                        "display_name": "Ana Villanueva",
                        "role": "Traveler",
                        "phone": "+15550101013",
                        "avatar": "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=80&h=80&fit=crop&auto=format",
                        "admin": False,
                        "location_sharing_enabled": True,
                        "joined_at": now,
                    },
                ],
            },
        ]
        data["circles"].extend(defaults)
        for circle in defaults:
            self._seed_circle_defaults(data, circle, viewer_id, now)
        return True

    def _ensure_default_tourist_collections(self, data: dict[str, Any], owner_id: str) -> None:
        if not owner_id:
            return
        if any(collection.get("owner_id") == owner_id for collection in data["travel_collections"]):
            return
        now = utc_now()
        collections = [
            {
                "collection_id": f"{owner_id}-want-to-visit",
                "owner_id": owner_id,
                "name": "Places I Want To Visit",
                "description": "Interesting destinations for future trips.",
                "created_at": now,
                "updated_at": now,
            },
            {
                "collection_id": f"{owner_id}-best-beaches",
                "owner_id": owner_id,
                "name": "Best Beaches",
                "description": "Beaches, islands, and dive-ready coastal stops.",
                "created_at": now,
                "updated_at": now,
            },
            {
                "collection_id": f"{owner_id}-photo-locations",
                "owner_id": owner_id,
                "name": "Photography Locations",
                "description": "Scenic viewpoints, mountains, and golden-hour stops.",
                "created_at": now,
                "updated_at": now,
            },
        ]
        data["travel_collections"].extend(collections)

    def _seed_circle_defaults(self, data: dict[str, Any], circle: dict[str, Any], viewer_id: str, now: str) -> None:
        circle_id = circle["circle_id"]
        if not any(place.get("circle_id") == circle_id for place in data["saved_places"]):
            data["saved_places"].extend(
                [
                    {
                        "place_id": str(uuid.uuid4()),
                        "circle_id": circle_id,
                        "creator_id": viewer_id,
                        "name": "Mount Apo Meetup Point",
                        "label": "Mount Apo meetup point",
                        "coordinate": {"lat": 6.9875, "lon": 125.2708},
                        "radius_m": 220,
                        "created_at": now,
                        "updated_at": now,
                    },
                    {
                        "place_id": str(uuid.uuid4()),
                        "circle_id": circle_id,
                        "creator_id": viewer_id,
                        "name": "Samal Island Campsite",
                        "label": "Samal Island campsite",
                        "coordinate": {"lat": 7.0731, "lon": 125.7089},
                        "radius_m": 180,
                        "created_at": now,
                        "updated_at": now,
                    },
                    {
                        "place_id": str(uuid.uuid4()),
                        "circle_id": circle_id,
                        "creator_id": viewer_id,
                        "name": "Buda Ride Checkpoint",
                        "label": "Buda ride checkpoint",
                        "coordinate": {"lat": 7.4703, "lon": 125.1961},
                        "radius_m": 240,
                        "created_at": now,
                        "updated_at": now,
                    },
                ]
            )
        for index, member in enumerate(circle.get("members", [])):
            lat = 14.62 + index * 0.04
            lon = 121.02 + index * 0.03
            if "davao" in circle_id:
                lat = 7.07 + index * 0.06
                lon = 125.60 + index * 0.05
            data["member_locations"].append(
                {
                    "circle_id": circle_id,
                    "user_id": member["user_id"],
                    "coordinate": {"lat": lat, "lon": lon} if member.get("location_sharing_enabled") else None,
                    "accuracy_m": 18,
                    "activity": "stationary",
                    "sharing_enabled": bool(member.get("location_sharing_enabled", True)),
                    "visibility_scope": "travel_group",
                    "event_id": None,
                    "travel_group_id": circle_id,
                    "status_text": "Active now" if member.get("location_sharing_enabled", True) else "Unable to find",
                    "inside_place_ids": [],
                    "updated_at": now,
                }
            )
        data["tracked_devices"].extend(
            [
                {
                    "device_id": str(uuid.uuid4()),
                    "circle_id": circle_id,
                    "owner_id": viewer_id,
                    "name": "Trail camera pack",
                    "kind": "camera",
                    "status": "near meetup point",
                    "battery_percent": 82,
                    "last_seen": now,
                    "last_coordinate": {"lat": 7.0731, "lon": 125.7089},
                    "created_at": now,
                    "updated_at": now,
                },
                {
                    "device_id": str(uuid.uuid4()),
                    "circle_id": circle_id,
                    "owner_id": viewer_id,
                    "name": "Dive bag tag",
                    "kind": "dive_gear",
                    "status": "with the group",
                    "battery_percent": 64,
                    "last_seen": now,
                    "last_coordinate": {"lat": 7.0997, "lon": 125.7681},
                    "created_at": now,
                    "updated_at": now,
                },
            ]
        )

    @staticmethod
    def _distance_m(a: dict[str, float], b: dict[str, float]) -> float:
        lat1 = math.radians(float(a["lat"]))
        lat2 = math.radians(float(b["lat"]))
        dlat = math.radians(float(b["lat"]) - float(a["lat"]))
        dlon = math.radians(float(b["lon"]) - float(a["lon"]))
        h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        return 2 * 6_371_000 * math.asin(math.sqrt(h))

    def _places_containing(self, data: dict[str, Any], circle_id: str, coordinate: dict[str, float] | None) -> list[str]:
        if not coordinate:
            return []
        inside: list[str] = []
        for place in data["saved_places"]:
            if place.get("circle_id") != circle_id:
                continue
            if self._distance_m(coordinate, place["coordinate"]) <= float(place.get("radius_m") or 180):
                inside.append(place["place_id"])
        return inside

    def _append_circle_event(
        self,
        data: dict[str, Any],
        circle_id: str,
        user_id: str,
        event_type: str,
        place_id: str | None = None,
    ) -> None:
        circle = next((item for item in data["circles"] if item.get("circle_id") == circle_id), {})
        member = next((item for item in circle.get("members", []) if item.get("user_id") == user_id), {})
        name = member.get("display_name") or user_id
        place = next((item for item in data["saved_places"] if item.get("place_id") == place_id), None)
        place_label = place.get("label") if place else None
        preference = next((item for item in data["notification_preferences"] if item.get("user_id") == user_id), {})
        preference_key = {
            "arrived": "destination_arrivals",
            "left": "destination_arrivals",
            "starts_driving": "group_ride_start",
            "check_in": "check_ins",
            "checkpoint_reached": "checkpoints",
            "meetup_arrival": "meetup_arrivals",
            "event_arrival": "event_arrivals",
        }.get(event_type)
        if preference_key and preference.get(preference_key, True) is False:
            return
        message_map = {
            "arrived": f"{name} arrived at {place_label or 'a saved place'}",
            "left": f"{name} left {place_label or 'a saved place'}",
            "starts_driving": f"{name} started the group ride",
            "check_in": f"{name} checked in at {place_label or 'a travel stop'}",
            "checkpoint_reached": f"{name} reached {place_label or 'a checkpoint'}",
            "meetup_arrival": f"{name} arrived at {place_label or 'the meetup point'}",
            "event_arrival": f"{name} arrived at {place_label or 'the event destination'}",
        }
        data["circle_events"].append(
            {
                "event_id": str(uuid.uuid4()),
                "circle_id": circle_id,
                "user_id": user_id,
                "type": event_type,
                "place_id": place_id,
                "message": message_map.get(event_type, f"{name} updated location"),
                "read_by": [],
                "created_at": utc_now(),
            }
        )
