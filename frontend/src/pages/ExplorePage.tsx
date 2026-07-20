import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Search, MapPin, Star, ArrowLeft, BookOpen, Pin, Users, Camera, Clock, ChevronLeft, ChevronRight, ExternalLink, Compass, Mountain, Waves, Building2, TreePine, Droplets, Anchor, Gem, Landmark, Utensils } from "lucide-react";
import { GatedPage } from "../components/GatedPage";
import { LargeEmptyState } from "../components/LargeEmptyState";
import { useAuth } from "../context/AuthContext";
import { GAMIFIED_USERS, getLevelFromXp } from "../components/gamification";
import { STORIES, StoryArticleView, type TravelStory } from "./StoriesPage";

/* ─── Data ─────────────────────────────────────────────────── */

type Destination = {
  id: number;
  name: string;
  region: string;
  province: string;
  terrain: string;
  coordinate: { lat: number; lon: number };
  rating: number;
  reviews: number;
  explorers: number;
  pins: number;
  img: string;
  gallery: string[];
  desc: string;
  longDesc: string;
  tags: string[];
  bestMonths: string;
  difficulty: string;
  highlights: string[];
  contributors: string[];
  stories: Array<{ title: string; author: string; authorKey: string; likes: number; date: string }>;
  color: string;
};

const DESTINATIONS: Destination[] = [];
const travelCategories = ["All", "Hiking", "Food Place", "Hidden Gems", "Beaches", "Forest", "Culture", "More"];

function formatCoordinates(coordinate: { lat: number; lon: number }): string {
  return `${coordinate.lat.toFixed(4)}, ${coordinate.lon.toFixed(4)}`;
}

const TERRAIN_ICON: Record<string, React.ElementType> = {
  All: Compass,
  Beaches: Waves,
  Mountains: Mountain,
  Highlands: TreePine,
  Urban: Building2,
  Waterfalls: Droplets,
  "Lakes & Rivers": Anchor,
  Forests: TreePine,
  Caves: Gem,
  "Heritage Sites": Landmark,
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  All: Compass,
  Hiking: Mountain,
  "Food Place": Utensils,
  "Hidden Gems": Gem,
  Beaches: Waves,
  Forest: TreePine,
  Culture: Landmark,
  More: Compass,
};

function destinationText(destination: Destination): string {
  return `${destination.name} ${destination.region} ${destination.province} ${destination.terrain} ${destination.tags.join(" ")} ${destination.highlights.join(" ")} ${destination.desc} ${destination.longDesc}`.toLowerCase();
}

function destinationMatchesCategory(destination: Destination, category: string): boolean {
  if (category === "All") return true;
  const text = destinationText(destination);
  if (category === "Hiking") return destination.terrain === "Mountains" || destination.terrain === "Highlands" || /mountain|trek|terrace|volcano|trail|hills|ridge/.test(text);
  if (category === "Food Place") return /food|cuisine|longganisa|bagnet|kare-kare|restaurant|market|meal|culinary/.test(text);
  if (category === "Hidden Gems") return /hidden|secret|cove|quiet|unspoiled|underrated|lesser-known/.test(text);
  if (category === "Beaches") return destination.terrain === "Islands" || /beach|island|lagoon|snorkel|diving|surf|bay/.test(text);
  if (category === "Forest") return /forest|nature|wildlife|tarsier|mangrove|springs|waterfall|falls/.test(text);
  if (category === "Culture") return destination.terrain === "Urban" || /heritage|unesco|culture|historic|stone houses|colonial|architecture|weaving|vigan|ivatan/.test(text);
  return !["Hiking", "Food Place", "Hidden Gems", "Beaches", "Forest", "Culture"].some((known) => destinationMatchesCategory(destination, known));
}

function destinationCategory(destination: Destination): string {
  if (destinationMatchesCategory(destination, "Food Place")) return "Food Place";
  if (destinationMatchesCategory(destination, "Culture")) return "Culture";
  if (destinationMatchesCategory(destination, "Hiking")) return "Hiking";
  if (destinationMatchesCategory(destination, "Forest")) return "Forest";
  if (destinationMatchesCategory(destination, "Hidden Gems")) return "Hidden Gems";
  if (destinationMatchesCategory(destination, "Beaches")) return "Beaches";
  return "More";
}

