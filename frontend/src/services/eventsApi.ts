export type HostTourMeetupPayload = {
  organizerId: string;
  organizerName: string;
  locationId: number;
  destinationTitle: string;
  province: string;
  imageUrl: string;
  title: string;
  description: string;
  date: string;
  time: string;
  isPaid: boolean;
  price: number;
  meetingPoint: string;
  tourGuideLicense: string;
};

export type HostedTourMeetupRecord = HostTourMeetupPayload & {
  eventId: number;
  createdAt: string;
};

const HOSTED_TOURS_KEY = "travelplaces.hostedTourMeetups.v1";

function readStoredMeetups(): HostedTourMeetupRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HOSTED_TOURS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredMeetups(records: HostedTourMeetupRecord[]) {
  window.localStorage.setItem(HOSTED_TOURS_KEY, JSON.stringify(records));
}

export function listHostedTourMeetups(): HostedTourMeetupRecord[] {
  return readStoredMeetups();
}

export function createHostedTourMeetup(payload: HostTourMeetupPayload): HostedTourMeetupRecord {
  const record: HostedTourMeetupRecord = {
    ...payload,
    eventId: Date.now(),
    createdAt: new Date().toISOString(),
  };
  writeStoredMeetups([record, ...readStoredMeetups().filter((item) => item.eventId !== record.eventId)]);
  window.dispatchEvent(new CustomEvent("travelplaces:hosted-tour-created", { detail: record }));
  return record;
}
