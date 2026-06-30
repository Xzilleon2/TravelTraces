from __future__ import annotations

import json
import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator


def _json(value: Any) -> str:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


def _loads(value: str | None, fallback: Any) -> Any:
    if value in (None, ""):
        return fallback
    try:
        return json.loads(value)
    except Exception:
        return fallback


def _csv(values: list[str] | None) -> str:
    return ",".join(values or [])


def _split(value: str | None) -> list[str]:
    return [item.strip() for item in (value or "").split(",") if item.strip()]


class TravelPlacesDatabase:
    """SQLite-backed source of truth with table shapes aligned to the Access setup doc."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self._lock = threading.RLock()
        self._initialized = False

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA busy_timeout = 5000")
        try:
            yield connection
        finally:
            connection.close()

    def initialize(self) -> None:
        if self._initialized:
            return
        with self._lock, self.connect() as db:
            db.executescript(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    migration_id TEXT PRIMARY KEY,
                    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    group_ids TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    deleted_at TEXT
                );
                CREATE TABLE IF NOT EXISTS user_maps (
                    map_id TEXT PRIMARY KEY,
                    owner_id TEXT NOT NULL,
                    creator_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    scope TEXT NOT NULL CHECK(scope IN ('private','group','public')),
                    is_default INTEGER NOT NULL DEFAULT 0,
                    group_ids TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(owner_id) REFERENCES users(user_id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_user_maps_owner ON user_maps(owner_id, scope);
                CREATE TABLE IF NOT EXISTS pins (
                    pin_id TEXT PRIMARY KEY,
                    post_id TEXT NOT NULL,
                    map_id TEXT,
                    creator_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    note TEXT NOT NULL DEFAULT '',
                    lat REAL NOT NULL CHECK(lat BETWEEN -90 AND 90),
                    lon REAL NOT NULL CHECK(lon BETWEEN -180 AND 180),
                    address TEXT NOT NULL DEFAULT '',
                    scope TEXT NOT NULL CHECK(scope IN ('private','group','public')),
                    source TEXT NOT NULL,
                    group_ids TEXT NOT NULL DEFAULT '',
                    media TEXT,
                    photos TEXT NOT NULL DEFAULT '[]',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(map_id) REFERENCES user_maps(map_id) ON DELETE SET NULL,
                    FOREIGN KEY(creator_id) REFERENCES users(user_id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_pins_scope_creator ON pins(scope, creator_id);
                CREATE INDEX IF NOT EXISTS idx_pins_map ON pins(map_id);
                CREATE TABLE IF NOT EXISTS routes (
                    record_id TEXT PRIMARY KEY,
                    route_id TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    creator_id TEXT NOT NULL,
                    scope TEXT NOT NULL CHECK(scope IN ('private','group','public')),
                    engine TEXT NOT NULL,
                    route TEXT NOT NULL,
                    group_ids TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(creator_id) REFERENCES users(user_id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_routes_creator ON routes(creator_id, scope);
                CREATE TABLE IF NOT EXISTS tracking_sessions (
                    session_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    route_id TEXT,
                    scope TEXT NOT NULL CHECK(scope IN ('private','group','public')),
                    status TEXT NOT NULL DEFAULT 'active',
                    last_location TEXT,
                    group_ids TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS meetup_requests (
                    request_id TEXT PRIMARY KEY,
                    creator_id TEXT NOT NULL,
                    map_id TEXT,
                    scope TEXT NOT NULL CHECK(scope IN ('private','group','public')),
                    group_ids TEXT NOT NULL DEFAULT '',
                    participants TEXT NOT NULL DEFAULT '[]',
                    fair_region TEXT NOT NULL DEFAULT '{}',
                    midpoint TEXT NOT NULL DEFAULT '{}',
                    suggestions TEXT NOT NULL DEFAULT '[]',
                    fallback_strategy TEXT NOT NULL DEFAULT '[]',
                    scoring_weights TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(creator_id) REFERENCES users(user_id) ON DELETE CASCADE,
                    FOREIGN KEY(map_id) REFERENCES user_maps(map_id) ON DELETE SET NULL
                );
                CREATE TABLE IF NOT EXISTS travel_groups (
                    circle_id TEXT PRIMARY KEY,
                    group_id TEXT NOT NULL UNIQUE,
                    name TEXT NOT NULL,
                    owner_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(owner_id) REFERENCES users(user_id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS travel_group_members (
                    circle_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    display_name TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'Other',
                    phone TEXT NOT NULL DEFAULT '',
                    avatar TEXT NOT NULL DEFAULT '',
                    admin INTEGER NOT NULL DEFAULT 0,
                    location_sharing_enabled INTEGER NOT NULL DEFAULT 1,
                    joined_at TEXT NOT NULL,
                    PRIMARY KEY(circle_id, user_id),
                    FOREIGN KEY(circle_id) REFERENCES travel_groups(circle_id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS circle_invites (
                    invite_id TEXT PRIMARY KEY,
                    circle_id TEXT NOT NULL,
                    code TEXT NOT NULL UNIQUE,
                    created_by TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    uses INTEGER NOT NULL DEFAULT 0,
                    expired INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY(circle_id) REFERENCES travel_groups(circle_id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS saved_places (
                    place_id TEXT PRIMARY KEY,
                    circle_id TEXT NOT NULL,
                    creator_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    label TEXT NOT NULL,
                    lat REAL NOT NULL,
                    lon REAL NOT NULL,
                    radius_m INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(circle_id) REFERENCES travel_groups(circle_id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS tracked_devices (
                    device_id TEXT PRIMARY KEY,
                    circle_id TEXT NOT NULL,
                    owner_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    kind TEXT NOT NULL,
                    status TEXT NOT NULL,
                    battery_percent INTEGER,
                    last_seen TEXT,
                    last_coordinate TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(circle_id) REFERENCES travel_groups(circle_id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS member_locations (
                    circle_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    coordinate TEXT,
                    accuracy_m REAL,
                    activity TEXT NOT NULL,
                    sharing_enabled INTEGER NOT NULL,
                    visibility_scope TEXT NOT NULL,
                    event_id TEXT,
                    travel_group_id TEXT,
                    status_text TEXT NOT NULL,
                    inside_place_ids TEXT NOT NULL DEFAULT '[]',
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY(circle_id, user_id),
                    FOREIGN KEY(circle_id) REFERENCES travel_groups(circle_id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS circle_events (
                    event_id TEXT PRIMARY KEY,
                    circle_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    type TEXT NOT NULL,
                    place_id TEXT,
                    message TEXT NOT NULL,
                    read_by TEXT NOT NULL DEFAULT '[]',
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(circle_id) REFERENCES travel_groups(circle_id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS notification_preferences (
                    user_id TEXT PRIMARY KEY,
                    meetup_arrivals INTEGER NOT NULL DEFAULT 1,
                    destination_arrivals INTEGER NOT NULL DEFAULT 1,
                    check_ins INTEGER NOT NULL DEFAULT 1,
                    checkpoints INTEGER NOT NULL DEFAULT 1,
                    group_ride_start INTEGER NOT NULL DEFAULT 1,
                    event_arrivals INTEGER NOT NULL DEFAULT 1,
                    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS travel_collections (
                    collection_id TEXT PRIMARY KEY,
                    owner_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(owner_id) REFERENCES users(user_id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS saved_tourist_spots (
                    place_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    category TEXT NOT NULL,
                    saved_by TEXT NOT NULL,
                    saved_at TEXT NOT NULL,
                    collection_id TEXT,
                    notes TEXT NOT NULL DEFAULT '',
                    FOREIGN KEY(saved_by) REFERENCES users(user_id) ON DELETE CASCADE,
                    FOREIGN KEY(collection_id) REFERENCES travel_collections(collection_id) ON DELETE SET NULL
                );
                CREATE TABLE IF NOT EXISTS audit_log (
                    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    actor_id TEXT,
                    action TEXT NOT NULL,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    details TEXT NOT NULL DEFAULT '{}'
                );
                """
            )
            self._ensure_column(db, "pins", "post_id", "TEXT")
            self._ensure_column(db, "pins", "address", "TEXT NOT NULL DEFAULT ''")
            db.execute("UPDATE pins SET post_id = pin_id WHERE post_id IS NULL OR post_id = ''")
            db.commit()
            self._initialized = True

    @staticmethod
    def _ensure_column(db: sqlite3.Connection, table: str, column: str, definition: str) -> None:
        columns = {row["name"] for row in db.execute(f"PRAGMA table_info({table})")}
        if column not in columns:
            db.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")

    def is_empty(self) -> bool:
        self.initialize()
        with self.connect() as db:
            return all(db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] == 0 for table in ("user_maps", "pins", "routes", "travel_groups"))

    def ensure_user(self, user_id: str, email: str | None = None, password_hash: str | None = None, group_ids: list[str] | None = None, now: str = "") -> None:
        self.initialize()
        email_value = (email or f"{user_id}@local.travelplaces").lower()
        hash_value = password_hash or "external-auth"
        with self._lock, self.connect() as db:
            db.execute(
                """
                INSERT INTO users(user_id,email,password_hash,group_ids,created_at,updated_at)
                VALUES(?,?,?,?,?,?)
                ON CONFLICT(user_id) DO UPDATE SET
                    email=excluded.email,
                    group_ids=excluded.group_ids,
                    updated_at=excluded.updated_at
                """,
                (user_id, email_value, hash_value, _csv(group_ids), now, now),
            )
            db.commit()

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        self.initialize()
        with self.connect() as db:
            row = db.execute("SELECT user_id,email,password_hash,group_ids FROM users WHERE lower(email)=lower(?) AND deleted_at IS NULL", (email,)).fetchone()
            if not row:
                return None
            return dict(row, group_ids=_split(row["group_ids"]))

    def create_user(self, user_id: str, email: str, password_hash: str, group_ids: list[str], now: str) -> dict[str, Any]:
        self.initialize()
        with self._lock, self.connect() as db:
            try:
                db.execute(
                    "INSERT INTO users(user_id,email,password_hash,group_ids,created_at,updated_at) VALUES(?,?,?,?,?,?)",
                    (user_id, email.lower(), password_hash, _csv(group_ids), now, now),
                )
                db.execute(
                    "INSERT INTO audit_log(actor_id,action,entity_type,entity_id,details) VALUES(?,?,?,?,?)",
                    (user_id, "signup", "user", user_id, _json({})),
                )
                db.commit()
            except Exception:
                db.rollback()
                raise
        return {"user_id": user_id, "email": email.lower(), "password_hash": password_hash, "group_ids": group_ids}

    def get_user(self, user_id: str) -> dict[str, Any] | None:
        self.initialize()
        with self.connect() as db:
            row = db.execute("SELECT user_id,email,password_hash,group_ids FROM users WHERE user_id=? AND deleted_at IS NULL", (user_id,)).fetchone()
            if not row:
                return None
            return dict(row, group_ids=_split(row["group_ids"]))

    def delete_user(self, user_id: str) -> None:
        self.initialize()
        with self._lock, self.connect() as db:
            db.execute("DELETE FROM users WHERE user_id=?", (user_id,))
            db.commit()

    def load_state(self) -> dict[str, Any]:
        self.initialize()
        with self.connect() as db:
            state: dict[str, Any] = {
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
            state["user_maps"] = [dict(row, group_ids=_split(row["group_ids"]), is_default=bool(row["is_default"])) for row in db.execute("SELECT * FROM user_maps")]
            state["pins"] = [
                {
                    "pin_id": row["pin_id"],
                    "post_id": row["post_id"] or row["pin_id"],
                    "map_id": row["map_id"],
                    "creator_id": row["creator_id"],
                    "title": row["title"],
                    "note": row["note"],
                    "coordinate": {"lat": row["lat"], "lon": row["lon"]},
                    "address": row["address"] or "",
                    "scope": row["scope"],
                    "source": row["source"],
                    "group_ids": _split(row["group_ids"]),
                    "media": _loads(row["media"], None),
                    "photos": _loads(row["photos"], []),
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                }
                for row in db.execute("SELECT * FROM pins")
            ]
            state["routes"] = [
                {
                    "record_id": row["record_id"],
                    "route_id": row["route_id"],
                    "session_id": row["session_id"],
                    "creator_id": row["creator_id"],
                    "scope": row["scope"],
                    "engine": row["engine"],
                    "route": _loads(row["route"], {}),
                    "group_ids": _split(row["group_ids"]),
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                }
                for row in db.execute("SELECT * FROM routes")
            ]
            state["tracking_sessions"] = [dict(row, group_ids=_split(row["group_ids"]), last_location=_loads(row["last_location"], None)) for row in db.execute("SELECT * FROM tracking_sessions")]
            state["meetup_requests"] = [
                dict(
                    row,
                    group_ids=_split(row["group_ids"]),
                    participants=_loads(row["participants"], []),
                    fair_region=_loads(row["fair_region"], {}),
                    midpoint=_loads(row["midpoint"], {}),
                    suggestions=_loads(row["suggestions"], []),
                    fallback_strategy=_loads(row["fallback_strategy"], []),
                    scoring_weights=_loads(row["scoring_weights"], {}),
                )
                for row in db.execute("SELECT * FROM meetup_requests")
            ]
            members: dict[str, list[dict[str, Any]]] = {}
            for row in db.execute("SELECT * FROM travel_group_members"):
                member = dict(row, admin=bool(row["admin"]), location_sharing_enabled=bool(row["location_sharing_enabled"]))
                circle_id = str(member.pop("circle_id"))
                members.setdefault(circle_id, []).append(member)
            state["circles"] = [dict(row, members=members.get(row["circle_id"], [])) for row in db.execute("SELECT * FROM travel_groups")]
            state["circle_invites"] = [dict(row, expired=bool(row["expired"])) for row in db.execute("SELECT * FROM circle_invites")]
            state["saved_places"] = [
                dict(row, coordinate={"lat": row["lat"], "lon": row["lon"]})
                for row in db.execute("SELECT place_id,circle_id,creator_id,name,label,lat,lon,radius_m,created_at,updated_at FROM saved_places")
            ]
            state["tracked_devices"] = [dict(row, last_coordinate=_loads(row["last_coordinate"], None)) for row in db.execute("SELECT * FROM tracked_devices")]
            state["member_locations"] = [dict(row, coordinate=_loads(row["coordinate"], None), sharing_enabled=bool(row["sharing_enabled"]), inside_place_ids=_loads(row["inside_place_ids"], [])) for row in db.execute("SELECT * FROM member_locations")]
            state["circle_events"] = [dict(row, read_by=_loads(row["read_by"], [])) for row in db.execute("SELECT * FROM circle_events")]
            state["notification_preferences"] = [dict(row, **{key: bool(row[key]) for key in ("meetup_arrivals", "destination_arrivals", "check_ins", "checkpoints", "group_ride_start", "event_arrivals")}) for row in db.execute("SELECT * FROM notification_preferences")]
            state["travel_collections"] = [dict(row) for row in db.execute("SELECT * FROM travel_collections")]
            state["saved_tourist_spots"] = [dict(row) for row in db.execute("SELECT * FROM saved_tourist_spots")]
            return state

    def save_state(self, data: dict[str, Any]) -> None:
        self.initialize()
        with self._lock, self.connect() as db:
            try:
                db.execute("BEGIN")
                for table in (
                    "circle_events", "member_locations", "tracked_devices", "saved_places", "circle_invites",
                    "travel_group_members", "travel_groups", "saved_tourist_spots", "travel_collections",
                    "notification_preferences", "meetup_requests", "tracking_sessions", "routes", "pins", "user_maps",
                ):
                    db.execute(f"DELETE FROM {table}")
                map_ids = {row.get("map_id") for row in data.get("user_maps", [])}
                for row in data.get("user_maps", []):
                    self._ensure_user_tx(db, row.get("owner_id"), row.get("created_at"))
                    db.execute("INSERT OR REPLACE INTO user_maps VALUES(?,?,?,?,?,?,?,?,?,?)", (row["map_id"], row["owner_id"], row.get("creator_id") or row["owner_id"], row["title"], row.get("description", ""), row.get("scope", "private"), int(bool(row.get("is_default"))), _csv(row.get("group_ids")), row["created_at"], row["updated_at"]))
                for row in data.get("pins", []):
                    self._ensure_user_tx(db, row.get("creator_id"), row.get("created_at"))
                    coord = row.get("coordinate") or {}
                    map_id = row.get("map_id") if row.get("map_id") in map_ids else None
                    db.execute(
                        """
                        INSERT OR REPLACE INTO pins(
                            pin_id,post_id,map_id,creator_id,title,note,lat,lon,address,scope,source,group_ids,media,photos,created_at,updated_at
                        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                        """,
                        (
                            row["pin_id"],
                            row.get("post_id") or row["pin_id"],
                            map_id,
                            row["creator_id"],
                            row.get("title", "Untitled"),
                            row.get("note", ""),
                            coord.get("lat", 0),
                            coord.get("lon", 0),
                            row.get("address", ""),
                            row.get("scope", "private"),
                            row.get("source", "manual"),
                            _csv(row.get("group_ids")),
                            _json(row.get("media")) if row.get("media") is not None else None,
                            _json(row.get("photos", [])),
                            row["created_at"],
                            row["updated_at"],
                        ),
                    )
                for row in data.get("routes", []):
                    self._ensure_user_tx(db, row.get("creator_id"), row.get("created_at"))
                    db.execute("INSERT OR REPLACE INTO routes VALUES(?,?,?,?,?,?,?,?,?,?)", (row["record_id"], row.get("route_id", ""), row.get("session_id", ""), row["creator_id"], row.get("scope", "private"), row.get("engine", "osrm"), _json(row.get("route", {})), _csv(row.get("group_ids")), row["created_at"], row["updated_at"]))
                for row in data.get("tracking_sessions", []):
                    user_id = row.get("user_id") or row.get("creator_id") or "demo-user"
                    self._ensure_user_tx(db, user_id, row.get("created_at"))
                    db.execute("INSERT OR REPLACE INTO tracking_sessions VALUES(?,?,?,?,?,?,?,?,?)", (row["session_id"], user_id, row.get("route_id"), row.get("scope", "private"), row.get("status", "active"), _json(row.get("last_location")) if row.get("last_location") is not None else None, _csv(row.get("group_ids")), row["created_at"], row["updated_at"]))
                for row in data.get("meetup_requests", []):
                    self._ensure_user_tx(db, row.get("creator_id"), row.get("created_at"))
                    db.execute("INSERT OR REPLACE INTO meetup_requests VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", (row["request_id"], row["creator_id"], row.get("map_id") if row.get("map_id") in map_ids else None, row.get("scope", "private"), _csv(row.get("group_ids")), _json(row.get("participants", [])), _json(row.get("fair_region", {})), _json(row.get("midpoint", {})), _json(row.get("suggestions", [])), _json(row.get("fallback_strategy", [])), _json(row.get("scoring_weights", {})), row["created_at"], row["updated_at"]))
                for row in data.get("circles", []):
                    self._ensure_user_tx(db, row.get("owner_id"), row.get("created_at"))
                    db.execute("INSERT OR REPLACE INTO travel_groups VALUES(?,?,?,?,?,?)", (row["circle_id"], row.get("group_id") or row["circle_id"], row["name"], row["owner_id"], row["created_at"], row["updated_at"]))
                    for member in row.get("members", []):
                        db.execute("INSERT OR REPLACE INTO travel_group_members VALUES(?,?,?,?,?,?,?,?,?)", (row["circle_id"], member["user_id"], member.get("display_name") or member["user_id"], member.get("role", "Other"), member.get("phone", ""), member.get("avatar", ""), int(bool(member.get("admin"))), int(bool(member.get("location_sharing_enabled", True))), member.get("joined_at") or row["created_at"]))
                for row in data.get("circle_invites", []):
                    db.execute("INSERT OR REPLACE INTO circle_invites VALUES(?,?,?,?,?,?,?,?)", (row["invite_id"], row["circle_id"], row["code"], row["created_by"], row["created_at"], row["expires_at"], int(row.get("uses") or 0), int(bool(row.get("expired")))))
                for row in data.get("saved_places", []):
                    coord = row.get("coordinate") or {}
                    db.execute("INSERT OR REPLACE INTO saved_places VALUES(?,?,?,?,?,?,?,?,?,?)", (row["place_id"], row["circle_id"], row["creator_id"], row["name"], row["label"], coord.get("lat", 0), coord.get("lon", 0), int(row.get("radius_m") or 180), row["created_at"], row["updated_at"]))
                for row in data.get("tracked_devices", []):
                    db.execute("INSERT OR REPLACE INTO tracked_devices VALUES(?,?,?,?,?,?,?,?,?,?,?)", (row["device_id"], row["circle_id"], row["owner_id"], row["name"], row["kind"], row["status"], row.get("battery_percent"), row.get("last_seen"), _json(row.get("last_coordinate")) if row.get("last_coordinate") is not None else None, row["created_at"], row["updated_at"]))
                for row in data.get("member_locations", []):
                    db.execute("INSERT OR REPLACE INTO member_locations VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (row["circle_id"], row["user_id"], _json(row.get("coordinate")) if row.get("coordinate") is not None else None, row.get("accuracy_m"), row.get("activity", "stationary"), int(bool(row.get("sharing_enabled"))), row.get("visibility_scope", "travel_group"), row.get("event_id"), row.get("travel_group_id"), row.get("status_text", "Active now"), _json(row.get("inside_place_ids", [])), row["updated_at"]))
                for row in data.get("circle_events", []):
                    db.execute("INSERT OR REPLACE INTO circle_events VALUES(?,?,?,?,?,?,?,?)", (row["event_id"], row["circle_id"], row["user_id"], row["type"], row.get("place_id"), row["message"], _json(row.get("read_by", [])), row["created_at"]))
                for row in data.get("notification_preferences", []):
                    db.execute("INSERT OR REPLACE INTO notification_preferences VALUES(?,?,?,?,?,?,?)", (row["user_id"], int(bool(row.get("meetup_arrivals", True))), int(bool(row.get("destination_arrivals", True))), int(bool(row.get("check_ins", True))), int(bool(row.get("checkpoints", True))), int(bool(row.get("group_ride_start", True))), int(bool(row.get("event_arrivals", True)))))
                for row in data.get("travel_collections", []):
                    self._ensure_user_tx(db, row.get("owner_id"), row.get("created_at"))
                    db.execute("INSERT OR REPLACE INTO travel_collections VALUES(?,?,?,?,?,?)", (row["collection_id"], row["owner_id"], row["name"], row.get("description", ""), row["created_at"], row["updated_at"]))
                for row in data.get("saved_tourist_spots", []):
                    self._ensure_user_tx(db, row.get("saved_by"), row.get("saved_at"))
                    db.execute("INSERT OR REPLACE INTO saved_tourist_spots VALUES(?,?,?,?,?,?,?,?,?)", (row["place_id"], row["name"], row["latitude"], row["longitude"], row["category"], row["saved_by"], row["saved_at"], row.get("collection_id"), row.get("notes", "")))
                db.execute(
                    "INSERT INTO audit_log(actor_id,action,entity_type,entity_id,details) VALUES(?,?,?,?,?)",
                    (None, "state_sync", "database", str(self.path.name), _json({"tables": len(data)})),
                )
                db.commit()
            except Exception:
                db.rollback()
                raise

    @staticmethod
    def _ensure_user_tx(db: sqlite3.Connection, user_id: str | None, now: str | None) -> None:
        if not user_id:
            return
        stamp = now or ""
        db.execute(
            "INSERT OR IGNORE INTO users(user_id,email,password_hash,group_ids,created_at,updated_at) VALUES(?,?,?,?,?,?)",
            (user_id, f"{user_id}@local.travelplaces", "external-auth", "", stamp, stamp),
        )
