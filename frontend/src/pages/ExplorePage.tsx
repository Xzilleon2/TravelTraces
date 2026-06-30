import React, { useState } from "react";
import { Search, MapPin, Star, ArrowLeft, BookOpen, Pin, Users, Camera, Clock, ChevronLeft, ChevronRight, ExternalLink, Compass, Mountain, Waves, Building2, TreePine, Droplets, Anchor, Gem, Landmark, Utensils } from "lucide-react";
import { GatedPage } from "../components/GatedPage";
import { UserProfileModal } from "../components/UserProfileModal";
import { GAMIFIED_USERS, GamifiedUser, getLevelFromXp } from "../components/gamification";

/* ─── Data ─────────────────────────────────────────────────── */

const DESTINATIONS = [
  {
    id: 1,
    name: "El Nido",
    region: "Palawan",
    province: "Palawan",
    terrain: "Islands",
    rating: 4.9,
    reviews: 2140,
    explorers: 847,
    pins: 3240,
    img: "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=800&h=500&fit=crop&auto=format",
    gallery: [
      "https://images.unsplash.com/photo-1632307918787-8cb52566dd35?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1688541197205-02bd8c71074d?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=500&h=350&fit=crop&auto=format",
    ],
    desc: "Dramatic limestone karst cliffs, hidden lagoons, and some of the clearest water in the world.",
    longDesc: "El Nido is the gateway to the Bacuit Archipelago — a cluster of 45 islands and islets in the Sulu Sea. The municipality sits at the northern tip of Palawan and is surrounded by some of the most dramatic scenery in Southeast Asia: vertical limestone cliffs rising from turquoise water, secret beaches accessible only by kayak, and coral reefs that shelter hundreds of marine species.\n\nThe town itself has grown from a fishing village into a thriving travel destination, though it retains much of its barangay-scale charm. Electricity arrived only in the 1990s. The best time to visit is November through April, when the sea is calm enough for island-hopping tours. The signature experiences are Tour A (Big and Small Lagoons) and Tour C (Secret Beach, Shimizu Island), though the lesser-known Tour D offers quieter waters and more exclusive coves.\n\nThe reef system around Bacuit Bay is part of the Coral Triangle and among the most biodiverse marine environments on Earth. Responsible tourism is a growing concern — many barangay councils now enforce visitor caps and require permits for cave and lagoon access.",
    tags: ["Island hopping", "Snorkelling", "Photography", "Kayaking"],
    bestMonths: "Nov – Apr",
    difficulty: "Easy",
    highlights: ["Bacuit Archipelago", "Big & Small Lagoon", "Nacpan Twin Beach", "Secret Beach", "Shimizu Island"],
    contributors: ["carlo", "ana", "sofia"],
    stories: [
      { title: "48 Hours in El Nido: What the Guidebooks Don't Tell You", author: "Carlo Reyes", authorKey: "carlo", likes: 418, date: "12 May 2025" },
      { title: "The Secret Coves of Northern Palawan", author: "Ana Villanueva", authorKey: "ana", likes: 231, date: "2 Apr 2025" },
      { title: "Hundred Islands to El Nido: A Solo Journey", author: "Sofia Reyes", authorKey: "sofia", likes: 189, date: "15 Mar 2025" },
    ],
    color: "#2D4A2D",
  },
  {
    id: 2,
    name: "Batanes Islands",
    region: "Cagayan Valley",
    province: "Batanes",
    terrain: "Highlands",
    rating: 4.8,
    reviews: 840,
    explorers: 312,
    pins: 1180,
    img: "https://images.unsplash.com/photo-1768639400843-d604ccce9c3e?w=800&h=500&fit=crop&auto=format",
    gallery: [
      "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1688541197205-02bd8c71074d?w=500&h=350&fit=crop&auto=format",
    ],
    desc: "The Philippines' northernmost province — rolling hills, stone houses, and the spirit of the Ivatans.",
    longDesc: "Batanes is unlike anywhere else in the Philippines. The three main islands — Batan, Sabtang, and Itbayat — sit closer to Taiwan than to Manila, and they feel it: the architecture, the food, and the pace of life belong to a culture shaped by isolation and typhoons for centuries.\n\nThe Ivatan people built their homes from limestone and cogon grass to withstand the fierce typhoon seasons that batter the islands each year. These stone houses, called sinadumparan, have survived for hundreds of years and remain inhabited today. The vatang, a raincoat woven from voyavoy palm leaves, is still worn by fishermen when the seas turn rough.\n\nBatanes is one of the hardest places to reach in the Philippines — flights from Tuguegarao are infrequent and subject to cancellation by weather — which keeps visitor numbers low and the islands remarkably unspoiled. The rolling hills of Batan, the cliff roads of Sabtang, and the volcanic caldera of Iraya are among the most photographed landscapes in the country.",
    tags: ["Culture", "Trekking", "Photography", "Heritage"],
    bestMonths: "Mar – Jun",
    difficulty: "Moderate",
    highlights: ["Naidi Hills Lighthouse", "Valugan Boulder Beach", "Chavayan Village", "Marlboro Hills", "Sabtang Island"],
    contributors: ["ana", "ramon"],
    stories: [
      { title: "The Road to Batanes: Chasing the Last Frontier's Last Sunsets", author: "Ana Villanueva", authorKey: "ana", likes: 632, date: "3 May 2025" },
      { title: "Ivatan Weaving: Keeping an Ancient Art Alive", author: "Ramon Dela Cruz", authorKey: "ramon", likes: 387, date: "14 Mar 2025" },
    ],
    color: "#5C8A9E",
  },
  {
    id: 3,
    name: "Banaue Rice Terraces",
    region: "Cordillera",
    province: "Ifugao",
    terrain: "Mountains",
    rating: 4.7,
    reviews: 1320,
    explorers: 531,
    pins: 2100,
    img: "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=800&h=500&fit=crop&auto=format",
    gallery: [
      "https://images.unsplash.com/photo-1768639400843-d604ccce9c3e?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1632307918787-8cb52566dd35?w=500&h=350&fit=crop&auto=format",
    ],
    desc: "Two-thousand-year-old rice terraces carved into the Cordillera mountains. An engineering wonder.",
    longDesc: "The Ifugao Rice Terraces are among the greatest feats of pre-colonial engineering in the world. Carved into the mountains of Ifugao province over 2,000 years by the Ifugao people, the terraces follow the natural contours of the mountains and use a sophisticated irrigation system — the muyong — that channels water from privately maintained forest ponds through bamboo pipes to each terrace level.\n\nThe Banaue Terraces are the most accessible cluster, but the most spectacular are in Batad — a circular amphitheatre of terraces that requires a 40-minute walk from the nearest road. Other notable clusters include Bangaan and Hapao. The terraces are a UNESCO World Heritage Site and are considered a living cultural landscape, meaning they are still actively farmed by Ifugao families using traditional methods.\n\nThe best time to visit is during the planting season (June–July) when the terraces are flooded and reflect the sky, or during harvest (October–November) when they glow golden. The mumbakit, traditional Ifugao priests, still perform agricultural rituals tied to the planting and harvest cycles.",
    tags: ["UNESCO", "Culture", "Trekking", "Photography"],
    bestMonths: "Jun – Nov",
    difficulty: "Moderate–Hard",
    highlights: ["Batad Amphitheatre", "Bangaan Terraces", "Banaue Viewpoint", "Tappiya Falls", "Ifugao Village"],
    contributors: ["ramon", "ana"],
    stories: [
      { title: "Three Weeks Among the Ifugao: Rice Terraces and Slow Time", author: "Ramon Dela Cruz", authorKey: "ramon", likes: 521, date: "28 Apr 2025" },
      { title: "Batad: The Terrace Bowl That Changed My Life", author: "Ana Villanueva", authorKey: "ana", likes: 298, date: "10 Feb 2025" },
    ],
    color: "#C4713A",
  },
  {
    id: 4,
    name: "Siargao Island",
    region: "Surigao del Norte",
    province: "Surigao del Norte",
    terrain: "Islands",
    rating: 4.8,
    reviews: 1890,
    explorers: 724,
    pins: 2890,
    img: "https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=800&h=500&fit=crop&auto=format",
    gallery: [
      "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1688541197205-02bd8c71074d?w=500&h=350&fit=crop&auto=format",
    ],
    desc: "The surfing capital of the Philippines. Cloud 9, island hopping, and laid-back island life.",
    longDesc: "Siargao is a teardrop-shaped island in the Philippine Sea that has become one of Southeast Asia's premier surf destinations. The Cloud 9 break — a hollow, powerful right-hand barrel that breaks over a shallow reef — has put Siargao on the world surf map and hosts an international surfing competition each year.\n\nBeyond surfing, Siargao offers one of the most diverse island-hopping routes in the Philippines: Naked Island, Daku Island, and Guyam Island form a classic day trip that combines bare sandbars, coconut groves, and calm swimming lagoons. The lagoon system north of General Luna — Sugba Lagoon in Del Carmen — is one of the most photographed spots in the country.\n\nTyphoon Odette struck in December 2021 and caused widespread destruction. The island has rebuilt significantly, and most tourism infrastructure is operational. The coconut palms are regrown to perhaps a third of their former height, giving the landscape a different but still beautiful character. The community's resilience has become part of Siargao's identity.",
    tags: ["Surfing", "Island hopping", "Nightlife", "Community"],
    bestMonths: "Mar – Oct",
    difficulty: "Easy",
    highlights: ["Cloud 9 Break", "Sugba Lagoon", "Naked Island", "Magpupungko Rock Pools", "General Luna"],
    contributors: ["leila", "carlo", "ana"],
    stories: [
      { title: "Siargao After the Typhoon: Notes on Return and Resilience", author: "Leila Marcos", authorKey: "leila", likes: 893, date: "20 Apr 2025" },
      { title: "Cloud 9 at Dawn: A Surfer's Journal", author: "Carlo Reyes", authorKey: "carlo", likes: 312, date: "1 Mar 2025" },
      { title: "Island Hopping Siargao: The Full Loop", author: "Ana Villanueva", authorKey: "ana", likes: 247, date: "12 Feb 2025" },
    ],
    color: "#7A9E6F",
  },
  {
    id: 5,
    name: "Chocolate Hills",
    region: "Bohol",
    province: "Bohol",
    terrain: "Highlands",
    rating: 4.6,
    reviews: 1650,
    explorers: 618,
    pins: 1940,
    img: "https://images.unsplash.com/photo-1616382093586-84ed7932c216?w=800&h=500&fit=crop&auto=format",
    gallery: [
      "https://images.unsplash.com/photo-1632307918787-8cb52566dd35?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1768639400843-d604ccce9c3e?w=500&h=350&fit=crop&auto=format",
    ],
    desc: "Over 1,200 perfectly cone-shaped hills that turn chocolate brown during dry season. Otherworldly.",
    longDesc: "The Chocolate Hills are one of the most geologically unique formations in the Philippines. More than 1,200 perfectly symmetrical, grass-covered limestone hills rise from the flat agricultural plains of Bohol's interior — when the grass dries during the dry season (December–May), the hills turn a uniform chocolate brown, giving the formation its name.\n\nThe exact mechanism of their formation is still debated by geologists. The most widely accepted theory suggests they are marine limestone deposits shaped by weathering over millions of years. They were declared a National Geological Monument in 1988 and are a candidate UNESCO World Heritage Site.\n\nBohol is also home to the Tarsier Sanctuary — where the Philippine tarsier, one of the world's smallest primates, lives in a protected forest habitat — and the Loboc River, where floating restaurants and riverside communities offer a glimpse of rural Bohol life. The Chocolate Hills Complex near Carmen has a viewing platform at the top of one hill, though the dawn view from Sagbayan Peak is considered more dramatic.",
    tags: ["Iconic", "Photography", "Cycling", "Nature"],
    bestMonths: "Dec – May",
    difficulty: "Easy",
    highlights: ["Carmen Viewing Complex", "Sagbayan Peak", "Tarsier Sanctuary", "Loboc River", "Man-Made Forest"],
    contributors: ["sofia", "marco"],
    stories: [
      { title: "Bohol in 72 Hours: Hills, Tarsiers, and River Food", author: "Sofia Reyes", authorKey: "sofia", likes: 341, date: "5 Apr 2025" },
      { title: "Cycling the Chocolate Hills at Dawn", author: "Marco Buenaventura", authorKey: "marco", likes: 218, date: "20 Jan 2025" },
    ],
    color: "#9E6B5C",
  },
  {
    id: 6,
    name: "Coron Bay",
    region: "Palawan",
    province: "Palawan",
    terrain: "Islands",
    rating: 4.9,
    reviews: 1240,
    explorers: 489,
    pins: 1820,
    img: "https://images.unsplash.com/photo-1688541197205-02bd8c71074d?w=800&h=500&fit=crop&auto=format",
    gallery: [
      "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1616382093586-84ed7932c216?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=500&h=350&fit=crop&auto=format",
    ],
    desc: "World-class wreck diving, pristine lakes hidden in karst cliffs, and stunning sunsets over Coron town.",
    longDesc: "Coron is the diving capital of the Philippines. During World War II, a Japanese naval fleet sought shelter here from American air attack and was sunk on September 24, 1944. The resulting collection of wartime wrecks — including the Okikawa Maru, Irako, and Kogyo Maru — now lie at depths of 10 to 40 metres and are among the most spectacular wreck dives in the world, encrusted with coral and home to vast populations of fish.\n\nAbove the water, Coron's landscape is equally dramatic. The Kayangan Lake is consistently rated the cleanest lake in Asia and is accessed through a limestone cliff via a short but steep hike. Barracuda Lake, nearby, has a thermocline where fresh and salt water meet at radically different temperatures — divers descend through warm fresh water and enter cold salt water a few metres below the surface.\n\nCoron town, on Busuanga Island, retains the character of a fishing and trading port. The Maquinit Hot Springs are the only saltwater hot springs in the Philippines. The sunsets from the hill behind town, watched from any number of rooftop restaurants, are among the best in the archipelago.",
    tags: ["Diving", "Island hopping", "Photography", "Heritage"],
    bestMonths: "Nov – May",
    difficulty: "Easy–Moderate",
    highlights: ["WWII Wreck Diving", "Kayangan Lake", "Barracuda Lake", "Maquinit Hot Springs", "Twin Lagoon"],
    contributors: ["carlo", "leila", "sofia"],
    stories: [
      { title: "Coron's Hidden Lakes: Beyond the Wreck Dives", author: "Carlo Reyes", authorKey: "carlo", likes: 412, date: "18 Apr 2025" },
      { title: "Diving the Japanese Fleet: Coron's WWII Wrecks", author: "Leila Marcos", authorKey: "leila", likes: 567, date: "5 Mar 2025" },
      { title: "Kayangan Lake at 5am: Empty and Perfect", author: "Sofia Reyes", authorKey: "sofia", likes: 289, date: "28 Jan 2025" },
    ],
    color: "#4A78A8",
  },
  {
    id: 7,
    name: "Vigan City",
    region: "Ilocos Sur",
    province: "Ilocos Sur",
    terrain: "Urban",
    rating: 4.5,
    reviews: 980,
    explorers: 392,
    pins: 1430,
    img: "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=800&h=500&fit=crop&auto=format",
    gallery: [
      "https://images.unsplash.com/photo-1711060169357-ed923c9f2156?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1688541197205-02bd8c71074d?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1632307918787-8cb52566dd35?w=500&h=350&fit=crop&auto=format",
    ],
    desc: "The best-preserved Spanish colonial city in Southeast Asia. Cobblestones, ancestral houses, longganisa.",
    longDesc: "Vigan is the most intact example of a Spanish colonial trading town in Asia. Founded in the 16th century by Juan de Salcedo, the city served as the commercial and political hub of northern Luzon throughout Spanish rule. Its street plan, architecture, and the material culture of its inhabitants reflect 300 years of interaction between indigenous Ilocano culture, Spanish colonialism, and Chinese trade.\n\nThe heritage zone — centred on Calle Crisologo and the surrounding streets — is a UNESCO World Heritage Site. The ancestral houses that line the cobblestone streets are a unique hybrid: Chinese-influenced ground floors built for commerce, Spanish-style upper floors with capiz shell windows and sliding wooden shutters, all unified by the distinctive yellow-ochre render of the facades.\n\nVigan's food culture is as distinctive as its architecture. Ilocano cuisine is defined by fermentation, simplicity, and the bold use of pork: the longganisa here is garlicky and slightly sour; the bagnet is arguably the best fried pork dish in the Philippines; the pinakbet uses vegetables grown in the surrounding Ilocos plains.",
    tags: ["Heritage", "Food", "Architecture", "UNESCO"],
    bestMonths: "Nov – Apr",
    difficulty: "Easy",
    highlights: ["Calle Crisologo", "Plaza Salcedo", "Bantay Bell Tower", "Syquia Mansion", "Burnay Pottery"],
    contributors: ["marco", "ramon"],
    stories: [
      { title: "Vigan on Foot: A Day in the Heritage Zone", author: "Marco Buenaventura", authorKey: "marco", likes: 312, date: "15 Apr 2025" },
      { title: "The Food of Ilocos: Longganisa, Bagnet, and Beyond", author: "Ramon Dela Cruz", authorKey: "ramon", likes: 428, date: "2 Mar 2025" },
    ],
    color: "#9E6B5C",
  },
  {
    id: 8,
    name: "Camiguin Island",
    region: "Northern Mindanao",
    province: "Camiguin",
    terrain: "Islands",
    rating: 4.7,
    reviews: 720,
    explorers: 281,
    pins: 1050,
    img: "https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=800&h=500&fit=crop&auto=format",
    gallery: [
      "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=500&h=350&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1768639400843-d604ccce9c3e?w=500&h=350&fit=crop&auto=format",
    ],
    desc: "More volcanoes than any other island its size. Hot springs, cold springs, waterfalls, and white island.",
    longDesc: "Camiguin is a small island in Northern Mindanao with more volcanoes per square kilometre than anywhere else in the Philippines. The island itself was formed by volcanic activity and continues to be shaped by it: Hibok-Hibok, the most active volcano, last erupted in 1953 and remains closely monitored. The volcanic geology gives Camiguin its extraordinary diversity of natural features: hot springs that bubble up at the ocean's edge, cold springs in mountain forest, waterfalls fed by year-round rainfall, and the sunken cemetery — a village graveyard that sank beneath the sea during an 1871 eruption and is now visible beneath the water's surface, marked by a large cross.\n\nWhite Island, a tiny uninhabited sandbar visible from the mainland, is one of the most photographed places in Mindanao — a white crescent surrounded by turquoise water with Hibok-Hibok in the background. The Ardent Hot Springs, fed by volcanic heat, are a popular evening soak. The Katibawasan Falls drop 70 metres into a cool pool surrounded by dense forest.\n\nCamiguin's pace is quiet, its roads are calm, and its food is centred on lanzones — the fruit that defines the island's annual October festival.",
    tags: ["Volcanoes", "Springs", "Diving", "Nature"],
    bestMonths: "Mar – Sep",
    difficulty: "Easy–Moderate",
    highlights: ["White Island", "Ardent Hot Springs", "Sunken Cemetery", "Katibawasan Falls", "Hibok-Hibok"],
    contributors: ["leila", "sofia"],
    stories: [
      { title: "Camiguin: The Island Born from Fire", author: "Leila Marcos", authorKey: "leila", likes: 378, date: "22 Mar 2025" },
      { title: "Swimming Over the Sunken Cemetery", author: "Sofia Reyes", authorKey: "sofia", likes: 291, date: "8 Feb 2025" },
    ],
    color: "#7A9E6F",
  },
];

