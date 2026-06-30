import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { createHostedTourMeetup, type HostedTourMeetupRecord } from "../services/eventsApi";

export type HostTourPlace = {
  location_id: number;
  title: string;
  province: string;
  imageUrl: string;
};

type HostTourMeetupFormProps = {
  places: HostTourPlace[];
  onClose: () => void;
  onCreated: (record: HostedTourMeetupRecord) => void;
};

const field =
  "min-h-12 w-full rounded border border-[#12212E]/20 bg-[#ECE7DC] px-3 py-2 text-sm text-[#12212E] outline-none transition focus:border-[#12212E] focus:ring-2 focus:ring-[#6CA3A2]/30";
const label = "mb-2 block font-[var(--font-label)] text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[#12212E]";

export function HostTourMeetupForm({ places, onClose, onCreated }: HostTourMeetupFormProps) {
  const { user, openAuthModal } = useAuth();
  const [title, setTitle] = useState("");
  const [locationId, setLocationId] = useState(places[0]?.location_id ?? 1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [license, setLicense] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !date || !time || !meetingPoint.trim()) {
      setError("Please complete all required fields.");
      return;
    }
    if (isPaid && Number(price) < 0) {
      setError("Price must be zero or higher.");
      return;
    }
    if (!user) {
      setError("Please sign in first before scheduling tours.");
      openAuthModal("login");
      return;
    }

    const selectedPlace = places.find((place) => place.location_id === locationId) ?? places[0];
    if (!selectedPlace) {
      setError("Choose a target destination.");
      return;
    }

    const record = createHostedTourMeetup({
      organizerId: user.id,
      organizerName: user.name,
      locationId,
      destinationTitle: selectedPlace.title,
      province: selectedPlace.province,
      imageUrl: selectedPlace.imageUrl,
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      isPaid,
      price: isPaid ? Number(price) || 0 : 0,
      meetingPoint: meetingPoint.trim(),
      tourGuideLicense: license.trim(),
    });
    onCreated(record);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-[#12212E]/70 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-[640px] overflow-auto rounded-lg bg-[#ECE7DC] p-6 text-[#12212E] shadow-[0_24px_64px_rgba(0,0,0,0.3)] sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="m-0 font-[var(--font-display)] text-2xl font-semibold text-[#12212E]">Host Tour Meetup</h2>
          <button type="button" onClick={onClose} className="grid min-h-10 min-w-10 place-items-center rounded-full text-[#6B6B5A] transition hover:bg-[#12212E]/5" aria-label="Close host tour meetup form">
            <X size={20} />
          </button>
        </div>

        {error ? <p className="mb-4 rounded border border-[#C0392B]/25 bg-[#C0392B]/10 px-3 py-2 text-sm text-[#9B2D22]" role="alert">{error}</p> : null}

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <label className={label} htmlFor="host-tour-title">Meetup Expedition Title</label>
            <input id="host-tour-title" type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Batanes Island Sunrise Excursion" className={field} required />
          </div>

          <div>
            <label className={label} htmlFor="host-tour-destination">Target Destination</label>
            <select id="host-tour-destination" value={locationId} onChange={(event) => setLocationId(Number(event.target.value))} className={field}>
              {places.map((place) => (
                <option key={place.location_id} value={place.location_id}>
                  {place.title} ({place.province})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="host-tour-date">Date</label>
              <input id="host-tour-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className={field} required />
            </div>
            <div>
              <label className={label} htmlFor="host-tour-time">Meeting Time</label>
              <input id="host-tour-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} className={field} required />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex min-h-12 items-center gap-3 pt-5 text-sm font-semibold text-[#12212E]">
              <input type="checkbox" checked={isPaid} onChange={(event) => setIsPaid(event.target.checked)} className="h-[18px] w-[18px]" />
              Ticketed/Paid Tour
            </label>
            {isPaid ? (
              <div>
                <label className={label} htmlFor="host-tour-price">Price (PHP)</label>
                <input id="host-tour-price" type="number" min={0} value={price} onChange={(event) => setPrice(event.target.value)} className={field} />
              </div>
            ) : null}
          </div>

          <div>
            <label className={label} htmlFor="host-tour-meeting-point">Meetup Rendezvous / Meeting Point</label>
            <input id="host-tour-meeting-point" type="text" value={meetingPoint} onChange={(event) => setMeetingPoint(event.target.value)} placeholder="e.g. Basco Lighthouse Steps" className={field} required />
          </div>

          <div>
            <label className={label} htmlFor="host-tour-license">DOT Tour Guide License Number (Optional but Audited)</label>
            <input id="host-tour-license" type="text" value={license} onChange={(event) => setLicense(event.target.value)} placeholder="e.g. DOT-REG-02-2026-891" className={field} />
          </div>

          <div>
            <label className={label} htmlFor="host-tour-details">Schedule and Tour Details</label>
            <textarea id="host-tour-details" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="List daily details, gear recommendations, and other guidelines of the tour itinerary..." rows={4} className={`${field} resize-y`} required />
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="min-h-11 rounded border border-[#12212E]/30 px-5 font-[var(--font-label)] text-xs font-semibold text-[#12212E] transition hover:bg-[#12212E]/5">
              Cancel
            </button>
            <button type="submit" className="min-h-11 rounded bg-[#12212E] px-5 font-[var(--font-label)] text-xs font-bold text-[#ECE7DC] transition hover:bg-[#1c3244]">
              Schedule Meetup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
