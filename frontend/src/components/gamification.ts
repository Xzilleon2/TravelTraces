export type BadgeId =
  | "first_step" | "storyteller" | "chronicler" | "cartographer" | "pioneer"
  | "island_hopper" | "mountaineer" | "community_builder" | "challenge_seeker"
  | "challenge_master" | "historian" | "foodie" | "photographer" | "early_bird"
  | "region_runner" | "archipelago_legend";

export type Badge = {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  xp: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
};

export const BADGES: Record<BadgeId, Badge> = {
  first_step:         { id: "first_step",         name: "First Step",          description: "Posted your first story",              icon: "👣", xp: 50,   rarity: "common"    },
  storyteller:        { id: "storyteller",         name: "Storyteller",         description: "Posted 5 stories",                     icon: "✍️", xp: 150,  rarity: "uncommon"  },
  chronicler:         { id: "chronicler",          name: "Chronicler",          description: "Posted 15 stories",                    icon: "📖", xp: 400,  rarity: "rare"      },
  cartographer:       { id: "cartographer",        name: "Cartographer",        description: "Pinned 10 locations",                  icon: "🗺️", xp: 120,  rarity: "common"    },
  pioneer:            { id: "pioneer",             name: "Pioneer",             description: "Pinned 50 locations",                  icon: "🧭", xp: 350,  rarity: "rare"      },
  island_hopper:      { id: "island_hopper",       name: "Island Hopper",       description: "Documented 5 different islands",       icon: "🏝️", xp: 200,  rarity: "uncommon"  },
  mountaineer:        { id: "mountaineer",         name: "Mountaineer",         description: "Documented 3 mountain destinations",   icon: "⛰️", xp: 200,  rarity: "uncommon"  },
  community_builder:  { id: "community_builder",   name: "Community Builder",   description: "Joined 3 communities",                 icon: "🤝", xp: 100,  rarity: "common"    },
  challenge_seeker:   { id: "challenge_seeker",    name: "Challenge Seeker",    description: "Completed your first challenge",       icon: "⚡", xp: 100,  rarity: "common"    },
  challenge_master:   { id: "challenge_master",    name: "Challenge Master",    description: "Completed 10 challenges",              icon: "🏆", xp: 500,  rarity: "epic"      },
  historian:          { id: "historian",           name: "Historian",           description: "Documented 3 UNESCO heritage sites",   icon: "🏛️", xp: 300,  rarity: "rare"      },
  foodie:             { id: "foodie",              name: "Foodie",              description: "Documented 10 food destinations",      icon: "🍜", xp: 150,  rarity: "uncommon"  },
  photographer:       { id: "photographer",        name: "Photographer",        description: "Uploaded 100 photos",                  icon: "📸", xp: 250,  rarity: "rare"      },
  early_bird:         { id: "early_bird",          name: "Early Bird",          description: "One of the first 500 TravelTraces members",   icon: "🌅", xp: 200,  rarity: "epic"      },
  region_runner:      { id: "region_runner",       name: "Region Runner",       description: "Visited all 17 Philippine regions",    icon: "🌺", xp: 600,  rarity: "epic"      },
  archipelago_legend: { id: "archipelago_legend",  name: "Archipelago Legend",  description: "Documented 50 unique destinations",    icon: "🦅", xp: 1000, rarity: "legendary" },
};

export type Level = {
  level: number;
  title: string;
  tagalog: string;
  minXp: number;
  maxXp: number;
  color: string;
};

