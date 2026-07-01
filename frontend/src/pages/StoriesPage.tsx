import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Search, MapPin, Clock, Heart, Bookmark, Share2, ArrowLeft, ChevronLeft, ChevronRight, Send, MessageCircle } from "lucide-react";
import { GatedPage } from "../components/GatedPage";
import { useAuth } from "../context/AuthContext";
import { UserProfileModal } from "../components/UserProfileModal";
import { GAMIFIED_USERS, GamifiedUser } from "../components/gamification";

const AUTHOR_KEY: Record<string, string> = {
  "Carlo Reyes": "carlo",
  "Ana Villanueva": "ana",
  "Ramon Dela Cruz": "ramon",
  "Leila Marcos": "leila",
  "Marco Buenaventura": "marco",
  "Sofia Reyes": "sofia",
};

const STORY_COMMENTS: Record<number, { id: number; author: string; avatar: string; text: string; time: string; likes: number }[]> = {
  1: [
    { id: 1, author: "Ana Villanueva", avatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=40&h=40&fit=crop&auto=format", text: "Tour C and D are seriously underrated! I did Tour C last March and had the whole Shimizu area almost to ourselves.", time: "2 days ago", likes: 14 },
    { id: 2, author: "Ramon Dela Cruz", avatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=40&h=40&fit=crop&auto=format", text: "Nena's kare-kare with tamilok — that's a bucket list meal right there. Never knew about the covered market!", time: "1 day ago", likes: 8 },
    { id: 3, author: "Sofia Reyes", avatar: "https://images.unsplash.com/photo-1672933278668-5be5957a8681?w=40&h=40&fit=crop&auto=format", text: "This is exactly the kind of honest review we need more of on TravelTraces. Thank you for this Carlo!", time: "5 hours ago", likes: 21 },
  ],
  2: [
    { id: 1, author: "Leila Marcos", avatar: "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=40&h=40&fit=crop&auto=format", text: "The vatang weaving description gave me chills. I've been wanting to go to Batanes for years.", time: "3 days ago", likes: 17 },
    { id: 2, author: "Marco Buenaventura", avatar: "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=40&h=40&fit=crop&auto=format", text: "Valugan boulder beach at sunrise is on my list now. That pink sky sounds unreal.", time: "1 day ago", likes: 11 },
  ],
  3: [
    { id: 1, author: "Carlo Reyes", avatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=40&h=40&fit=crop&auto=format", text: "The detail about the woodpecker as an environmental monitor blew my mind. Nature as science instrument.", time: "4 days ago", likes: 32 },
  ],
  4: [
    { id: 1, author: "Ana Villanueva", avatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=40&h=40&fit=crop&auto=format", text: "I was there two months before Odette. Seeing it rebuilt means so much. The resilience of Siargao is inspiring.", time: "2 days ago", likes: 45 },
    { id: 2, author: "Sofia Reyes", avatar: "https://images.unsplash.com/photo-1672933278668-5be5957a8681?w=40&h=40&fit=crop&auto=format", text: "The uneven recovery point is so important. Easy to miss that when only the luxury end gets coverage.", time: "1 day ago", likes: 29 },
    { id: 3, author: "Ramon Dela Cruz", avatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=40&h=40&fit=crop&auto=format", text: "Odette took so much from the island. Good to read that people are rebuilding with that spirit.", time: "12 hours ago", likes: 18 },
  ],
  5: [
    { id: 1, author: "Leila Marcos", avatar: "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=40&h=40&fit=crop&auto=format", text: "The fermentation and contrast flavors description — Kapampangan food is something else entirely.", time: "3 days ago", likes: 22 },
  ],
  6: [
    { id: 1, author: "Carlo Reyes", avatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=40&h=40&fit=crop&auto=format", text: "Sixty person limit for overnight camping is brilliant. Keeps the magic alive. Booking this ASAP.", time: "5 days ago", likes: 9 },
    { id: 2, author: "Marco Buenaventura", avatar: "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=40&h=40&fit=crop&auto=format", text: "Manong Eddie sounds like a living encyclopedia of Hundred Islands. Legend.", time: "2 days ago", likes: 13 },
  ],
};

export const STORY_PHOTOS: Record<number, string[]> = {
  1: [
    "https://images.unsplash.com/photo-1632307918787-8cb52566dd35?w=1100&h=720&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1100&h=720&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1100&h=720&fit=crop&auto=format",
  ],
  2: [
    "https://images.unsplash.com/photo-1768639400843-d604ccce9c3e?w=1100&h=720&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1100&h=720&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1100&h=720&fit=crop&auto=format",
  ],
  3: [
    "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=1100&h=720&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1100&h=720&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1100&h=720&fit=crop&auto=format",
  ],
  4: [
    "https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=1100&h=720&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1100&h=720&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1100&h=720&fit=crop&auto=format",
  ],
  5: [
    "https://images.unsplash.com/photo-1711060169357-ed923c9f2156?w=1100&h=720&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1100&h=720&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1100&h=720&fit=crop&auto=format",
  ],
  6: [
    "https://images.unsplash.com/photo-1688541197205-02bd8c71074d?w=1100&h=720&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1100&h=720&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=1100&h=720&fit=crop&auto=format",
  ],
};

export const STORIES = [
  {
    id: 1,
    title: "48 Hours in El Nido: What the Guidebooks Don't Tell You",
    author: "Carlo Reyes",
    authorAvatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=48&h=48&fit=crop&auto=format",
    region: "Palawan",
    readTime: "8 min",
    date: "12 May 2025",
    likes: 418,
    saves: 203,
    img: "https://images.unsplash.com/photo-1632307918787-8cb52566dd35?w=800&h=500&fit=crop&auto=format",
    category: "Beaches",
    excerpt: "The coves are stunning, yes — but nobody tells you about the hour-long boat queue at Nacpan, the food stalls that close by 9pm, or the fact that Tour A and Tour B hit the same spots. Here's the trip I wish someone had written for me.",
    body: `It was supposed to be a straightforward two-night trip. Pack light, catch the morning flight to Puerto Princesa, take the van to El Nido, collapse into a hammock, repeat. Instead, I found myself at 6am standing at the port watching three other tour boats load passengers in exactly the same order as mine.\n\nThe lagoons are genuinely spectacular. Big Lagoon hit me with that specific vertigo you get when reality seems too saturated to be real — the limestone walls rising thirty metres overhead, the kayak cutting soundlessly through water so clear you can see your paddle shadow on the bottom. That moment is real, and no amount of tourist traffic can fully ruin it.\n\nBut here's what nobody wrote: Shimizu Island, the snorkelling stop on Tour A, has been so thoroughly visited that the coral closest to the shore is largely dead. The fish are still there — the giant parrotfish and the clownfish that every kid photographs through a snorkel mask — but the structure they depend on is bleaching. I watched a French tourist standing in the middle of a coral garden to get a selfie.\n\nThe food in El Nido town itself is better than people say. Skip the Instagram restaurants on Calle Hama and walk fifteen minutes to the covered market on Real Street. A local woman named Nena makes kare-kare with tamilok — the woodworm mollusc that the Palawenos eat raw with vinegar — and it is the single most surprising meal I've had in the Philippines.\n\nMy advice: book Tour C and Tour D instead of A and B. The boats are smaller, the stops are quieter, and you'll likely be with eight people instead of thirty-two.`,
  },
  {
    id: 2,
    title: "The Road to Batanes: Chasing the Last Frontier's Last Sunsets",
    author: "Ana Villanueva",
    authorAvatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=48&h=48&fit=crop&auto=format",
    region: "Batanes",
    readTime: "12 min",
    date: "3 May 2025",
    likes: 632,
    saves: 341,
    img: "https://images.unsplash.com/photo-1768639400843-d604ccce9c3e?w=800&h=500&fit=crop&auto=format",
    category: "Culture",
    excerpt: "Batanes feels like the Philippines held its breath and forgot to exhale. Rolling hills, stone houses that have survived typhoons for three centuries, and an Ivatan culture that has its own language, its own weaving, and its own relationship with the sea.",
    body: `The flight from Tuguegarao to Basco is forty-five minutes in a propeller plane with twelve seats. You cross the Luzon Strait at low altitude and, if the pilot takes the coastal route, you see the Babuyan Islands laid out below you like green stones dropped on blue cloth.\n\nBatanes is the northernmost province of the Philippines. On a clear day from Naidi Hills, you can see Taiwan. The Batan, Sabtang, and Itbayat islands together have a population of about eighteen thousand people, most of them Ivatan — one of the few Philippine ethnic groups that maintained a distinct material culture through colonisation.\n\nThe vatang is the traditional raincoat, woven from the leaves of the voyavoy palm. Fishermen wear them when they take their boats out in the typhoon season. I watched a woman in Ivana weaving one in her front yard, her hands moving with a speed that suggested she had been doing this for fifty years, which she had.\n\nThe roads on Batan are good. A scooter costs three hundred pesos a day to rent and will take you to every viewpoint, every stone church, every beach. I rode mine to the Valugan boulder beach at sunrise and sat among the rounded volcanic stones while the sky went from grey to orange to the specific pink that Batanes seems to specialise in.`,
  },
  {
    id: 3,
    title: "Three Weeks Among the Ifugao: Rice Terraces and Slow Time",
    author: "Ramon Dela Cruz",
    authorAvatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=48&h=48&fit=crop&auto=format",
    region: "Cordillera",
    readTime: "15 min",
    date: "28 Apr 2025",
    likes: 521,
    saves: 287,
    img: "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=800&h=500&fit=crop&auto=format",
    category: "Hiking",
    excerpt: "I came to Banaue for a weekend. I stayed three weeks. The rice terraces are a UNESCO site, yes, but what kept me was the community — the muyong irrigation system, the mumbaki priests, the uyauy feast. This is the Philippines at its oldest.",
    body: `The terrace system took two thousand years to build. That is not a figure I could hold in my head when I first arrived — it is too large to be meaningful. After three weeks, it started to matter.\n\nThe Ifugao do not plant rice once a year. They plant it when the conditions are right: when the muyong water level in the private forest ponds reaches a certain point, when the woodpecker calls in the way that signals the season, when the mumbaki has performed the right rituals. This is not superstition layered over agriculture. It is a system of environmental monitoring refined over a hundred generations.\n\nI stayed with a family in Batad, the amphitheatre terrace cluster that requires a forty-minute walk from the nearest road. The matriarch, Lolita, showed me how to thin rice seedlings at dawn while the mist was still in the valley. Her hands moved thirty times faster than mine.`,
  },
  {
    id: 4,
    title: "Siargao After the Typhoon: Notes on Return and Resilience",
    author: "Leila Marcos",
    authorAvatar: "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=48&h=48&fit=crop&auto=format",
    region: "Surigao del Norte",
    readTime: "10 min",
    date: "20 Apr 2025",
    likes: 893,
    saves: 412,
    img: "https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=800&h=500&fit=crop&auto=format",
    category: "Beaches",
    excerpt: "Typhoon Odette hit Siargao in December 2021 and flattened it. Three years later, I returned to the island where I'd spent six months before the storm. What I found was not what I expected.",
    body: `The coconut palms along the road from the airport were the first thing I noticed. Three years after Odette, most of them have grown back to maybe a third of their pre-storm height — thin, sparse, the kind of young that looks fragile. The island is re-leafing itself.\n\nGeneral Luna, the surf town, is largely rebuilt. The boards-and-bamboo aesthetic has been replaced with something more permanent — concrete posts, corrugated iron, a few proper buildings. Some of the restaurants I knew are gone. A dozen new ones have appeared. The Cloud 9 break itself is unchanged: still left-hander, still barreling, still full of surfers at first light.\n\nWhat surprised me was the community's attitude. I'd expected grief, or at least a kind of subdued quality. Instead I found something more like determination made ordinary — people who had rebuilt once and knew they could do it again. The surfers talked about the wave the way they always had, as if the storm was just a particularly bad set season.\n\nThe island's recovery is real but uneven. The luxury resort north of town is fully operational. Some of the smaller guesthouses on the eastern coast are still closed, their owners still in the process of navigating insurance claims and building permits.`,
  },
  {
    id: 5,
    title: "Eating My Way Through Pampanga: The Philippines' Culinary Heart",
    author: "Marco Buenaventura",
    authorAvatar: "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=48&h=48&fit=crop&auto=format",
    region: "Pampanga",
    readTime: "9 min",
    date: "14 Apr 2025",
    likes: 734,
    saves: 367,
    img: "https://images.unsplash.com/photo-1711060169357-ed923c9f2156?w=800&h=500&fit=crop&auto=format",
    category: "Food Place",
    excerpt: "Pampanga is where Philippine cuisine lives at its most inventive. Sisig was born here. So was the tocino that the entire country eats for breakfast. Three days, twelve meals, and one very full notebook.",
    body: `Capampangan food is defined by fermentation, by the contrast between the very sour and the very rich, and by a willingness to use parts of the animal that the rest of the country politely avoids. This is not adventurism for its own sake. It is an old cuisine with centuries of logic behind it.\n\nSisig at Aling Lucing's — the original, in Angeles — is served on a sizzling metal plate, still crisping when it arrives, fatty and sour with calamansi. The version that became a global Filipino food trend started here in a market stall and has been adapted perhaps ten thousand times since. The original is still the best version I've eaten.\n\nKare-kare from a Kapampangan kitchen is a different thing from the Manila restaurant version. The peanut sauce is thicker, the oxtail cooked until it gives at a touch, and the bagoong alamang that comes alongside it is made in-house — fermented, purple, funky, and essential.`,
  },
  {
    id: 6,
    title: "Hundred Islands: The National Park Nobody Talks About",
    author: "Sofia Reyes",
    authorAvatar: "https://images.unsplash.com/photo-1672933278668-5be5957a8681?w=48&h=48&fit=crop&auto=format",
    region: "Pangasinan",
    readTime: "7 min",
    date: "8 Apr 2025",
    likes: 289,
    saves: 142,
    img: "https://images.unsplash.com/photo-1688541197205-02bd8c71074d?w=800&h=500&fit=crop&auto=format",
    category: "Hidden Gems",
    excerpt: "Sixty-two kilometres north of Dagupan, 123 islands rise from Lingayen Gulf. Most Filipinos haven't been. Most tourists go to Palawan instead. The islands are almost entirely yours.",
    body: `The boat from Lucap Wharf takes twelve minutes to reach the first island cluster. There is no resort on any of the 123 islands — just a few picnic huts, some kayak rental operations, and a beach camping permit system that limits overnight visitors to sixty people.\n\nI arrived on a Tuesday in low season. The boatman, Manong Eddie, had been running tours here for twenty-two years. He knew which islands were good for snorkelling (Marcos Island, which has a cave), which for swimming (Children's Island, sand flat at low tide), and which to simply sit on and watch the sea.\n\nThe islands themselves are limestone formations — same geological family as El Nido but much older, more weathered, covered in thick shrub and the occasional acacia. At sunset the whole cluster turns from green to orange to silhouette.`,
  },
];

const categories = ["All", "Hiking", "Food Place", "Hidden Gems", "Beaches", "Forest", "Culture", "More"];

export type TravelStory = (typeof STORIES)[number];

export const STORY_MAP_POINTS: Record<number, { place: string; coordinate: { lat: number; lon: number } }> = {
  1: { place: "El Nido, Palawan", coordinate: { lat: 11.1956, lon: 119.4075 } },
  2: { place: "Basco, Batanes", coordinate: { lat: 20.4487, lon: 121.9702 } },
  3: { place: "Banaue Rice Terraces, Ifugao", coordinate: { lat: 16.919, lon: 121.0593 } },
  4: { place: "General Luna, Siargao", coordinate: { lat: 9.7843, lon: 126.1589 } },
  5: { place: "Angeles, Pampanga", coordinate: { lat: 15.146, lon: 120.5887 } },
  6: { place: "Hundred Islands, Pangasinan", coordinate: { lat: 16.2076, lon: 119.9706 } },
};

export function StoryArticleView({ story, onBack, onPrev, onNext, hasPrev, hasNext }: {
  story: typeof STORIES[0];
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<GamifiedUser | null>(null);
  const [comments, setComments] = useState(STORY_COMMENTS[story.id] ?? []);
  const [commentInput, setCommentInput] = useState("");
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos = STORY_PHOTOS[story.id] ?? [story.img];
  const activePhoto = photos[photoIndex] ?? photos[0];
  const hasMultiplePhotos = photos.length > 1;
  const storyPoint = STORY_MAP_POINTS[story.id];

  useEffect(() => {
    setLiked(false);
    setSaved(false);
    setViewingProfile(null);
    setComments(STORY_COMMENTS[story.id] ?? []);
    setCommentInput("");
    setLikedComments(new Set());
    setPhotoIndex(0);
  }, [story.id]);

  const submitComment = () => {
    if (!commentInput.trim()) return;
    const newComment = {
      id: Date.now(),
      author: user?.name ?? "You",
      avatar: user?.avatar ?? "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=40&h=40&fit=crop&auto=format",
      text: commentInput.trim(),
      time: "Just now",
      likes: 0,
    };
    setComments((prev) => [...prev, newComment]);
    setCommentInput("");
  };

  const handlePinStoryLocation = () => {
    if (storyPoint) {
      window.localStorage.setItem(
        "traveltraces.pendingStoryPin",
        JSON.stringify({
          storyId: story.id,
          title: story.title,
          place: storyPoint.place,
          coordinate: storyPoint.coordinate,
        }),
      );
    }
    navigate("/maps");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FBF7F0", padding: "2rem clamp(1rem, 4vw, 2rem) 5rem" }}>
      <article style={{ width: "min(100%, 1120px)", margin: "0 auto", backgroundColor: "#FBF7F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
          <button
            onClick={onBack}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", border: "1px solid rgba(58,42,34,0.18)", background: "transparent", color: "#3A2A22", borderRadius: "999px", padding: "0.55rem 1rem", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            <ArrowLeft size={15} /> Stories
          </button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {hasPrev && (
              <button aria-label="Previous story" onClick={onPrev} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", border: "1px solid rgba(58,42,34,0.18)", background: "transparent", color: "#3A2A22", borderRadius: "999px", padding: "0.55rem 0.9rem", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: "0.82rem", fontWeight: 700 }}>
                <ChevronLeft size={16} /> Previous
              </button>
            )}
            {hasNext && (
              <button aria-label="Next story" onClick={onNext} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", border: "1px solid rgba(58,42,34,0.18)", background: "transparent", color: "#3A2A22", borderRadius: "999px", padding: "0.55rem 0.9rem", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: "0.82rem", fontWeight: 700 }}>
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        <header style={{ width: "min(100%, 780px)", margin: "0 auto 2rem", textAlign: "left" }}>
          <span style={{ display: "inline-flex", padding: "0.28rem 0.75rem", backgroundColor: "rgba(196,113,58,0.1)", border: "1px solid rgba(196,113,58,0.25)", borderRadius: "999px", fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#C4713A", marginBottom: "1rem" }}>
            {story.category}
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.45rem, 7vw, 5rem)", fontWeight: 600, color: "#1A1A1A", lineHeight: 0.98, letterSpacing: 0, marginBottom: "1rem" }}>{story.title}</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(1.05rem, 2vw, 1.35rem)", lineHeight: 1.65, color: "#4A4A3A", margin: "0 0 1.35rem" }}>{story.excerpt}</p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", borderTop: "1px solid rgba(58,42,34,0.14)", borderBottom: "1px solid rgba(58,42,34,0.14)", padding: "1rem 0", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <button onClick={() => { const k = AUTHOR_KEY[story.author]; if (k) setViewingProfile(GAMIFIED_USERS[k]); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <img src={story.authorAvatar} alt={story.author} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", display: "block" }} />
              </button>
              <div>
                <button onClick={() => { const k = AUTHOR_KEY[story.author]; if (k) setViewingProfile(GAMIFIED_USERS[k]); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: "0.94rem", color: "#1A1A1A" }}>{story.author}</button>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#6B5A50", flexWrap: "wrap", marginTop: "0.15rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.82rem", fontFamily: "var(--font-ui)" }}><MapPin size={12} />{story.region}, Philippines</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.82rem", fontFamily: "var(--font-ui)" }}><Clock size={12} />Posted {story.date}</span>
                  <span style={{ fontSize: "0.82rem", fontFamily: "var(--font-ui)" }}>{story.readTime} read</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button onClick={() => setLiked((v) => !v)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.85rem", border: "1px solid", borderColor: liked ? "#C4713A" : "rgba(58,42,34,0.2)", borderRadius: "999px", background: liked ? "rgba(196,113,58,0.08)" : "none", color: liked ? "#C4713A" : "#6B5A50", cursor: "pointer", fontSize: "0.8rem", fontFamily: "var(--font-ui)", fontWeight: 700 }}>
                <Heart size={14} fill={liked ? "#C4713A" : "none"} /> {story.likes + (liked ? 1 : 0)}
              </button>
              <button onClick={() => setSaved((v) => !v)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.85rem", border: "1px solid", borderColor: saved ? "#3A2A22" : "rgba(58,42,34,0.2)", borderRadius: "999px", background: saved ? "rgba(58,42,34,0.08)" : "none", color: saved ? "#3A2A22" : "#6B5A50", cursor: "pointer", fontSize: "0.8rem", fontFamily: "var(--font-ui)", fontWeight: 700 }}>
                <Bookmark size={14} fill={saved ? "#3A2A22" : "none"} /> Save
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.85rem", border: "1px solid rgba(58,42,34,0.2)", borderRadius: "999px", background: "none", color: "#6B5A50", cursor: "pointer", fontSize: "0.8rem", fontFamily: "var(--font-ui)", fontWeight: 700 }}>
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>
        </header>

        {/* Photo carousel */}
        <figure style={{ position: "relative", margin: "0 0 2.5rem" }}>
          <img src={activePhoto} alt={`${story.title} photo ${photoIndex + 1}`} style={{ width: "100%", height: "clamp(300px, 58vw, 620px)", objectFit: "cover", display: "block", borderRadius: "0.35rem" }} />
          {hasMultiplePhotos && (
            <>
              <button
                aria-label="Previous photo"
                onClick={() => setPhotoIndex((current) => (current - 1 + photos.length) % photos.length)}
                style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(58,42,34,0.5)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#FBF7F0" }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                aria-label="Next photo"
                onClick={() => setPhotoIndex((current) => (current + 1) % photos.length)}
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(58,42,34,0.5)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#FBF7F0" }}
              >
                <ChevronRight size={20} />
              </button>
              <div style={{ position: "absolute", bottom: "1.1rem", right: "1.5rem", display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(26,26,26,0.45)", borderRadius: "999px", padding: "0.35rem 0.55rem" }}>
                {photos.map((_, index) => (
                  <button
                    key={index}
                    aria-label={`Show photo ${index + 1}`}
                    onClick={() => setPhotoIndex(index)}
                    style={{ width: index === photoIndex ? 18 : 7, height: 7, borderRadius: "999px", border: "none", backgroundColor: index === photoIndex ? "#FBF7F0" : "rgba(251,247,240,0.45)", padding: 0, cursor: "pointer" }}
                  />
                ))}
              </div>
            </>
          )}
          <figcaption style={{ width: "min(100%, 780px)", margin: "0.75rem auto 0", fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "#6B6B5A" }}>
            Photo {photoIndex + 1} of {photos.length} from {story.region}.
          </figcaption>
        </figure>

        {/* Content */}
        <div style={{ width: "min(100%, 780px)", margin: "0 auto" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-label)", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E6B5C", marginBottom: "0.9rem" }}>Description</h3>
            {story.body.split("\n\n").map((para, i) => (
              <p key={i} style={{ fontFamily: "var(--font-body)", fontSize: "clamp(1.05rem, 1.7vw, 1.2rem)", lineHeight: 1.85, color: "#1A1A1A", marginBottom: "1.45rem" }}>{para}</p>
            ))}
          </div>

          {storyPoint ? (
            <div style={{ borderTop: "1px solid rgba(58,42,34,0.12)", paddingTop: "1.75rem", margin: "0.5rem 0 1.75rem" }}>
              <div style={{ backgroundColor: "#EFE7DC", border: "1px solid rgba(58,42,34,0.12)", borderRadius: "0.45rem", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: "0 0 0.35rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E6B5C" }}>Share your own trace</p>
                  <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 600, color: "#3A2A22", lineHeight: 1.1 }}>Want to share your own story of this location?</h3>
                  <p style={{ margin: "0.45rem 0 0", fontFamily: "var(--font-body)", color: "#5B4A40", lineHeight: 1.6 }}>Pin {storyPoint.place} on your map and write what happened there.</p>
                </div>
                <button
                  type="button"
                  onClick={handlePinStoryLocation}
                  style={{ display: "inline-flex", minHeight: 42, alignItems: "center", justifyContent: "center", gap: "0.45rem", borderRadius: "999px", border: "1px solid #3A2A22", backgroundColor: "#3A2A22", color: "#FBF7F0", padding: "0.62rem 1rem", fontFamily: "var(--font-label)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
                >
                  <MapPin size={14} /> Pin this
                </button>
              </div>
            </div>
          ) : null}

          {/* Comments */}
          <div style={{ borderTop: "2px solid rgba(58,42,34,0.1)", paddingTop: "1.75rem", marginTop: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <MessageCircle size={18} color="#3A2A22" />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#3A2A22", margin: 0 }}>
                {comments.length} Comment{comments.length !== 1 ? "s" : ""}
              </h3>
            </div>

            {/* Comment input */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.75rem" }}>
              <img
                src={user?.avatar ?? "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=40&h=40&fit=crop&auto=format"}
                alt="You"
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: "0.25rem" }}
              />
              <div style={{ flex: 1 }}>
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitComment(); }}
                  placeholder="Share your thoughts on this story…"
                  rows={2}
                  style={{ width: "100%", padding: "0.625rem 0.875rem", backgroundColor: "#EDEAE0", border: "1px solid rgba(58,42,34,0.15)", borderRadius: "0.5rem", fontSize: "0.9rem", color: "#1A1A1A", fontFamily: "var(--font-body)", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    onClick={submitComment}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 1rem", backgroundColor: commentInput.trim() ? "#3A2A22" : "#D8D4C8", color: "#F5F0E8", border: "none", borderRadius: "0.25rem", cursor: commentInput.trim() ? "pointer" : "default", fontFamily: "var(--font-label)", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", transition: "background 0.15s" }}
                  >
                    <Send size={13} /> Post
                  </button>
                </div>
              </div>
            </div>

            {/* Comment list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {comments.map((c) => (
                <div key={c.id} style={{ display: "flex", gap: "0.75rem" }}>
                  <img src={c.avatar} alt={c.author} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ backgroundColor: "#EDEAE0", borderRadius: "0 0.75rem 0.75rem 0.75rem", padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                        <button onClick={() => { const k = AUTHOR_KEY[c.author]; if (k) setViewingProfile(GAMIFIED_USERS[k]); }} style={{ background: "none", border: "none", cursor: AUTHOR_KEY[c.author] ? "pointer" : "default", padding: 0, fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "0.875rem", color: "#1A1A1A" }}>{c.author}</button>
                        <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#9A9A8A" }}>{c.time}</span>
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#1A1A1A", lineHeight: 1.65, margin: 0 }}>{c.text}</p>
                    </div>
                    <button
                      onClick={() => setLikedComments((prev) => {
                        const next = new Set(prev);
                        next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                        return next;
                      })}
                      style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: "none", cursor: "pointer", color: likedComments.has(c.id) ? "#C4713A" : "#6B6B5A", fontFamily: "var(--font-ui)", fontSize: "0.78rem", padding: "0.3rem 0.25rem", marginTop: "0.25rem" }}
                    >
                      <Heart size={13} fill={likedComments.has(c.id) ? "#C4713A" : "none"} />
                      {c.likes + (likedComments.has(c.id) ? 1 : 0)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
      {viewingProfile && <UserProfileModal user={viewingProfile} onClose={() => setViewingProfile(null)} />}
    </div>
  );
}

function StoriesContent() {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeStory, setActiveStory] = useState<number | null>(() => {
    const requestedStory = Number(new URLSearchParams(location.search).get("story"));
    return STORIES.some((story) => story.id === requestedStory) ? requestedStory : null;
  });

  useEffect(() => {
    const requestedStory = Number(new URLSearchParams(location.search).get("story"));
    if (STORIES.some((story) => story.id === requestedStory)) {
      setActiveStory(requestedStory);
    }
  }, [location.search]);

  const filtered = STORIES.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.author.toLowerCase().includes(search.toLowerCase()) || s.region.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || s.category === category;
    return matchSearch && matchCat;
  });

  const activeIndex = activeStory !== null ? filtered.findIndex((s) => s.id === activeStory) : -1;

  if (activeStory !== null && activeIndex >= 0) {
    return (
      <StoryArticleView
        story={filtered[activeIndex]}
        onBack={() => setActiveStory(null)}
        onPrev={() => setActiveStory(filtered[activeIndex - 1].id)}
        onNext={() => setActiveStory(filtered[activeIndex + 1].id)}
        hasPrev={activeIndex > 0}
        hasNext={activeIndex < filtered.length - 1}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F0E8", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#9E6B5C", marginBottom: "0.5rem" }}>Travel narratives</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#3A2A22", marginBottom: "0.5rem" }}>Stories</h1>
          <p style={{ fontFamily: "var(--font-body)", color: "#6B6B5A", fontSize: "1rem" }}>Long-form travel narratives from the TravelTraces community — honest, personal, and unhighlighted.</p>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#6B6B5A" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stories, authors, regions…"
              style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", backgroundColor: "#EDEAE0", border: "1px solid rgba(58,42,34,0.15)", borderRadius: "0.25rem", fontSize: "0.9rem", color: "#1A1A1A", fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)} style={{ padding: "0.6rem 1rem", borderRadius: "0.25rem", border: "1px solid", borderColor: category === c ? "#3A2A22" : "rgba(58,42,34,0.2)", backgroundColor: category === c ? "#3A2A22" : "transparent", color: category === c ? "#F5F0E8" : "#3A2A22", cursor: "pointer", fontFamily: "var(--font-label)", fontSize: "0.78rem", fontWeight: 500, letterSpacing: "0.05em" }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Featured story */}
        {filtered.length > 0 && (
          <article
            onClick={() => setActiveStory(filtered[0].id)}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", borderRadius: "0.25rem", overflow: "hidden", backgroundColor: "#EDEAE0", marginBottom: "2rem", cursor: "pointer" }}
            className="featured-story-grid"
          >
            <img src={filtered[0].img} alt={filtered[0].title} style={{ width: "100%", height: 380, objectFit: "cover", display: "block" }} />
            <div style={{ padding: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-label)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C4713A", marginBottom: "0.75rem" }}>{filtered[0].category}</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, color: "#3A2A22", lineHeight: 1.3, marginBottom: "1rem" }}>{filtered[0].title}</h2>
              <p style={{ fontFamily: "var(--font-body)", color: "#4A4A3A", lineHeight: 1.7, fontSize: "0.95rem", marginBottom: "1.5rem" }}>{filtered[0].excerpt}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "0.875rem", color: "#1A1A1A" }}>{filtered[0].author}</p>
                  <div style={{ display: "flex", gap: "0.75rem", color: "#6B6B5A", marginTop: "0.2rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><MapPin size={11} />{filtered[0].region}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><Clock size={11} />{filtered[0].readTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )}

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "1.5rem" }}>
          {filtered.slice(1).map((s) => (
            <article
              key={s.id}
              onClick={() => setActiveStory(s.id)}
              style={{ backgroundColor: "#EDEAE0", borderRadius: "0.25rem", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <img src={s.img} alt={s.title} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
              <div style={{ padding: "1.25rem" }}>
                <span style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#C4713A" }}>{s.category}</span>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 600, color: "#3A2A22", lineHeight: 1.35, margin: "0.4rem 0 0.75rem" }}>{s.title}</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#4A4A3A", lineHeight: 1.6, marginBottom: "1rem" }}>{s.excerpt.slice(0, 120)}…</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", fontWeight: 600, color: "#1A1A1A" }}>{s.author}</p>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "#6B6B5A" }}>{s.date}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#6B6B5A" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><Heart size={12} /> {s.likes}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}><Clock size={12} /> {s.readTime}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .featured-story-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default function StoriesPage() {
  return (
    <GatedPage featureName="Stories">
      <StoriesContent />
    </GatedPage>
  );
}
