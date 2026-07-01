import { useMemo, useState } from "react";
import { Bookmark, Clock, Compass, Gem, Heart, Landmark, MapPin, Mountain, Plus, Search, Trash2, TreePine, Utensils, Waves } from "lucide-react";
import { useNavigate } from "react-router";
import { GatedPage } from "../components/GatedPage";
import { LOCAL_STORIES_KEY, SAVED_STORIES_KEY, STORIES, STORY_COLLECTIONS_KEY, type TravelStory } from "./StoriesPage";

type StoryCollection = {
  id: string;
  name: string;
  storyIds: number[];
};

const categories = ["All", "Hiking", "Food Place", "Hidden Gems", "Beaches", "Forest", "Culture", "More"];
const categoryIcons: Record<string, typeof Compass> = {
  Hiking: Mountain,
  "Food Place": Utensils,
  "Hidden Gems": Gem,
  Beaches: Waves,
  Forest: TreePine,
  Culture: Landmark,
  More: Compass,
};

function readLocalStories(): TravelStory[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_STORIES_KEY) ?? "[]") as TravelStory[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readSavedStoryIds(): number[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_STORIES_KEY) ?? "[]") as number[];
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

function readCollections(): StoryCollection[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORY_COLLECTIONS_KEY) ?? "[]") as StoryCollection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedStoryIds(ids: number[]) {
  window.localStorage.setItem(SAVED_STORIES_KEY, JSON.stringify(Array.from(new Set(ids))));
}

function writeCollections(collections: StoryCollection[]) {
  window.localStorage.setItem(STORY_COLLECTIONS_KEY, JSON.stringify(collections));
}

