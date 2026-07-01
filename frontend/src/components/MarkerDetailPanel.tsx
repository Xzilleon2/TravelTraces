import { X } from "lucide-react";
import type { ApiPin } from "../services/mappingApi";
import { photosFromPin } from "../utils/photoPinHelpers";

type Props = {
  pin: ApiPin | null;
  creatorName?: string;
  onClose: () => void;
};

export function MarkerDetailPanel({ pin, creatorName, onClose }: Props) {
  if (!pin) return null;
  const photos = photosFromPin(pin);
  const storyId = typeof pin.media?.storyId === "number" ? pin.media.storyId : null;

  return (
    <div className="absolute left-3 right-3 top-20 z-20 w-auto overflow-hidden rounded border border-[#3A2A22]/15 bg-[#F5F0E8]/97 shadow-xl backdrop-blur sm:left-auto sm:right-4 sm:w-[min(calc(100%-2rem),320px)]">
      <div className="flex items-center justify-between border-b border-[#3A2A22]/10 px-4 py-3">
        <h3 className="m-0 font-[var(--font-display)] text-lg text-[#3A2A22]">{pin.title}</h3>
        <button type="button" onClick={onClose} className="rounded bg-[#EDEAE0] p-1.5 text-[#3A2A22]">
          <X size={16} />
        </button>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto p-4">
        {photos[0] && (
          <img src={photos[0].preview_url} alt={pin.title} className="h-40 w-full rounded object-cover" />
        )}
        {photos.length > 1 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(1).map((photo) => (
              <img key={photo.preview_url} src={photo.thumbnail_url ?? photo.preview_url} alt="" className="h-20 w-full rounded object-cover" />
            ))}
          </div>
        )}
        {pin.note && <p className="m-0 text-sm leading-6 text-[#1A1A1A]">{pin.note}</p>}
        {storyId ? (
          <a
            href={`/stories?story=${storyId}`}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#3A2A22] px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.1em] text-[#FBF7F0] transition hover:bg-[#4B352A]"
          >
            Open full story
          </a>
        ) : null}
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="font-[var(--font-label)] text-[0.68rem] uppercase tracking-[0.08em] text-[#6B6B5A]">Date</dt>
            <dd className="m-0 text-[#1A1A1A]">{new Date(pin.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="font-[var(--font-label)] text-[0.68rem] uppercase tracking-[0.08em] text-[#6B6B5A]">Address</dt>
            <dd className="m-0 text-[#1A1A1A]">{pin.address || "Reverse-geocoded location"}</dd>
          </div>
          <div>
            <dt className="font-[var(--font-label)] text-[0.68rem] uppercase tracking-[0.08em] text-[#6B6B5A]">Location</dt>
            <dd className="m-0 text-[#1A1A1A]">
              {pin.coordinate.lat.toFixed(5)}, {pin.coordinate.lon.toFixed(5)}
            </dd>
          </div>
          <div>
            <dt className="font-[var(--font-label)] text-[0.68rem] uppercase tracking-[0.08em] text-[#6B6B5A]">Creator</dt>
            <dd className="m-0 text-[#1A1A1A]">{creatorName ?? pin.creator_id}</dd>
          </div>
          <div>
            <dt className="font-[var(--font-label)] text-[0.68rem] uppercase tracking-[0.08em] text-[#6B6B5A]">Visibility</dt>
            <dd className="m-0 capitalize text-[#1A1A1A]">{pin.scope}</dd>
          </div>
        </dl>
        <p className="m-0 text-xs text-[#6B6B5A]">Comments — coming soon</p>
      </div>
    </div>
  );
}