export const LEVELS: Level[] = [
  { level: 1,  title: "Newcomer",       tagalog: "Baguhan",        minXp: 0,     maxXp: 299,   color: "#9A9A8A" },
  { level: 2,  title: "Wanderer",       tagalog: "Palaboy",        minXp: 300,   maxXp: 699,   color: "#9E6B5C" },
  { level: 3,  title: "Traveler",       tagalog: "Manlalakbay",    minXp: 700,   maxXp: 1399,  color: "#5C8A9E" },
  { level: 4,  title: "Explorer",       tagalog: "Trail Seeker",    minXp: 1400,  maxXp: 2499,  color: "#4A78A8" },
  { level: 5,  title: "Pathfinder",     tagalog: "Tagahanap",      minXp: 2500,  maxXp: 4199,  color: "#9E6B5C" },
  { level: 6,  title: "Voyager",        tagalog: "Route Keeper",    minXp: 4200,  maxXp: 6499,  color: "#C4713A" },
  { level: 7,  title: "Navigator",      tagalog: "Piloto",         minXp: 6500,  maxXp: 9999,  color: "#9B59B6" },
  { level: 8,  title: "Chronicler",     tagalog: "Manunulat",      minXp: 10000, maxXp: 15999, color: "#E67E22" },
  { level: 9,  title: "Archipelago Hero", tagalog: "Bayani",      minXp: 16000, maxXp: 24999, color: "#C0392B" },
  { level: 10, title: "Legend",         tagalog: "Alamat",         minXp: 25000, maxXp: Infinity, color: "#3A2A22" },
];

export function getLevelFromXp(xp: number): Level {
  return LEVELS.slice().reverse().find((l) => xp >= l.minXp) ?? LEVELS[0];
}

export function getXpProgress(xp: number): { current: number; needed: number; pct: number } {
  const lvl = getLevelFromXp(xp);
  if (lvl.maxXp === Infinity) return { current: xp - lvl.minXp, needed: 0, pct: 100 };
  const current = xp - lvl.minXp;
  const needed = lvl.maxXp - lvl.minXp;
  return { current, needed, pct: Math.min(100, (current / needed) * 100) };
}

export type GamifiedUser = {
  id: string;
  name: string;
  avatar: string;
  location: string;
  bio: string;
  xp: number;
  storiesCount: number;
  pinsCount: number;
  challengesCompleted: number;
  communitiesJoined: number;
  badges: BadgeId[];
  isFollowing?: boolean;
  joinedDate: string;
  recentStories: { id: number; title: string; region: string; img: string; date: string; likes: number }[];
};