/* ─── Destination Guide View ──────────────────────────────── */

function DestinationGuideView({ dest, onBack }: { dest: Destination; onBack: () => void }) {
  const navigate = useNavigate();
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [selectedStory, setSelectedStory] = useState<TravelStory | null>(null);

  const allImages = [dest.img, ...dest.gallery];
  const category = destinationCategory(dest);
  const CategoryIcon = CATEGORY_ICON[category] ?? Compass;
  const linkedStories = dest.stories
    .map((storyRef) => STORIES.find((story) => story.title === storyRef.title))
    .filter((story): story is TravelStory => Boolean(story));
  const activeStoryIndex = selectedStory ? linkedStories.findIndex((story) => story.id === selectedStory.id) : -1;

  const handlePinThis = () => {
    window.localStorage.setItem(
      "traveltraces.pendingExplorePin",
      JSON.stringify({
        name: dest.name,
        province: dest.province,
        category,
        description: dest.desc,
        coordinate: dest.coordinate,
      }),
    );
    navigate("/maps");
  };

  if (selectedStory && activeStoryIndex >= 0) {
    return (
      <StoryArticleView
        story={linkedStories[activeStoryIndex]}
        onBack={() => setSelectedStory(null)}
        onPrev={() => {
          const previousStory = linkedStories[activeStoryIndex - 1];
          if (previousStory) setSelectedStory(previousStory);
        }}
        onNext={() => {
          const nextStory = linkedStories[activeStoryIndex + 1];
          if (nextStory) setSelectedStory(nextStory);
        }}
        hasPrev={activeStoryIndex > 0}
        hasNext={activeStoryIndex < linkedStories.length - 1}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FBF7F0", padding: "2rem clamp(1rem, 4vw, 2rem) 5rem" }}>
      <article style={{ width: "min(100%, 1120px)", margin: "0 auto", backgroundColor: "#FBF7F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
          <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", border: "1px solid rgba(58,42,34,0.18)", background: "transparent", color: "#3A2A22", borderRadius: "999px", padding: "0.55rem 1rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            <ArrowLeft size={15} /> Explore
          </button>
          <button onClick={handlePinThis} style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", minHeight: 42, border: "1px solid #3A2A22", borderRadius: "999px", backgroundColor: "#3A2A22", color: "#FBF7F0", padding: "0.55rem 1rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
            <Pin size={14} /> Pin This
          </button>
        </div>

        <header style={{ width: "min(100%, 820px)", margin: "0 auto 2rem", textAlign: "left" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.28rem 0.75rem", backgroundColor: "rgba(196,113,58,0.1)", border: "1px solid rgba(196,113,58,0.25)", borderRadius: "999px", fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#C4713A", marginBottom: "1rem" }}>
            <CategoryIcon size={13} /> {category}
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.45rem, 7vw, 5rem)", fontWeight: 600, color: "#1A1A1A", lineHeight: 0.98, letterSpacing: 0, marginBottom: "1rem" }}>{dest.name}</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(1.05rem, 2vw, 1.35rem)", lineHeight: 1.65, color: "#4A4A3A", margin: "0 0 1.35rem" }}>{dest.desc}</p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", borderTop: "1px solid rgba(58,42,34,0.14)", borderBottom: "1px solid rgba(58,42,34,0.14)", padding: "1rem 0", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#6B5A50", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem", fontFamily: "var(--font-ui)" }}><MapPin size={13} />{dest.province}, Philippines</span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem", fontFamily: "var(--font-ui)" }}><Compass size={13} />{formatCoordinates(dest.coordinate)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem", fontFamily: "var(--font-ui)" }}><Star size={13} />{dest.rating.toFixed(1)} rating</span>
              <span style={{ fontSize: "0.85rem", fontFamily: "var(--font-ui)" }}>{dest.bestMonths}</span>
            </div>
            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
              {dest.tags.slice(0, 3).map((tag) => (
                <span key={tag} style={{ padding: "0.32rem 0.65rem", backgroundColor: "#EFE7DC", border: "1px solid rgba(58,42,34,0.12)", borderRadius: "999px", fontFamily: "var(--font-label)", fontSize: "0.68rem", color: "#3A2A22" }}>{tag}</span>
              ))}
            </div>
          </div>
        </header>

        <figure style={{ position: "relative", margin: "0 0 2.5rem" }}>
          <img src={allImages[galleryIndex]} alt={`${dest.name} photo ${galleryIndex + 1}`} style={{ width: "100%", height: "clamp(300px, 58vw, 620px)", objectFit: "cover", display: "block", borderRadius: "0.35rem" }} />
          {allImages.length > 1 ? (
            <>
              <button aria-label="Previous photo" onClick={() => setGalleryIndex((i) => (i - 1 + allImages.length) % allImages.length)} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(58,42,34,0.5)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#FBF7F0" }}>
                <ChevronLeft size={20} />
              </button>
              <button aria-label="Next photo" onClick={() => setGalleryIndex((i) => (i + 1) % allImages.length)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(58,42,34,0.5)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#FBF7F0" }}>
                <ChevronRight size={20} />
              </button>
              <div style={{ position: "absolute", bottom: "1.1rem", right: "1.5rem", display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(26,26,26,0.45)", borderRadius: "999px", padding: "0.35rem 0.55rem" }}>
                {allImages.map((_, index) => (
                  <button key={index} aria-label={`Show photo ${index + 1}`} onClick={() => setGalleryIndex(index)} style={{ width: index === galleryIndex ? 18 : 7, height: 7, borderRadius: "999px", border: "none", backgroundColor: index === galleryIndex ? "#FBF7F0" : "rgba(251,247,240,0.45)", padding: 0, cursor: "pointer" }} />
                ))}
              </div>
            </>
          ) : null}
          <figcaption style={{ width: "min(100%, 820px)", margin: "0.75rem auto 0", fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "#6B6B5A" }}>
            Photo {galleryIndex + 1} of {allImages.length} from {dest.name}.
          </figcaption>
        </figure>

        <div style={{ width: "min(100%, 820px)", margin: "0 auto" }}>
          <section>
            <h3 style={{ fontFamily: "var(--font-label)", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E6B5C", marginBottom: "0.9rem" }}>Destination guide</h3>
            {dest.longDesc.split("\n\n").map((para, i) => (
              <p key={i} style={{ fontFamily: "var(--font-body)", fontSize: "clamp(1.05rem, 1.7vw, 1.2rem)", lineHeight: 1.85, color: "#1A1A1A", marginBottom: "1.45rem" }}>{para}</p>
            ))}
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.8rem", margin: "2rem 0" }}>
            {[
              { icon: Users, value: dest.explorers.toLocaleString(), label: "Explorers" },
              { icon: Pin, value: dest.pins.toLocaleString(), label: "Pins" },
              { icon: MapPin, value: formatCoordinates(dest.coordinate), label: "Coordinates" },
              { icon: BookOpen, value: dest.stories.length.toString(), label: "Stories" },
              { icon: Compass, value: dest.difficulty, label: "Difficulty" },
            ].map((stat) => (
              <div key={stat.label} style={{ backgroundColor: "#EFE7DC", border: "1px solid rgba(58,42,34,0.12)", borderRadius: "0.45rem", padding: "1rem" }}>
                <stat.icon size={17} color="#C4713A" />
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#3A2A22", marginTop: "0.5rem" }}>{stat.value}</div>
                <div style={{ fontFamily: "var(--font-label)", fontSize: "0.64rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A" }}>{stat.label}</div>
              </div>
            ))}
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 600, color: "#3A2A22", marginBottom: "1rem" }}>Highlights</h3>
            <div style={{ borderLeft: "2px solid rgba(196,113,58,0.35)", paddingLeft: "1rem" }}>
              {dest.highlights.map((highlight, index) => (
                <p key={highlight} style={{ margin: "0 0 0.9rem", fontFamily: "var(--font-ui)", color: "#4A4A3A", lineHeight: 1.6 }}><strong style={{ color: "#C4713A" }}>{index + 1}.</strong> {highlight}</p>
              ))}
            </div>
          </section>

          <section style={{ backgroundColor: "#EFE7DC", border: "1px solid rgba(58,42,34,0.12)", borderRadius: "0.45rem", padding: "1.25rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <BookOpen size={18} color="#3A2A22" />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 600, color: "#3A2A22", margin: 0 }}>Explorer Stories</h3>
            </div>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {dest.stories.map((storyRef, index) => {
                const linkedStory = STORIES.find((story) => story.title === storyRef.title);
                const gu = GAMIFIED_USERS[storyRef.authorKey];
                return (
                  <button key={index} type="button" onClick={() => linkedStory && setSelectedStory(linkedStory)} style={{ display: "flex", alignItems: "center", gap: "0.8rem", width: "100%", border: "1px solid rgba(58,42,34,0.1)", backgroundColor: "#FBF7F0", borderRadius: "0.45rem", padding: "0.85rem", textAlign: "left", cursor: linkedStory ? "pointer" : "default" }}>
                    {gu ? <img src={gu.avatar} alt={gu.name} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} /> : <BookOpen size={20} color="#9E6B5C" />}
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, color: "#3A2A22" }}>{storyRef.title}</span>
                      <span style={{ display: "block", marginTop: "0.2rem", fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "#6B6B5A" }}>{storyRef.author} / {storyRef.date} / {storyRef.likes} likes</span>
                    </span>
                    <ExternalLink size={14} color="#9A9A8A" />
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </article>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F0E8", padding: "2rem clamp(1rem, 4vw, 2rem) 5rem" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", background: "transparent", border: "none", color: "#3A2A22", fontFamily: "var(--font-ui)", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", padding: "0.25rem 0", marginBottom: "1.5rem" }}>
          <ArrowLeft size={17} />
          Back to Explore
        </button>

        <header style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "end", gap: "1.5rem", marginBottom: "1.5rem" }} className="dest-guide-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", backgroundColor: "#C4713A", color: "#F5F0E8", fontFamily: "var(--font-label)", fontSize: "0.7rem", fontWeight: 800, padding: "0.32rem 0.7rem", borderRadius: "0.25rem", letterSpacing: "0.09em", textTransform: "uppercase" }}>
                <CategoryIcon size={13} />
                {category}
              </span>
              <span style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#9E6B5C" }}>Visit guide</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.4rem, 7vw, 5.25rem)", fontWeight: 600, color: "#3A2A22", lineHeight: 0.95, margin: 0, maxWidth: 760 }}>{dest.name}</h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "#3A3A2A", lineHeight: 1.65, margin: "1rem 0 0", maxWidth: 760 }}>{dest.desc}</p>
            <button onClick={handlePinThis} style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", marginTop: "1.1rem", minHeight: 42, border: "1px solid #3A2A22", borderRadius: "999px", backgroundColor: "#3A2A22", color: "#FBF7F0", padding: "0.55rem 1rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
              <Pin size={14} /> Pin This
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(96px, 1fr))", gap: "0.65rem", minWidth: 230 }} className="dest-guide-stats">
            {[
              { label: "Rating", value: dest.rating.toFixed(1) },
              { label: "Reviews", value: dest.reviews.toLocaleString() },
              { label: "Best", value: dest.bestMonths },
              { label: "Level", value: dest.difficulty },
            ].map((item) => (
              <div key={item.label} style={{ backgroundColor: "#EDEAE0", border: "1px solid rgba(58,42,34,0.1)", borderRadius: "0.45rem", padding: "0.8rem" }}>
                <div style={{ fontFamily: "var(--font-label)", fontSize: "0.62rem", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6B6B5A" }}>{item.label}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 600, color: "#1A1A1A", marginTop: "0.2rem" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </header>

        {/* Hero photo carousel */}
        <div style={{ position: "relative", marginBottom: "2rem", overflow: "hidden", borderRadius: "0.5rem", backgroundColor: "#EDEAE0" }}>
          <img src={allImages[galleryIndex]} alt={dest.name} style={{ width: "100%", height: "clamp(320px, 56vw, 620px)", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.04) 45%, rgba(44,33,28,0.62) 100%)" }} />

          {/* Gallery nav */}
          {allImages.length > 1 && (
            <>
              <button onClick={() => setGalleryIndex((i) => (i - 1 + allImages.length) % allImages.length)} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(26,26,26,0.5)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#F5F0E8" }}>
                <ChevronLeft size={17} />
              </button>
              <button onClick={() => setGalleryIndex((i) => (i + 1) % allImages.length)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(26,26,26,0.5)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#F5F0E8" }}>
                <ChevronRight size={17} />
              </button>
              <div style={{ position: "absolute", bottom: "1rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.4rem" }}>
                {allImages.map((_, i) => (
                  <button key={i} onClick={() => setGalleryIndex(i)} style={{ width: i === galleryIndex ? 20 : 7, height: 7, borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: i === galleryIndex ? "#F5F0E8" : "rgba(245,240,232,0.45)", transition: "all 0.2s", padding: 0 }} />
                ))}
              </div>
            </>
          )}

          {/* Overlay title info */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.5rem 1.5rem 2.25rem" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <span style={{ backgroundColor: dest.color, color: "#F5F0E8", fontFamily: "var(--font-label)", fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.60rem", borderRadius: "0.2rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>{dest.terrain}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.35rem" }}>
                  <MapPin size={13} color="rgba(245,240,232,0.75)" />
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: "rgba(245,240,232,0.85)" }}>{dest.province}, Philippines</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 600, color: "#F5F0E8", lineHeight: 1 }}>★ {dest.rating}</div>
                  <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", color: "rgba(245,240,232,0.65)", marginTop: "0.2rem" }}>{dest.reviews.toLocaleString()} reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: "2rem", alignItems: "start" }} className="dest-guide-grid">

            {/* Left: main content */}
            <div>

              {/* Quick stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
                {[
                  { icon: Users, value: dest.explorers.toLocaleString(), label: "Explorers" },
                  { icon: Pin, value: dest.pins.toLocaleString(), label: "Pins" },
                  { icon: BookOpen, value: dest.stories.length.toString(), label: "Stories" },
                  { icon: Camera, value: dest.gallery.length + 1 + " photos", label: "Gallery" },
                ].map((stat) => (
                  <div key={stat.label} style={{ backgroundColor: "#EDEAE0", borderRadius: "0.5rem", padding: "0.875rem 0.75rem", textAlign: "center" }}>
                    <stat.icon size={18} color={dest.color} style={{ margin: "0 auto 0.35rem" }} />
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "#1A1A1A", lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontFamily: "var(--font-label)", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B5A", marginTop: "0.2rem" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* About */}
              <div style={{ marginBottom: "2rem" }}>
                <p style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#C4713A", marginBottom: "0.6rem" }}>Why visit</p>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 600, color: "#3A2A22", margin: "0 0 1rem", lineHeight: 1.1 }}>A destination worth planning around</h2>
                {dest.longDesc.split("\n\n").map((p, i) => (
                  <p key={i} style={{ fontFamily: "var(--font-body)", fontSize: "1.03rem", color: "#3A3A2A", lineHeight: 1.85, marginBottom: "1rem" }}>{p}</p>
                ))}
              </div>

              {/* Highlights */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#3A2A22", marginBottom: "0.875rem" }}>Must-see Highlights</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {dest.highlights.map((h, i) => (
                    <div key={h} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.875rem", backgroundColor: "#EDEAE0", borderRadius: "0.375rem", borderLeft: `3px solid ${dest.color}` }}>
                      <span style={{ fontFamily: "var(--font-label)", fontSize: "0.62rem", fontWeight: 800, color: dest.color, width: 18, flexShrink: 0 }}>0{i + 1}</span>
                      <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.875rem", color: "#1A1A1A" }}>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stories from explorers */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <BookOpen size={16} color="#3A2A22" />
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#3A2A22", margin: 0 }}>Explorer Stories</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {dest.stories.map((s, i) => {
                    const gu = GAMIFIED_USERS[s.authorKey];
                    const lv = gu ? getLevelFromXp(gu.xp) : null;
                    const linkedStory = STORIES.find((story) => story.title === s.title);
                    return (
                      <div
                        key={i}
                        role="button"
                        tabIndex={0}
                        onClick={() => linkedStory && setSelectedStory(linkedStory)}
                        onKeyDown={(event) => {
                          if ((event.key === "Enter" || event.key === " ") && linkedStory) setSelectedStory(linkedStory);
                        }}
                        style={{ display: "flex", gap: "0.875rem", padding: "1rem", backgroundColor: "#EDEAE0", borderRadius: "0.5rem", alignItems: "flex-start", cursor: linkedStory ? "pointer" : "default" }}
                      >
                        <button onClick={(event) => { event.stopPropagation(); if (gu) navigate(`/profile/${s.authorKey}`); }} style={{ background: "none", border: "none", cursor: gu ? "pointer" : "default", padding: 0, flexShrink: 0 }}>
                          {gu ? (
                            <div style={{ position: "relative" }}>
                              <img src={gu.avatar} alt={gu.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: `2px solid ${lv?.color ?? "#9E6B5C"}` }} />
                              {lv && <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", backgroundColor: lv.color, color: "#F5F0E8", fontFamily: "var(--font-label)", fontSize: "0.45rem", fontWeight: 800, padding: "0.08rem 0.28rem", borderRadius: "2rem", whiteSpace: "nowrap" }}>LV{lv.level}</div>}
                            </div>
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#D8D4C8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <BookOpen size={16} color="#6B6B5A" />
                            </div>
                          )}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: "var(--font-display)", fontSize: "0.975rem", fontWeight: 600, color: "#3A2A22", lineHeight: 1.3, margin: "0 0 0.4rem" }}>{s.title}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <button onClick={(event) => { event.stopPropagation(); if (gu) navigate(`/profile/${s.authorKey}`); }} style={{ background: "none", border: "none", cursor: gu ? "pointer" : "default", padding: 0, fontFamily: "var(--font-ui)", fontSize: "0.78rem", fontWeight: 600, color: "#3A3A2A" }}>{s.author}</button>
                            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#6B6B5A" }}>·</span>
                            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#6B6B5A" }}>{s.date}</span>
                            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#6B6B5A" }}>· ♥ {s.likes}</span>
                          </div>
                        </div>
                        <ExternalLink size={14} color="#9A9A8A" style={{ flexShrink: 0, marginTop: "0.25rem" }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <aside style={{ position: "sticky", top: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }} className="dest-guide-sidebar">

              {/* Trip info */}
              <div style={{ backgroundColor: "#EDEAE0", border: "1px solid rgba(58,42,34,0.1)", borderRadius: "0.5rem", padding: "1.25rem" }}>
                <p style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.75rem" }}>Trip Info</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {[
                    { icon: Clock, label: "Best Months", value: dest.bestMonths },
                    { icon: Compass, label: "Difficulty", value: dest.difficulty },
                    { icon: MapPin, label: "Province", value: dest.province },
                    { icon: Star, label: "Rating", value: `${dest.rating} / 5.0` },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.75rem", backgroundColor: "#F5F0E8", borderRadius: "0.375rem" }}>
                      <item.icon size={14} color={dest.color} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-label)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#9A9A8A" }}>{item.label}</div>
                        <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", fontWeight: 500, color: "#1A1A1A" }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div style={{ backgroundColor: "#EDEAE0", border: "1px solid rgba(58,42,34,0.1)", borderRadius: "0.5rem", padding: "1.25rem" }}>
                <p style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.625rem" }}>Activities</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {dest.tags.map((t) => (
                    <span key={t} style={{ padding: "0.25rem 0.7rem", backgroundColor: `${dest.color}18`, border: `1px solid ${dest.color}40`, borderRadius: "2rem", fontSize: "0.72rem", fontFamily: "var(--font-label)", color: dest.color, letterSpacing: "0.04em" }}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Explorers who've been here */}
              <div style={{ backgroundColor: "#EDEAE0", border: "1px solid rgba(58,42,34,0.1)", borderRadius: "0.5rem", padding: "1.25rem" }}>
                <p style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.75rem" }}>
                  TravelTraces Explorers Here <span style={{ color: dest.color }}>({dest.explorers.toLocaleString()})</span>
                </p>

                {/* Stacked avatars preview */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                  {dest.contributors.map((key, i) => {
                    const gu = GAMIFIED_USERS[key];
                    if (!gu) return null;
                    const lv = getLevelFromXp(gu.xp);
                    return (
                      <button key={key} onClick={() => navigate(`/profile/${key}`)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: i > 0 ? -10 : 0, position: "relative", zIndex: dest.contributors.length - i }}>
                        <img src={gu.avatar} alt={gu.name} title={gu.name} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${lv.color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }} />
                      </button>
                    );
                  })}
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "#6B6B5A", marginLeft: "0.75rem" }}>+{dest.explorers - dest.contributors.length} more</span>
                </div>

                {/* Contributor list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {dest.contributors.map((key) => {
                    const gu = GAMIFIED_USERS[key];
                    if (!gu) return null;
                    const lv = getLevelFromXp(gu.xp);
                    return (
                      <button key={key} onClick={() => navigate(`/profile/${key}`)} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.75rem", backgroundColor: "#F5F0E8", borderRadius: "0.5rem", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.12s" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8D4C8")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F5F0E8")}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <img src={gu.avatar} alt={gu.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: `2px solid ${lv.color}` }} />
                          <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", backgroundColor: lv.color, color: "#F5F0E8", fontFamily: "var(--font-label)", fontSize: "0.45rem", fontWeight: 800, padding: "0.06rem 0.28rem", borderRadius: "2rem", whiteSpace: "nowrap" }}>LV{lv.level}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "0.82rem", color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gu.name}</div>
                          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.7rem", color: lv.color, fontWeight: 500 }}>{lv.title}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontFamily: "var(--font-label)", fontSize: "0.6rem", color: "#9A9A8A", textTransform: "uppercase", letterSpacing: "0.06em" }}>stories</div>
                          <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, color: "#1A1A1A" }}>{dest.stories.filter((s) => s.authorKey === key).length}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dest-guide-header { grid-template-columns: 1fr !important; }
          .dest-guide-grid { grid-template-columns: 1fr !important; }
          .dest-guide-sidebar { position: static !important; }
        }
        @media (max-width: 640px) {
          .dest-guide-stats { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; min-width: 0 !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Destination Card ──────────────────────────────────────── */

function DestinationCard({ d, onClick }: { d: Destination; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const category = destinationCategory(d);
  const CategoryIcon = CATEGORY_ICON[category] ?? Compass;
  const contributors = d.contributors.map((k) => GAMIFIED_USERS[k]).filter(Boolean);

  return (
    <article
      onClick={onClick}
      style={{
        backgroundColor: "#EDEAE0",
        borderRadius: "0.25rem",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.1)" : "none",
        display: "flex", flexDirection: "column",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          src={d.img} alt={d.name}
          style={{ width: "100%", height: 200, objectFit: "cover", display: "block", transition: "transform 0.45s", transform: hovered ? "scale(1.04)" : "scale(1)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(44,33,28,0.65) 100%)" }} />

        {/* Category badge */}
        <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem", backgroundColor: "#C4713A", color: "#F5F0E8", padding: "0.25rem 0.625rem", borderRadius: "0.2rem", fontSize: "0.68rem", fontFamily: "var(--font-label)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          <CategoryIcon size={11} />
          {category}
        </div>

        {/* Rating */}
        <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", backgroundColor: "rgba(26,26,26,0.65)", color: "#F5F0E8", padding: "0.25rem 0.6rem", borderRadius: "2rem", fontSize: "0.75rem", fontFamily: "var(--font-label)", display: "flex", alignItems: "center", gap: "0.3rem", backdropFilter: "blur(4px)" }}>
          <Star size={11} fill="#F5C842" color="#F5C842" /> {d.rating}
        </div>

        {/* Explorer avatars on card */}
        <div style={{ position: "absolute", bottom: "0.75rem", left: "0.875rem", display: "flex", alignItems: "center", gap: "0" }}>
          {contributors.slice(0, 3).map((gu, i) => (
            <img key={gu!.id} src={gu!.avatar} alt={gu!.name} style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(245,240,232,0.8)", marginLeft: i > 0 ? -8 : 0, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
          ))}
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.7rem", color: "rgba(245,240,232,0.9)", marginLeft: "0.5rem" }}>+{d.explorers} explorers</span>
        </div>
      </div>

      <div style={{ padding: "1.25rem 1.25rem 1rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 600, color: "#3A2A22", lineHeight: 1.2, marginBottom: "0.2rem" }}>{d.name}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
            <MapPin size={12} color="#9E6B5C" />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "#6B6B5A" }}>{d.region}</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#9A9A8A" }}>·</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "#6B6B5A" }}>{d.terrain}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.35rem" }}>
            <Compass size={12} color="#9E6B5C" />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.74rem", color: "#6B5A50", fontWeight: 600 }}>{formatCoordinates(d.coordinate)}</span>
          </div>
        </div>

        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#4A4A3A", lineHeight: 1.65, marginBottom: "1rem", flex: 1 }}>{d.desc}</p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {d.tags.slice(0, 2).map((t) => (
              <span key={t} style={{ padding: "0.18rem 0.55rem", backgroundColor: `${d.color}15`, border: `1px solid ${d.color}35`, borderRadius: "2rem", fontSize: "0.68rem", fontFamily: "var(--font-label)", color: d.color }}>{t}</span>
            ))}
            {d.tags.length > 2 && <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", color: "#9A9A8A" }}>+{d.tags.length - 2}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#6B6B5A" }}>
            <BookOpen size={13} color="#9A9A8A" />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "#6B6B5A" }}>{d.stories.length} stories</span>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */

function ExploreContent() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Destination | null>(null);

  const filtered = useMemo(
    () =>
      DESTINATIONS.filter((d) => {
        const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.region.toLowerCase().includes(search.toLowerCase()) || d.province.toLowerCase().includes(search.toLowerCase());
        const matchCategory = destinationMatchesCategory(d, category);
        return matchSearch && matchCategory;
      }).sort((a, b) => {
        const interests = user?.interests ?? [];
        const aScore = interests.some((interest) => destinationMatchesCategory(a, interest)) ? 1 : 0;
        const bScore = interests.some((interest) => destinationMatchesCategory(b, interest)) ? 1 : 0;
        return bScore - aScore || b.rating - a.rating;
      }),
    [category, search, user?.interests],
  );

  if (selected) {
    return <DestinationGuideView dest={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FBF7F0", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header className="mb-10">
          <p className="mb-2 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#9E6B5C]">Destination browser</p>
          <h1 className="m-0 font-[var(--font-display)] text-5xl font-semibold leading-none text-[#3A2A22] sm:text-6xl">Explore</h1>
          <p className="mt-4 max-w-3xl font-[var(--font-body)] text-lg leading-8 text-[#5B4A40]">Browse beaches, hikes, food places, forests, hidden gems, and culture-rich destinations from the TravelTraces community.</p>
        </header>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#6B5A50" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destinations, regions, provinces..."
              style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", backgroundColor: "#EFE7DC", border: "1px solid rgba(58,42,34,0.15)", borderRadius: "0.25rem", fontSize: "0.9rem", color: "#2C211C", fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {travelCategories.map((t) => {
              const Icon = CATEGORY_ICON[t] ?? Compass;
              const isActive = category === t;
              const isAll = t === "All";
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCategory(t)}
                  className="category-pill"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    minHeight: 44,
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: isActive ? "#3A2A22" : "rgba(58,42,34,0.2)",
                    backgroundColor: isActive ? "#3A2A22" : "transparent",
                    color: isActive ? "#F5F0E8" : "#3A2A22",
                    padding: isAll ? "8px 24px" : "8px 16px",
                    fontFamily: "var(--font-ui)",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 600,
                    cursor: "pointer",
                    transition: "background-color 0.2s, border-color 0.2s, color 0.2s",
                    whiteSpace: "nowrap",
                  }}
                  aria-pressed={isActive}
                >
                  {!isAll && <Icon size={14} color={isActive ? "#F5F0E8" : "#9E6B5C"} style={{ flexShrink: 0 }} />}
                  <span>{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: "1.75rem" }} />

        {filtered.length === 0 ? (
          <LargeEmptyState
            title="No destinations here yet"
            copy="Try another search term or category to find more public destinations."
          />
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.5rem" }}>
          {filtered.map((d) => (
            <DestinationCard key={d.id} d={d} onClick={() => setSelected(d)} />
          ))}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .category-pill:hover { background-color: rgba(58,42,34,0.08); border-color: #3A2A22; color: #3A2A22; }
        .category-pill[aria-pressed="true"]:hover { background-color: #3A2A22; border-color: #3A2A22; color: #F5F0E8; }
      `}</style>
    </div>
  );
}


export default function ExplorePage() {
  return (
    <GatedPage featureName="The destination explorer">
      <ExploreContent />
    </GatedPage>
  );
}


