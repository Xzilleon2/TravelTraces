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

export const GAMIFIED_USERS: Record<string, GamifiedUser> = {};
