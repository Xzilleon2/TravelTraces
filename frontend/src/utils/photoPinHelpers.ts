import * as exifr from "exifr";
import type { ApiLocation, ApiPin, MapScope } from "../services/mappingApi";

export type PhotoAttachment = {
  filename: string;
  mime_type: string;
  size_bytes: number;
  preview_url: string;
  thumbnail_url?: string;
  captured_at?: string;
  source: "upload" | "exif" | "gps" | "camera";
  data_url?: string;
};

export type PendingMarkerPhoto = {
  file: File;
  previewUrl: string;
  source: ApiPin["source"];
  attachment: PhotoAttachment;
};

export async function extractPhotoLocation(file: File): Promise<{ location: ApiLocation | null; source: ApiPin["source"] }> {
  try {
    const gps = (await exifr.gps(file)) as { latitude?: number; longitude?: number } | undefined;
    if (gps?.latitude && gps?.longitude) {
      return {
        source: "exif",
        location: {
          coordinate: [gps.latitude, gps.longitude],
          label: `${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}`,
          provider: "exif",
          confidence: 1,
        },
      };
    }
  } catch {
    // fall through
  }
  return { location: null, source: "manual" };
}

export const ALLOWED_MARKER_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
export const MAX_MARKER_IMAGE_BYTES = 3 * 1024 * 1024;

export function safeClientFilename(value: string) {
  const stem = value.split(/[\\/]/).pop() || "travel-photo";
  return stem.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 120) || "travel-photo";
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read photo."));
    reader.readAsDataURL(file);
  });
}

export function buildPhotoAttachment(file: File, previewUrl: string, dataUrl: string, source: PendingMarkerPhoto["attachment"]["source"]): PhotoAttachment {
  return {
    filename: safeClientFilename(file.name),
    mime_type: file.type || "image/jpeg",
    size_bytes: file.size,
    preview_url: previewUrl,
    thumbnail_url: previewUrl,
    captured_at: new Date().toISOString(),
    source,
    data_url: dataUrl,
  };
}

export function photosFromPin(pin: ApiPin): PhotoAttachment[] {
  if (pin.photos?.length) {
    return pin.photos as PhotoAttachment[];
  }
  if (pin.media && typeof pin.media.preview_url === "string") {
    return [
      {
        filename: String(pin.media.filename ?? "photo.jpg"),
        mime_type: String(pin.media.mime_type ?? "image/jpeg"),
        size_bytes: Number(pin.media.size_bytes ?? 0),
        preview_url: String(pin.media.preview_url),
        thumbnail_url: String(pin.media.thumbnail_url ?? pin.media.preview_url),
        source: pin.source === "exif" || pin.source === "gps" ? pin.source : "upload",
      },
    ];
  }
  return [];
}

export function primaryPhotoUrl(pin: ApiPin): string | null {
  const photos = photosFromPin(pin);
  return photos[0]?.thumbnail_url ?? photos[0]?.preview_url ?? null;
}

export type MarkerSaveInput = {
  title: string;
  description: string;
  lat: number;
  lon: number;
  scope: MapScope;
  creatorId: string;
  groupIds: string[];
  mapId?: string | null;
  address?: string;
  photos: PendingMarkerPhoto[];
  source: ApiPin["source"];
};

export function markerSavePayload(input: MarkerSaveInput) {
  const attachments = input.photos.map((item) => item.attachment);
  const source = input.photos.some((item) => item.source === "exif" || item.source === "gps")
    ? input.photos.find((item) => item.source === "exif" || item.source === "gps")!.source
    : input.source;

  return {
    title: input.title,
    note: input.description,
    lat: input.lat,
    lon: input.lon,
    scope: input.scope,
    creatorId: input.creatorId,
    groupIds: input.groupIds,
    mapId: input.mapId,
    address: input.address ?? "",
    source,
    media: attachments[0] ?? null,
    photos: attachments,
  };
}
