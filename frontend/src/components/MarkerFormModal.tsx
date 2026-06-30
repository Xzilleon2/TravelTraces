import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, MapPin, X } from "lucide-react";
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
  onClose: () => void;
  onSave: (input: {
    title: string;
    description: string;
    photos: PendingMarkerPhoto[];
    source: "manual" | "exif" | "gps";
  }) => Promise<void>;
  busy?: boolean;
};

export function MarkerFormModal({ open, location, scope, onClose, onSave, busy }: Props) {
  const [title, setTitle] = useState("Travel memory");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<PendingMarkerPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTitle("Travel memory");
      setDescription("");
      setPhotos([]);
      setError(null);
    }
  }, [open, location?.coordinate.join(",")]);

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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(26,26,26,0.55)] p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-[#F5F0E8] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2D4A2D]/10 bg-[#2D4A2D] px-5 py-4 text-[#F5F0E8]">
          <div>
            <p className="m-0 font-[var(--font-label)] text-xs uppercase tracking-[0.12em] text-[#F5F0E8]/75">Drop Marker</p>
            <h3 className="m-0 mt-1 font-[var(--font-display)] text-2xl">Create Travel Post</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-[#F5F0E8]/10 p-2">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded bg-[#EDEAE0] p-3 text-sm text-[#6B6B5A]">
            <span className="block font-semibold text-[#2D4A2D]">{location.label}</span>
            <span className="mt-1 block">
              {location.coordinate[0].toFixed(5)}, {location.coordinate[1].toFixed(5)} · {scope} map
            </span>
          </div>

          <label className="grid gap-2">
            <span className="font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#2D4A2D]">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="min-h-11 rounded border border-[#2D4A2D]/15 bg-white px-3 text-sm outline-none focus:border-[#2D4A2D]"
            />
          </label>

          <label className="grid gap-2">
            <span className="font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#2D4A2D]">Travel Notes</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="resize-none rounded border border-[#2D4A2D]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#2D4A2D]"
              placeholder="What happened here?"
            />
          </label>

          <div>
            <span className="mb-2 block font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#2D4A2D]">Photos</span>
            <div className="grid grid-cols-2 gap-2">
              <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded bg-[#5C8A9E] px-3 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F0E8]">
                <ImagePlus size={15} />
                Upload
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => void handleFiles(event.target.files)} />
              </label>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#2D4A2D]/20 bg-[#F5F0E8] px-3 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#2D4A2D]"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={15} />
                Add More
              </button>
            </div>
            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <div key={photo.previewUrl} className="relative">
                    <img src={photo.previewUrl} alt="" className="h-20 w-full rounded border border-[#2D4A2D]/15 object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos((current) => current.filter((item) => item.previewUrl !== photo.previewUrl))}
                      className="absolute right-1 top-1 rounded bg-[#1A1A1A]/75 p-1 text-white"
                      aria-label="Remove photo"
                    >
                      <X size={12} />
                    </button>
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
                title: title.trim(),
                description: description.trim(),
                photos,
                source: photos.some((item) => item.source === "exif") ? "exif" : photos.some((item) => item.source === "gps") ? "gps" : "manual",
              })
            }
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded bg-[#C4713A] px-4 font-[var(--font-label)] text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F0E8] disabled:opacity-60"
          >
            <MapPin size={15} />
            Save Marker
          </button>
        </div>
      </div>
    </div>
  );
}
