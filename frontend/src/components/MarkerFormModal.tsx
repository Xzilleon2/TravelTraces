import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, MapPin, X } from "lucide-react";
import { DraggablePhotoFrame } from "./DraggablePhotoFrame";
import { ImageCropDialog } from "./ImageCropDialog";
import type { ConnectionProfile } from "../context/AuthContext";
import type { ApiLocation, MapScope } from "../services/mappingApi";
import {
  ALLOWED_MARKER_IMAGE_TYPES,
  MAX_MARKER_IMAGE_BYTES,
  buildPhotoAttachment,
  extractPhotoLocation,
  fileToDataUrl,
  type PendingMarkerPhoto,
} from "../utils/photoPinHelpers";

type Props = {
  open: boolean;
  location: ApiLocation | null;
  scope: MapScope;
  friends?: ConnectionProfile[];
  onScopeChange?: (scope: MapScope) => void;
  onClose: () => void;
  onSave: (input: {
    placeName: string;
    title: string;
    subtitle: string;
    description: string;
    category: string;
    scope: MapScope;
    photos: PendingMarkerPhoto[];
    collaboratorIds: string[];
    source: "manual" | "exif" | "gps";
  }) => Promise<void>;
  busy?: boolean;
};

const markerCategories = ["Hiking", "Food Place", "Hidden Gems", "Beaches", "Forest", "Culture", "More"];
const mapScopes: Array<{ value: MapScope; label: string }> = [
  { value: "private", label: "Private Map" },
  { value: "public", label: "Public Map" },
  { value: "group", label: "Collab Map" },
];

