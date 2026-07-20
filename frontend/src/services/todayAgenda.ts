import type { ApiPin, MapScope } from "./mappingApi";
import { readLocalTable, writeLocalTable } from "./localDb";

export type TodayAgenda = {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  title: string;
  activity: string;
  placeName: string;
  coordinate: { lat: number; lon: number };
  scope: MapScope;
  groupIds: string[];
  createdAt: string;
  expiresAt: string;
};

const AGENDA_TTL_MS = 24 * 60 * 60 * 1000;

function nowMs() {
  return Date.now();
}

function isActiveAgenda(row: TodayAgenda, timestamp = nowMs()) {
  return new Date(row.expiresAt).getTime() > timestamp;
}

function cleanupExpiredAgendas(rows = readLocalTable<TodayAgenda>("todayAgendas")) {
  const active = rows.filter((row) => isActiveAgenda(row));
  if (active.length !== rows.length) writeLocalTable<TodayAgenda>("todayAgendas", active);
  return active;
}

export function listActiveTodayAgendas(viewerId: string, groupIds: string[] = [], scope?: MapScope): TodayAgenda[] {
  const active = cleanupExpiredAgendas();
  return active.filter((row) => {
    if (scope && row.scope !== scope) return false;
    if (row.scope === "public") return true;
    if (row.ownerId === viewerId) return true;
    if (row.scope === "group") return row.groupIds.some((groupId) => groupIds.includes(groupId));
    return false;
  });
}

export function createTodayAgenda(input: Omit<TodayAgenda, "id" | "createdAt" | "expiresAt">): TodayAgenda {
  const createdAt = new Date().toISOString();
  const agenda: TodayAgenda = {
    ...input,
    id: `agenda-${input.ownerId}-${Date.now()}`,
    createdAt,
    expiresAt: new Date(Date.now() + AGENDA_TTL_MS).toISOString(),
  };
  writeLocalTable<TodayAgenda>("todayAgendas", [agenda, ...cleanupExpiredAgendas().filter((row) => row.id !== agenda.id)]);
  window.dispatchEvent(new CustomEvent("traveltraces:today-agenda-updated", { detail: { agendaId: agenda.id } }));
  return agenda;
}

export function agendaToPin(agenda: TodayAgenda): ApiPin {
  return {
    pin_id: agenda.id,
    post_id: agenda.id,
    title: agenda.title || agenda.activity,
    note: `${agenda.activity} at ${agenda.placeName}`,
    coordinate: agenda.coordinate,
    address: agenda.placeName,
    scope: agenda.scope,
    creator_id: agenda.ownerId,
    group_ids: agenda.groupIds,
    source: "gps",
    media: {
      agendaId: agenda.id,
      category: "Today's Agenda",
      ownerName: agenda.ownerName,
      ownerAvatar: agenda.ownerAvatar,
      expiresAt: agenda.expiresAt,
    },
    photos: [],
    map_id: null,
    created_at: agenda.createdAt,
    updated_at: agenda.createdAt,
  };
}