function SavedStoryCard({
  story,
  collections,
  onOpen,
  onRemove,
  onAddToCollection,
}: {
  story: TravelStory;
  collections: StoryCollection[];
  onOpen: () => void;
  onRemove: () => void;
  onAddToCollection: (collectionId: string) => void;
}) {
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");

  return (
    <article className="overflow-hidden rounded bg-[#EDEAE0] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(58,42,34,0.12)]">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <img src={story.img} alt={story.title} className="h-48 w-full object-cover" />
        <div className="p-5">
          <span className="font-[var(--font-label)] text-[0.68rem] uppercase tracking-[0.1em] text-[#C4713A]">{story.category}</span>
          <h3 className="m-0 mt-2 font-[var(--font-display)] text-xl font-semibold leading-tight text-[#3A2A22]">{story.title}</h3>
          <p className="mb-4 mt-3 font-[var(--font-body)] text-sm leading-6 text-[#4A4A3A]">{story.excerpt.slice(0, 138)}...</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B6B5A]">
            <span className="inline-flex items-center gap-1"><MapPin size={12} />{story.region}</span>
            <span className="inline-flex items-center gap-1"><Clock size={12} />{story.readTime}</span>
            <span className="inline-flex items-center gap-1"><Heart size={12} />{story.likes}</span>
          </div>
        </div>
      </button>
      <div className="border-t border-[#3A2A22]/10 p-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={collectionId}
            onChange={(event) => setCollectionId(event.target.value)}
            className="min-h-10 flex-1 rounded-full border border-[#3A2A22]/15 bg-[#FBF7F0] px-3 text-sm text-[#3A2A22] outline-none"
          >
            <option value="">Choose collection</option>
            {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
          </select>
          <button
            type="button"
            disabled={!collectionId}
            onClick={() => onAddToCollection(collectionId)}
            className="min-h-10 rounded-full bg-[#3A2A22] px-4 text-xs font-bold uppercase tracking-[0.08em] text-[#F5F0E8] disabled:cursor-default disabled:bg-[#D8D4C8]"
          >
            Add
          </button>
          <button type="button" onClick={onRemove} className="grid min-h-10 min-w-10 place-items-center rounded-full border border-[#3A2A22]/15 text-[#9E6B5C] transition hover:bg-[#9E6B5C]/10" aria-label={`Remove ${story.title}`}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

function SavedStoriesContent() {
  const navigate = useNavigate();
  const [savedIds, setSavedIds] = useState<number[]>(() => readSavedStoryIds());
  const [collections, setCollections] = useState<StoryCollection[]>(() => readCollections());
  const [activeCollectionId, setActiveCollectionId] = useState("all");
  const [newCollection, setNewCollection] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const allStories = useMemo<TravelStory[]>(() => [...readLocalStories(), ...STORIES], []);
  const savedStories = allStories.filter((story) => savedIds.includes(story.id));
  const activeCollection = collections.find((collection) => collection.id === activeCollectionId) ?? null;
  const activeStories = activeCollection ? savedStories.filter((story) => activeCollection.storyIds.includes(story.id)) : savedStories;
  const filtered = activeStories.filter((story) => {
    const text = `${story.title} ${story.author} ${story.region} ${story.category}`.toLowerCase();
    const matchSearch = !query.trim() || text.includes(query.trim().toLowerCase());
    const matchCategory = category === "All" || story.category === category;
    return matchSearch && matchCategory;
  });

  const createCollection = () => {
    const name = newCollection.trim();
    if (!name) return;
    const collection: StoryCollection = { id: `story-collection-${Date.now()}`, name, storyIds: [] };
    const next = [collection, ...collections];
    setCollections(next);
    writeCollections(next);
    setActiveCollectionId(collection.id);
    setNewCollection("");
  };

  const removeSavedStory = (storyId: number) => {
    const nextSavedIds = savedIds.filter((id) => id !== storyId);
    const nextCollections = collections.map((collection) => ({ ...collection, storyIds: collection.storyIds.filter((id) => id !== storyId) }));
    setSavedIds(nextSavedIds);
    setCollections(nextCollections);
    writeSavedStoryIds(nextSavedIds);
    writeCollections(nextCollections);
  };

  const addToCollection = (storyId: number, collectionId: string) => {
    const next = collections.map((collection) => (
      collection.id === collectionId ? { ...collection, storyIds: Array.from(new Set([storyId, ...collection.storyIds])) } : collection
    ));
    setCollections(next);
    writeCollections(next);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] px-6 py-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-10">
          <p className="mb-2 font-[var(--font-label)] text-xs uppercase tracking-[0.15em] text-[#9E6B5C]">Saved library</p>
          <h1 className="m-0 font-[var(--font-display)] text-4xl font-semibold text-[#3A2A22]">Saved Stories</h1>
          <p className="mt-3 max-w-2xl font-[var(--font-body)] text-base leading-7 text-[#6B6B5A]">Keep the stories you want to revisit and sort them into personal collections.</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => setActiveCollectionId("all")} className={`min-h-11 rounded-full px-5 text-sm font-bold ${activeCollectionId === "all" ? "bg-[#3A2A22] text-[#F5F0E8]" : "border border-[#3A2A22]/15 text-[#3A2A22]"}`}>
            All saved
          </button>
          {collections.map((collection) => (
            <button key={collection.id} type="button" onClick={() => setActiveCollectionId(collection.id)} className={`min-h-11 rounded-full px-5 text-sm font-bold ${activeCollectionId === collection.id ? "bg-[#3A2A22] text-[#F5F0E8]" : "border border-[#3A2A22]/15 text-[#3A2A22]"}`}>
              {collection.name}
            </button>
          ))}
          <div className="flex min-w-[260px] flex-1 gap-2 sm:flex-none">
            <input value={newCollection} onChange={(event) => setNewCollection(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-full border border-[#3A2A22]/15 bg-[#FBF7F0] px-4 text-sm text-[#1A1A1A] outline-none" placeholder="New story collection" />
            <button type="button" onClick={createCollection} className="grid min-h-11 min-w-11 place-items-center rounded-full bg-[#3A2A22] text-[#F5F0E8]" aria-label="Create collection"><Plus size={18} /></button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative flex-[1_1_260px]">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5A50]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved stories..." className="min-h-11 w-full rounded border border-[#3A2A22]/15 bg-[#EFE7DC] pl-10 pr-4 text-sm text-[#2C211C] outline-none" />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => {
              const Icon = categoryIcons[item] ?? Compass;
              const active = category === item;
              const isAll = item === "All";
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className="category-pill inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition"
                  style={{
                    borderColor: active ? "#3A2A22" : "rgba(58,42,34,0.2)",
                    backgroundColor: active ? "#3A2A22" : "transparent",
                    color: active ? "#F5F0E8" : "#3A2A22",
                    paddingInline: isAll ? 24 : 16,
                  }}
                  aria-pressed={active}
                >
                  {!isAll && <Icon size={14} color={active ? "#F5F0E8" : "#9E6B5C"} />}
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#6B6B5A]">
          <Bookmark size={16} className="text-[#C4713A]" />
          <span>{filtered.length} saved stor{filtered.length === 1 ? "y" : "ies"}</span>
        </div>

        {filtered.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-6">
            {filtered.map((story) => (
              <div key={story.id}>
                <SavedStoryCard
                  story={story}
                  collections={collections}
                  onOpen={() => {
                    void navigate(`/stories?${story.local ? "localStory" : "story"}=${story.id}`);
                  }}
                  onRemove={() => removeSavedStory(story.id)}
                  onAddToCollection={(collectionId) => addToCollection(story.id, collectionId)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded bg-[#EDEAE0] p-8 text-center text-[#6B6B5A]">
            Saved stories will appear here after you press Save inside a story.
          </div>
        )}
      </div>

      <style>{`
        .category-pill:hover { background-color: rgba(58,42,34,0.08) !important; border-color: #3A2A22 !important; color: #3A2A22 !important; }
        .category-pill[aria-pressed="true"]:hover { background-color: #3A2A22 !important; border-color: #3A2A22 !important; color: #F5F0E8 !important; }
      `}</style>
    </div>
  );
}

export default function SavedTouristSpotsPage() {
  return <GatedPage featureName="Saved stories"><SavedStoriesContent /></GatedPage>;
}