export function MarkerFormModal({ open, location, scope, friends = [], onScopeChange, onClose, onSave, busy }: Props) {
  const [placeName, setPlaceName] = useState("");
  const [title, setTitle] = useState("Travel memory");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Hidden Gems");
  const [selectedScope, setSelectedScope] = useState<MapScope>(scope);
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [photos, setPhotos] = useState<PendingMarkerPhoto[]>([]);
  const [cropPreviewUrl, setCropPreviewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const latitude = Number.isFinite(location?.coordinate[0]) ? location?.coordinate[0] ?? 0 : 0;
  const longitude = Number.isFinite(location?.coordinate[1]) ? location?.coordinate[1] ?? 0 : 0;
  const coordinateKey = `${latitude},${longitude}`;

  useEffect(() => {
    if (!open) return;
    setPlaceName(location?.label ?? "");
    setTitle("Travel memory");
    setSubtitle("");
    setDescription("");
    setCategory("Hidden Gems");
    setSelectedScope(scope);
    setCollaboratorIds([]);
    setPhotos([]);
    setCropPreviewUrl("");
    setError(null);
  }, [coordinateKey, open, location?.label]);

  if (!open || !location) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const next: PendingMarkerPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!ALLOWED_MARKER_IMAGE_TYPES.has(file.type)) {
        setError("Only JPG, JPEG, PNG, and WEBP photos are allowed.");
        continue;
      }
      if (file.size > MAX_MARKER_IMAGE_BYTES) {
        setError("Each photo must be 3 MB or smaller.");
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      const { source } = await extractPhotoLocation(file);
      const dataUrl = await fileToDataUrl(file);
      next.push({
        file,
        previewUrl,
        source,
        attachment: buildPhotoAttachment(file, previewUrl, dataUrl, source === "exif" ? "exif" : source === "gps" ? "gps" : "upload"),
      });
    }
    setPhotos((current) => [...current, ...next]);
  };

  const updatePhotoPosition = (previewUrl: string, position: { x: number; y: number }) => {
    setPhotos((current) =>
      current.map((photo) =>
        photo.previewUrl === previewUrl
          ? {
              ...photo,
              attachment: {
                ...photo.attachment,
                object_position: `${position.x}% ${position.y}%`,
                photoPositionX: position.x,
                photoPositionY: position.y,
              },
            }
          : photo,
      ),
    );
  };

  const applyPhotoCrop = (previewUrl: string, result: { dataUrl: string; x: number; y: number }) => {
    setPhotos((current) =>
      current.map((photo) =>
        photo.previewUrl === previewUrl
          ? {
              ...photo,
              previewUrl: result.dataUrl,
              attachment: {
                ...photo.attachment,
                data_url: result.dataUrl,
                preview_url: result.dataUrl,
                thumbnail_url: result.dataUrl,
                object_position: `${result.x}% ${result.y}%`,
                photoPositionX: result.x,
                photoPositionY: result.y,
              },
            }
          : photo,
      ),
    );
    setCropPreviewUrl("");
  };

  return (
    <div className="absolute inset-x-3 bottom-28 top-20 z-40 overflow-y-auto rounded-xl border border-[#3A2A22]/12 bg-[#F5F0E8] text-[#1A1A1A] shadow-[0_20px_45px_rgba(27,37,38,0.22)] sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:max-h-[calc(100%-7rem)] sm:w-[min(24rem,calc(100%-2rem))]">
      <ImageCropDialog
        open={Boolean(cropPreviewUrl)}
        src={cropPreviewUrl}
        title="Crop marker photo"
        aspect={16 / 9}
        onCancel={() => setCropPreviewUrl("")}
        onSave={(result) => applyPhotoCrop(cropPreviewUrl, result)}
      />
      <div className="flex items-center justify-between border-b border-[#3A2A22]/10 bg-[#3A2A22] px-5 py-4 text-[#F5F0E8]">
        <div>
          <p className="m-0 font-[var(--font-label)] text-xs uppercase tracking-[0.12em] text-[#F5F0E8]/75">Drop Marker</p>
          <h3 className="m-0 mt-1 font-[var(--font-display)] text-2xl">Create Travel Post</h3>
        </div>

        {selectedScope === "group" ? (
          <div className="rounded-lg border border-[#3A2A22]/12 bg-white p-3">
            <span className="mb-2 block font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#3A2A22]">Collaborators</span>
            {friends.length ? (
              <div className="grid gap-2">
                {friends.map((friend) => {
                  const selected = collaboratorIds.includes(friend.id);
                  return (
                    <label key={friend.id} className="flex cursor-pointer items-center gap-3 rounded border border-[#3A2A22]/10 bg-[#F5F0E8] p-2 text-sm text-[#3A2A22]">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) =>
                          setCollaboratorIds((current) =>
                            event.target.checked ? [...new Set([...current, friend.id])] : current.filter((id) => id !== friend.id),
                          )
                        }
                      />
                      <span className="font-semibold">{friend.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="m-0 text-sm leading-6 text-[#6B5A50]">Add friends first before creating a Collab Map post.</p>
            )}
          </div>
        ) : null}
        <button type="button" onClick={onClose} className="rounded-full bg-[#F5F0E8]/10 p-2" aria-label="Close marker form">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded bg-[#EDEAE0] p-3 text-sm text-[#6B6B5A]">
          <span className="block font-semibold text-[#3A2A22]">{placeName || location.label || "Selected place"}</span>
          <span className="mt-1 block">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        </div>

        <div>
          <span className="mb-2 block font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#3A2A22]">Post map</span>
          <div className="grid grid-cols-3 gap-2">
            {mapScopes.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSelectedScope(option.value);
                  onScopeChange?.(option.value);
                }}
                className={`min-h-10 rounded border px-2 text-[0.66rem] font-bold uppercase tracking-[0.04em] transition ${
                  selectedScope === option.value ? "border-[#3A2A22] bg-[#3A2A22] text-[#F5F0E8]" : "border-[#3A2A22]/15 bg-[#F5F0E8] text-[#3A2A22]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="grid gap-2">
          <span className="font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#3A2A22]">Place name</span>
          <input
            value={placeName}
            onChange={(event) => setPlaceName(event.target.value)}
            className="min-h-11 rounded border border-[#3A2A22]/15 bg-white px-3 text-sm outline-none focus:border-[#3A2A22]"
            placeholder="Name of the place"
          />
        </label>

        <div>
          <span className="mb-2 block font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#3A2A22]">Category</span>
          <div className="flex flex-wrap gap-2">
            {markerCategories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition ${
                  category === item ? "border-[#C4713A] bg-[#C4713A] text-[#F5F0E8]" : "border-[#3A2A22]/15 bg-white text-[#3A2A22]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <label className="grid gap-2">
          <span className="font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#3A2A22]">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="min-h-11 rounded border border-[#3A2A22]/15 bg-white px-3 text-sm outline-none focus:border-[#3A2A22]"
          />
        </label>

        <label className="grid gap-2">
          <span className="font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#3A2A22]">Subtitle</span>
          <input
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            className="min-h-11 rounded border border-[#3A2A22]/15 bg-white px-3 text-sm outline-none focus:border-[#3A2A22]"
            placeholder="A short summary shown under the title"
          />
        </label>

        <label className="grid gap-2">
          <span className="font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#3A2A22]">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            className="resize-none rounded border border-[#3A2A22]/15 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-[#3A2A22]"
            placeholder="Write the story, memory, warning, tip, or moment from this place."
          />
        </label>

        <div>
          <span className="mb-2 block font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#3A2A22]">Photos</span>
          <div className="grid grid-cols-2 gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded bg-[#5C8A9E] px-3 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F0E8]">
              <ImagePlus size={15} />
              Upload
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => void handleFiles(event.target.files)} />
            </label>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#3A2A22]/20 bg-[#F5F0E8] px-3 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#3A2A22]"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={15} />
              Add More
            </button>
          </div>
          {photos.length > 0 && (
            <div className="mt-3 grid gap-3">
              {photos.map((photo) => (
                <div key={photo.previewUrl} className="rounded-lg border border-[#3A2A22]/12 bg-white p-2">
                  <div className="relative">
                    <DraggablePhotoFrame
                      src={photo.previewUrl}
                      alt=""
                      x={photo.attachment.photoPositionX ?? 50}
                      y={photo.attachment.photoPositionY ?? 50}
                      onPositionChange={(position) => updatePhotoPosition(photo.previewUrl, position)}
                      onEdit={() => setCropPreviewUrl(photo.previewUrl)}
                      className="h-28 w-full overflow-hidden rounded border border-[#3A2A22]/15"
                      imageClassName="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotos((current) => current.filter((item) => item.previewUrl !== photo.previewUrl))}
                      className="absolute right-1 top-1 rounded bg-[#1A1A1A]/75 p-1 text-white"
                      aria-label="Remove photo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <p className="m-0 mt-2 font-[var(--font-ui)] text-xs leading-5 text-[#6B5A50]">Drag the photo to choose which part appears in the card.</p>
                </div>
              ))}
            </div>
          )}
          {error && <div className="mt-3 rounded border border-[#C4713A]/25 bg-[#C4713A]/10 p-3 text-sm text-[#8a4b26]">{error}</div>}
        </div>

        <button
          type="button"
          disabled={busy || !title.trim()}
          onClick={() =>
            void onSave({
              placeName: placeName.trim() || location.label,
              title: title.trim(),
              subtitle: subtitle.trim(),
              description: description.trim(),
              category,
              scope: selectedScope,
              photos,
              collaboratorIds,
              source: photos.some((item) => item.source === "exif") ? "exif" : photos.some((item) => item.source === "gps") ? "gps" : "manual",
            })
          }
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded bg-[#C4713A] px-4 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F0E8] disabled:opacity-60"
        >
          <MapPin size={15} />
          Post Story
        </button>
      </div>
    </div>
  );
}
