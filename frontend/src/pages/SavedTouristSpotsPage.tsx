import { useEffect, useMemo, useState } from "react";
import { Bookmark, MapPin, Plus, Search, Trash2 } from "lucide-react";
import { GatedPage } from "../components/GatedPage";
import { useAuth } from "../context/AuthContext";
import { WorkspaceButton } from "../components/workspace/WorkspaceButton";
import { WorkspaceSection } from "../components/workspace/WorkspaceSection";
import { fieldLabel, inputField, sectionCard, toggleGrid } from "../components/workspace/workspaceStyles";
import type { TouristCollection, TouristSpot } from "../services/mappingApi";
import { createTouristCollection, createTouristSpot, deleteTouristSpot, listTouristCollections, listTouristSpots, searchLocations } from "../services/mappingApi";

const categories = ["Beaches", "Mountains", "Waterfalls", "Restaurants", "Cafes", "Tourist Attractions", "Historical Sites", "National Parks", "Dive Sites", "Campsites", "Scenic Viewpoints"];

function SavedTouristSpotsContent() {
  const { user } = useAuth();
  const viewerId = user!.id;
  const [collections, setCollections] = useState<TouristCollection[]>([]);
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [collectionId, setCollectionId] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [newCollection, setNewCollection] = useState("");
  const [placeText, setPlaceText] = useState("");
  const [placeCategory, setPlaceCategory] = useState("Tourist Attractions");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [nextCollections, nextSpots] = await Promise.all([
      listTouristCollections(viewerId),
      listTouristSpots(viewerId, collectionId || null),
    ]);
    setCollections(nextCollections);
    setSpots(nextSpots);
  };

  useEffect(() => {
    void refresh().catch(() => setStatus("Saved tourist spots could not be loaded."));
  }, [collectionId]);

  const filtered = useMemo(() => spots.filter((spot) => {
    const textMatch = !query.trim() || `${spot.name} ${spot.category} ${spot.notes}`.toLowerCase().includes(query.trim().toLowerCase());
    const categoryMatch = !category || spot.category === category;
    return textMatch && categoryMatch;
  }), [category, query, spots]);

  const addCollection = async () => {
    if (!newCollection.trim()) return;
    setBusy(true);
    try {
      await createTouristCollection({ ownerId: viewerId, name: newCollection.trim() });
      setNewCollection("");
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Collection could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const savePlace = async () => {
    if (!placeText.trim()) return;
    setBusy(true);
    try {
      const matches = await searchLocations(placeText.trim(), 1);
      const location = matches[0];
      if (!location) throw new Error("Place not found.");
      await createTouristSpot({
        savedBy: viewerId,
        name: location.label.split(",")[0] || placeText.trim(),
        latitude: location.coordinate[0],
        longitude: location.coordinate[1],
        category: placeCategory,
        collectionId: collectionId || collections[0]?.collection_id || null,
        notes,
      });
      setPlaceText("");
      setNotes("");
      await refresh();
      setStatus("Tourist spot saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Tourist spot could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#F5F0E8] px-4 py-8 font-[var(--font-ui)] text-[#1A1A1A]">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[380px_1fr]">
        <aside className="space-y-6">
          <div>
            <p className="mb-2 font-[var(--font-label)] text-sm font-semibold uppercase tracking-[0.06em] text-[#7A9E6F]">Bookmarks</p>
            <h1 className="m-0 font-[var(--font-display)] text-4xl font-semibold text-[#2D4A2D]">Saved Tourist Spots</h1>
          </div>
          <WorkspaceSection title="Collections" icon={Bookmark}>
            <select value={collectionId} onChange={(event) => setCollectionId(event.target.value)} className={inputField}>
              <option value="">All collections</option>
              {collections.map((item) => <option key={item.collection_id} value={item.collection_id}>{item.name}</option>)}
            </select>
            <div className="mt-3 flex gap-2">
              <input value={newCollection} onChange={(event) => setNewCollection(event.target.value)} className={`${inputField} min-w-0 flex-1`} placeholder="New collection" />
              <button type="button" onClick={() => void addCollection()} className="min-h-12 rounded bg-[#2D4A2D] px-4 text-[#F5F0E8]" aria-label="Create collection"><Plus size={18} /></button>
            </div>
          </WorkspaceSection>
          <WorkspaceSection title="Save Place" icon={MapPin}>
            <div className="grid gap-3">
              <input value={placeText} onChange={(event) => setPlaceText(event.target.value)} className={inputField} placeholder="Search place to save" />
              <select value={placeCategory} onChange={(event) => setPlaceCategory(event.target.value)} className={inputField}>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${inputField} min-h-24 resize-none`} placeholder="Notes" />
              <WorkspaceButton variant="primary" icon={Bookmark} disabled={busy} onClick={() => void savePlace()}>Save Place</WorkspaceButton>
            </div>
          </WorkspaceSection>
          {status && <div className="rounded-lg border border-[#C4713A]/25 bg-[#C4713A]/10 p-4 text-sm text-[#8a4b26]">{status}</div>}
        </aside>
        <main className="space-y-6">
          <div className={sectionCard}>
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <label className="grid gap-2">
                <span className={fieldLabel}>Search saved places</span>
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B5A]" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputField} pl-10`} placeholder="Name, category, notes" />
                </div>
              </label>
              <label className="grid gap-2">
                <span className={fieldLabel}>Filter category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputField}>
                  <option value="">All categories</option>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((spot) => (
              <article key={spot.place_id} className={sectionCard}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2D4A2D]">{spot.name}</h2>
                    <p className="m-0 mt-1 text-sm text-[#6B6B5A]">{spot.category}</p>
                  </div>
                  <button type="button" onClick={() => void deleteTouristSpot(spot.place_id, viewerId).then(refresh)} className="rounded border border-[#C0392B]/20 p-2 text-[#C0392B]" aria-label="Unsave place"><Trash2 size={16} /></button>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#6B6B5A]">{spot.notes || "No notes yet."}</p>
                <div className={`${toggleGrid} mt-4 text-xs text-[#6B6B5A]`}>
                  <span>{spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}</span>
                  <span>{new Date(spot.saved_at).toLocaleDateString()}</span>
                </div>
              </article>
            ))}
            {!filtered.length && <div className={sectionCard}>No saved tourist spots match the current filters.</div>}
          </div>
        </main>
      </div>
    </section>
  );
}

export default function SavedTouristSpotsPage() {
  return <GatedPage featureName="Saved tourist spots"><SavedTouristSpotsContent /></GatedPage>;
}