export const GAMIFIED_USERS: Record<string, GamifiedUser> = {
  carlo: {
    id: "carlo",
    name: "Carlo Reyes",
    avatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=96&h=96&fit=crop&auto=format",
    location: "El Nido, Palawan",
    bio: "Island-hopper and honest travel writer. Tour C and D evangelist. 7 islands this year.",
    xp: 8740,
    storiesCount: 18,
    pinsCount: 62,
    challengesCompleted: 9,
    communitiesJoined: 4,
    badges: ["first_step", "storyteller", "cartographer", "island_hopper", "challenge_seeker", "early_bird", "photographer"],
    joinedDate: "January 2023",
    recentStories: [
      { id: 1, title: "48 Hours in El Nido: What the Guidebooks Don't Tell You", region: "Palawan", img: "https://images.unsplash.com/photo-1632307918787-8cb52566dd35?w=400&h=220&fit=crop&auto=format", date: "12 May 2025", likes: 418 },
      { id: 2, title: "The Secret Coves of Northern Palawan", region: "Palawan", img: "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=400&h=220&fit=crop&auto=format", date: "2 Apr 2025", likes: 231 },
    ],
  },
  ana: {
    id: "ana",
    name: "Ana Villanueva",
    avatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=96&h=96&fit=crop&auto=format",
    location: "Basco, Batanes",
    bio: "Chasing the light in the northernmost province. Photography, Ivatan culture, and sunsets.",
    xp: 14200,
    storiesCount: 24,
    pinsCount: 89,
    challengesCompleted: 14,
    communitiesJoined: 6,
    badges: ["first_step", "storyteller", "chronicler", "cartographer", "pioneer", "island_hopper", "photographer", "early_bird", "challenge_seeker", "challenge_master"],
    joinedDate: "March 2022",
    recentStories: [
      { id: 3, title: "The Road to Batanes: Chasing the Last Frontier's Last Sunsets", region: "Batanes", img: "https://images.unsplash.com/photo-1768639400843-d604ccce9c3e?w=400&h=220&fit=crop&auto=format", date: "3 May 2025", likes: 632 },
      { id: 4, title: "Ivatan Weaving: Keeping an Ancient Art Alive", region: "Batanes", img: "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=400&h=220&fit=crop&auto=format", date: "14 Mar 2025", likes: 387 },
    ],
  },
  ramon: {
    id: "ramon",
    name: "Ramon Dela Cruz",
    avatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=96&h=96&fit=crop&auto=format",
    location: "Banaue, Ifugao",
    bio: "Slow traveler. Three weeks in Banaue changed me. Now I only travel at walking pace.",
    xp: 6100,
    storiesCount: 11,
    pinsCount: 44,
    challengesCompleted: 6,
    communitiesJoined: 3,
    badges: ["first_step", "storyteller", "cartographer", "island_hopper", "mountaineer", "historian", "community_builder", "challenge_seeker"],
    joinedDate: "June 2023",
    recentStories: [
      { id: 5, title: "Three Weeks Among the Ifugao: Rice Terraces and Slow Time", region: "Cordillera", img: "https://images.unsplash.com/photo-1609412058473-c199497c3c5d?w=400&h=220&fit=crop&auto=format", date: "28 Apr 2025", likes: 521 },
    ],
  },
  leila: {
    id: "leila",
    name: "Leila Marcos",
    avatar: "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=96&h=96&fit=crop&auto=format",
    location: "General Luna, Siargao",
    bio: "Post-typhoon Siargao local. Surfer. Community rebuilder. The island is coming back.",
    xp: 11500,
    storiesCount: 21,
    pinsCount: 73,
    challengesCompleted: 11,
    communitiesJoined: 5,
    badges: ["first_step", "storyteller", "chronicler", "cartographer", "island_hopper", "community_builder", "challenge_seeker", "challenge_master", "photographer", "early_bird"],
    joinedDate: "October 2022",
    recentStories: [
      { id: 6, title: "Siargao After the Typhoon: Notes on Return and Resilience", region: "Surigao del Norte", img: "https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=400&h=220&fit=crop&auto=format", date: "20 Apr 2025", likes: 893 },
      { id: 7, title: "Cloud 9 at Dawn: A Surfer's Batangas Journal", region: "Siargao", img: "https://images.unsplash.com/photo-1695051702427-1c24ce3682e7?w=400&h=220&fit=crop&auto=format", date: "5 Mar 2025", likes: 412 },
    ],
  },
  marco: {
    id: "marco",
    name: "Marco Buenaventura",
    avatar: "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=96&h=96&fit=crop&auto=format",
    location: "Angeles, Pampanga",
    bio: "Eating my way through every province. Kapampangan food is the soul of Philippine cuisine.",
    xp: 4800,
    storiesCount: 9,
    pinsCount: 38,
    challengesCompleted: 5,
    communitiesJoined: 3,
    badges: ["first_step", "storyteller", "cartographer", "foodie", "community_builder", "challenge_seeker"],
    joinedDate: "September 2023",
    recentStories: [
      { id: 8, title: "Eating My Way Through Pampanga: The Philippines' Culinary Heart", region: "Pampanga", img: "https://images.unsplash.com/photo-1711060169357-ed923c9f2156?w=400&h=220&fit=crop&auto=format", date: "14 Apr 2025", likes: 734 },
    ],
  },
  sofia: {
    id: "sofia",
    name: "Sofia Reyes",
    avatar: "https://images.unsplash.com/photo-1672933278668-5be5957a8681?w=96&h=96&fit=crop&auto=format",
    location: "Pangasinan",
    bio: "National parks enthusiast. Hundred Islands regular. Found my calling at sea level.",
    xp: 2900,
    storiesCount: 6,
    pinsCount: 28,
    challengesCompleted: 3,
    communitiesJoined: 2,
    badges: ["first_step", "storyteller", "cartographer", "island_hopper", "challenge_seeker"],
    joinedDate: "February 2024",
    recentStories: [
      { id: 9, title: "Hundred Islands: The National Park Nobody Talks About", region: "Pangasinan", img: "https://images.unsplash.com/photo-1688541197205-02bd8c71074d?w=400&h=220&fit=crop&auto=format", date: "8 Apr 2025", likes: 289 },
    ],
  },
};