const travelCategories = ["All", "Hiking", "Food Place", "Hidden Gems", "Beaches", "Forest", "Culture", "More"];

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

function destinationText(destination: typeof DESTINATIONS[number]) {
  return `${destination.name} ${destination.region} ${destination.province} ${destination.terrain} ${destination.tags.join(" ")} ${destination.highlights.join(" ")} ${destination.desc} ${destination.longDesc}`.toLowerCase();
}

function destinationMatchesCategory(destination: typeof DESTINATIONS[number], category: string) {
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

function destinationCategory(destination: typeof DESTINATIONS[number]) {
  if (destinationMatchesCategory(destination, "Food Place")) return "Food Place";
  if (destinationMatchesCategory(destination, "Culture")) return "Culture";
  if (destinationMatchesCategory(destination, "Hiking")) return "Hiking";
  if (destinationMatchesCategory(destination, "Forest")) return "Forest";
  if (destinationMatchesCategory(destination, "Hidden Gems")) return "Hidden Gems";
  if (destinationMatchesCategory(destination, "Beaches")) return "Beaches";
  return "More";
}

/* ─── Destination Guide View ──────────────────────────────── */

function DestinationGuideView({ dest, onBack }: { dest: typeof DESTINATIONS[0]; onBack: () => void }) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [viewingProfile, setViewingProfile] = useState<GamifiedUser | null>(null);

  const allImages = [dest.img, ...dest.gallery];
  const category = destinationCategory(dest);
  const CategoryIcon = CATEGORY_ICON[category] ?? Compass;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F0E8", padding: "2rem clamp(1rem, 4vw, 2rem) 5rem" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", background: "transparent", border: "none", color: "#2D4A2D", fontFamily: "var(--font-ui)", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", padding: "0.25rem 0", marginBottom: "1.5rem" }}>
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
              <span style={{ fontFamily: "var(--font-label)", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#7A9E6F" }}>Visit guide</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.4rem, 7vw, 5.25rem)", fontWeight: 600, color: "#2D4A2D", lineHeight: 0.95, margin: 0, maxWidth: 760 }}>{dest.name}</h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "#3A3A2A", lineHeight: 1.65, margin: "1rem 0 0", maxWidth: 760 }}>{dest.desc}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(96px, 1fr))", gap: "0.65rem", minWidth: 230 }} className="dest-guide-stats">
            {[
              { label: "Rating", value: dest.rating.toFixed(1) },
              { label: "Reviews", value: dest.reviews.toLocaleString() },
              { label: "Best", value: dest.bestMonths },
              { label: "Level", value: dest.difficulty },
            ].map((item) => (
              <div key={item.label} style={{ backgroundColor: "#EDEAE0", border: "1px solid rgba(45,74,45,0.1)", borderRadius: "0.45rem", padding: "0.8rem" }}>
                <div style={{ fontFamily: "var(--font-label)", fontSize: "0.62rem", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6B6B5A" }}>{item.label}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 600, color: "#1A1A1A", marginTop: "0.2rem" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </header>

        {/* Hero photo carousel */}
        <div style={{ position: "relative", marginBottom: "2rem", overflow: "hidden", borderRadius: "0.5rem", backgroundColor: "#EDEAE0" }}>
          <img src={allImages[galleryIndex]} alt={dest.name} style={{ width: "100%", height: "clamp(320px, 56vw, 620px)", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.04) 45%, rgba(20,30,20,0.62) 100%)" }} />

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
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 600, color: "#2D4A2D", margin: "0 0 1rem", lineHeight: 1.1 }}>A destination worth planning around</h2>
                {dest.longDesc.split("\n\n").map((p, i) => (
                  <p key={i} style={{ fontFamily: "var(--font-body)", fontSize: "1.03rem", color: "#3A3A2A", lineHeight: 1.85, marginBottom: "1rem" }}>{p}</p>
                ))}
              </div>

              {/* Highlights */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#2D4A2D", marginBottom: "0.875rem" }}>Must-see Highlights</h3>
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
                  <BookOpen size={16} color="#2D4A2D" />
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "#2D4A2D", margin: 0 }}>Explorer Stories</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {dest.stories.map((s, i) => {
                    const gu = GAMIFIED_USERS[s.authorKey];
                    const lv = gu ? getLevelFromXp(gu.xp) : null;
                    return (
                      <div key={i} style={{ display: "flex", gap: "0.875rem", padding: "1rem", backgroundColor: "#EDEAE0", borderRadius: "0.5rem", alignItems: "flex-start" }}>
                        <button onClick={() => gu && setViewingProfile(gu)} style={{ background: "none", border: "none", cursor: gu ? "pointer" : "default", padding: 0, flexShrink: 0 }}>
                          {gu ? (
                            <div style={{ position: "relative" }}>
                              <img src={gu.avatar} alt={gu.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: `2px solid ${lv?.color ?? "#7A9E6F"}` }} />
                              {lv && <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", backgroundColor: lv.color, color: "#F5F0E8", fontFamily: "var(--font-label)", fontSize: "0.45rem", fontWeight: 800, padding: "0.08rem 0.28rem", borderRadius: "2rem", whiteSpace: "nowrap" }}>LV{lv.level}</div>}
                            </div>
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#D8D4C8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <BookOpen size={16} color="#6B6B5A" />
                            </div>
                          )}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: "var(--font-display)", fontSize: "0.975rem", fontWeight: 600, color: "#2D4A2D", lineHeight: 1.3, margin: "0 0 0.4rem" }}>{s.title}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <button onClick={() => gu && setViewingProfile(gu)} style={{ background: "none", border: "none", cursor: gu ? "pointer" : "default", padding: 0, fontFamily: "var(--font-ui)", fontSize: "0.78rem", fontWeight: 600, color: "#3A3A2A" }}>{s.author}</button>
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
              <div style={{ backgroundColor: "#EDEAE0", border: "1px solid rgba(45,74,45,0.1)", borderRadius: "0.5rem", padding: "1.25rem" }}>
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
              <div style={{ backgroundColor: "#EDEAE0", border: "1px solid rgba(45,74,45,0.1)", borderRadius: "0.5rem", padding: "1.25rem" }}>
                <p style={{ fontFamily: "var(--font-label)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B6B5A", marginBottom: "0.625rem" }}>Activities</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {dest.tags.map((t) => (
                    <span key={t} style={{ padding: "0.25rem 0.7rem", backgroundColor: `${dest.color}18`, border: `1px solid ${dest.color}40`, borderRadius: "2rem", fontSize: "0.72rem", fontFamily: "var(--font-label)", color: dest.color, letterSpacing: "0.04em" }}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Explorers who've been here */}
              <div style={{ backgroundColor: "#EDEAE0", border: "1px solid rgba(45,74,45,0.1)", borderRadius: "0.5rem", padding: "1.25rem" }}>
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
                      <button key={key} onClick={() => setViewingProfile(gu)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: i > 0 ? -10 : 0, position: "relative", zIndex: dest.contributors.length - i }}>
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
                      <button key={key} onClick={() => setViewingProfile(gu)} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.75rem", backgroundColor: "#F5F0E8", borderRadius: "0.5rem", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.12s" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8D4C8")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F5F0E8")}>
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

      {viewingProfile && <UserProfileModal user={viewingProfile} onClose={() => setViewingProfile(null)} />}

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

function DestinationCard({ d, onClick }: { d: typeof DESTINATIONS[0]; onClick: () => void; key?: any }) {
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
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(20,30,20,0.65) 100%)" }} />

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
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 600, color: "#2D4A2D", lineHeight: 1.2, marginBottom: "0.2rem" }}>{d.name}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
            <MapPin size={12} color="#7A9E6F" />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "#6B6B5A" }}>{d.region}</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#9A9A8A" }}>·</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "#6B6B5A" }}>{d.terrain}</span>
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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<typeof DESTINATIONS[0] | null>(null);

  const filtered = DESTINATIONS.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.region.toLowerCase().includes(search.toLowerCase()) || d.province.toLowerCase().includes(search.toLowerCase());
    const matchCategory = destinationMatchesCategory(d, category);
    return matchSearch && matchCategory;
  });

  if (selected) {
    return <DestinationGuideView dest={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F0E8", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontFamily: "var(--font-label)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A9E6F", marginBottom: "0.5rem" }}>Destination browser</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#2D4A2D", marginBottom: "0.5rem" }}>Explore</h1>
          <p style={{ fontFamily: "var(--font-body)", color: "#6B6B5A", fontSize: "1rem" }}>Browse beaches, hikes, food places, forests, hidden gems, and culture-rich destinations from the TravelTraces community.</p>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#6B6B5A" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destinations, regions, provinces..."
              style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", backgroundColor: "#EDEAE0", border: "1px solid rgba(45,74,45,0.15)", borderRadius: "0.25rem", fontSize: "0.9rem", color: "#1A1A1A", fontFamily: "var(--font-ui)", outline: "none", boxSizing: "border-box" }}
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
                    borderColor: isActive ? "#2D4A2D" : "rgba(45,74,45,0.2)",
                    backgroundColor: isActive ? "#2D4A2D" : "transparent",
                    color: isActive ? "#F5F0E8" : "#2D4A2D",
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
                  {!isAll && <Icon size={14} color={isActive ? "#F5F0E8" : "#7A9E6F"} style={{ flexShrink: 0 }} />}
                  <span>{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.5rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#C4713A", display: "inline-block" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#C4713A", fontFamily: "var(--font-ui)" }}>{filtered.length}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#6B6B5A", fontFamily: "var(--font-ui)" }}>destinations found</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.5rem" }}>
          {filtered.map((d) => (
            <DestinationCard key={d.id} d={d} onClick={() => setSelected(d)} />
          ))}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .category-pill:hover { background-color: rgba(45,74,45,0.08); border-color: #2D4A2D; color: #2D4A2D; }
        .category-pill[aria-pressed="true"]:hover { background-color: #2D4A2D; border-color: #2D4A2D; color: #F5F0E8; }
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
