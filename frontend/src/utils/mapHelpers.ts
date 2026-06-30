export interface Companion {
  id: number;
  name: string;
  location: string;
  avatar: string;
  bio: string;
  x: number; // Percent on map SVG
  y: number; // Percent on map SVG
}

export interface MidpointHub {
  name: string;
  region: string;
  x: number;
  y: number;
  desc: string;
  image: string;
}

export interface Pin {
  id: number;
  name: string;
  region: string;
  x: number;
  y: number;
  type: "visited" | "wishlist";
  category: string;
  note: string;
  author: string;
  authorAvatar?: string;
  isPrivate: boolean; // true = only I can see; false = other users' pins
  isBold?: boolean;
  isItalic?: boolean;
  isQuote?: boolean;
  align?: "left" | "center" | "right";
  isBullet?: boolean;
  date?: string;
  imageUrl?: string;
}

export const COMPANIONS_DATA: Companion[] = [
  { id: 1, name: "Carlo Reyes", location: "Cebu City", avatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=80&h=80&fit=crop&auto=format", bio: "Freediving instructor and island hopper. Visayas-based, born in Leyte.", x: 55, y: 57 },
  { id: 2, name: "Ana Villanueva", location: "Quezon City", avatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=80&h=80&fit=crop&auto=format", bio: "Travel writer and photographer. Batanes is my second home.", x: 48, y: 32 },
  { id: 3, name: "Ramon Dela Cruz", location: "Baguio City", avatar: "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=80&h=80&fit=crop&auto=format", bio: "Cultural explorer and long-form writer. Cordillera born.", x: 47, y: 25 },
  { id: 4, name: "Leila Marcos", location: "Davao City", avatar: "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=80&h=80&fit=crop&auto=format", bio: "Mindanao advocate and surf coach based in Siargao.", x: 70, y: 74 },
  { id: 5, name: "Marco Buenaventura", location: "Manila", avatar: "https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=80&h=80&fit=crop&auto=format", bio: "Food and travel. Pampanga to Mindanao, one meal at a time.", x: 48, y: 35 },
  { id: 6, name: "Sofia Reyes", location: "Iloilo City", avatar: "https://images.unsplash.com/photo-1688541197205-02bd8c71074d?w=80&h=80&fit=crop&auto=format", bio: "Hidden gems specialist. Visayas-based, always planning the next escape.", x: 42, y: 56 }
];

export const MIDPOINT_HUBS: MidpointHub[] = [
  {
    name: "Puerto Galera",
    region: "Oriental Mindoro",
    x: 38,
    y: 47,
    desc: "Pristine beaches and world-class scuba diving. An accessible tropical escape perfectly located between Southern Luzon and the Visayas.",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=300&h=200&fit=crop&auto=format"
  },
  {
    name: "Dumaguete",
    region: "Negros Oriental",
    x: 48,
    y: 64,
    desc: "The Gentle People's City. Famous for Apo Island's diving, coastal walks, and university vibes. A perfect mid-point bridging Visayas and Mindanao.",
    image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=300&h=200&fit=crop&auto=format"
  },
  {
    name: "Cagayan de Oro",
    region: "Northern Mindanao",
    x: 65,
    y: 68,
    desc: "The Golden Friendship City. Noted for wild river rapids, cave spelunking, and high ridges. The ultimate meeting junction for southern adventurers.",
    image: "https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?w=300&h=200&fit=crop&auto=format"
  },
  {
    name: "Romblon Island",
    region: "Romblon",
    x: 48,
    y: 49,
    desc: "The marble capital with incredible hidden sandbars, marine reserves, and a tranquil atmosphere away from heavy resort traffic.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=200&fit=crop&auto=format"
  },
  {
    name: "Bohol (Chocolate Hills)",
    region: "Bohol",
    x: 62,
    y: 59,
    desc: "A mesmerizing visual dream. Home of the symmetrical mounds, the world's smallest primates (tarsiers), and beautiful rivers. A central crossroad.",
    image: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=300&h=200&fit=crop&auto=format"
  },
  {
    name: "Legazpi City",
    region: "Albay",
    x: 57,
    y: 41,
    desc: "Lies in the shadow of Mount Mayon's legendary perfect cone volcanic symmetry. Filled with culinary heat and rocky ATV paths.",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=300&h=200&fit=crop&auto=format"
  },
  {
    name: "Coron",
    region: "Palawan",
    x: 25,
    y: 55,
    desc: "A dramatic network of hidden freshwater lagoons, historic deep shipwrecks, and razor-sharp limestone towers rising out of emerald bays.",
    image: "https://images.unsplash.com/photo-1632307918787-8cb52566dd35?w=300&h=200&fit=crop&auto=format"
  }
];

// Distance calculations in KM based on Philippine scale factors
// 100% Y is ~1850km (so 1% is 18.5km)
// 100% X is ~1100km (so 1% is 11.0km)
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = (x2 - x1) * 11.0;
  const dy = (y2 - y1) * 18.5;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

// Map screen space % to closest region label
export function getRegionFromCoordinates(x: number, y: number): string {
  if (y < 20) return "Batanes / Cagayan Valley";
  if (y < 42) return x < 40 ? "Mindoro / West Luzon" : "Metro Manila / Central Luzon";
  if (y < 55) return x < 30 ? "Northern Palawan" : "Bicol Region";
  if (y < 67) {
    if (x < 32) return "Palawan (El Nido/Puerto Princesa)";
    if (x < 52) return "Western Visayas (Panay/Iloilo)";
    return "Central & Eastern Visayas (Cebu/Bohol/Samar)";
  }
  return x < 60 ? "Northern Mindanao" : "Southern Mindanao (Davao)";
}

export const INITIAL_PINS: Pin[] = [
  // User's private pins (isPrivate: true)
  {
    id: 101,
    name: "Intramuros Wanders & Sorbetes",
    region: "Metro Manila / Central Luzon",
    x: 48,
    y: 35,
    type: "visited",
    category: "Food",
    note: "Tasted the local mango and cheese dirty ice cream (sorbetes) leaning against four-century-old stone walls. Best local snack in town.",
    author: "You",
    isPrivate: true,
    isItalic: true,
    align: "left",
    imageUrl: "https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?w=800&h=600&fit=crop"
  },
  {
    id: 102,
    name: "Mount Pulag Cold Slumbers",
    region: "Metro Manila / Central Luzon",
    x: 47,
    y: 23,
    type: "wishlist",
    category: "Adventure",
    note: "Need to climb before December! Hope to witness the sea of clouds and freezing early temperatures at the grassland summit.",
    author: "You",
    isPrivate: true,
    isBold: true,
    align: "center",
    imageUrl: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800&h=600&fit=crop"
  },
  {
    id: 103,
    name: "Oslob Whale Shark Snorkel",
    region: "Central & Eastern Visayas (Cebu/Bohol/Samar)",
    x: 55,
    y: 59,
    type: "visited",
    category: "Hidden Gems",
    note: "Witnessed majestic ocean giants swimming peacefully. Left at 4:30 AM to beat the crowd.",
    author: "You",
    isPrivate: true,
    isQuote: true,
    align: "left",
    imageUrl: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&h=600&fit=crop"
  },

  // Public pins by other community users (isPrivate: false)
  {
    id: 1,
    name: "El Nido Deep Secret Lagoons",
    region: "Palawan (El Nido/Puerto Princesa)",
    x: 20,
    y: 62,
    type: "visited",
    category: "Adventure",
    note: "Island hopped Tour A and B. Best snorkelling at Shimizu. Kayaking in the big lagoon feels like visiting another planet with crystal blue visual vibes.",
    author: "Carlo Reyes",
    authorAvatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=80&h=80&fit=crop&auto=format",
    isPrivate: false,
    align: "left",
    imageUrl: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&h=600&fit=crop"
  },
  {
    id: 2,
    name: "Coron Wreck Snorkel & Dive",
    region: "Northern Palawan",
    x: 25,
    y: 55,
    type: "visited",
    category: "Hidden Gems",
    note: "Wreck diving at Lusong Gunboat. Beautiful corals climbing over old metal skeletons. Slept under the stars in Coron town.",
    author: "Carlo Reyes",
    authorAvatar: "https://images.unsplash.com/photo-1519101739220-83f6a14852ca?w=80&h=80&fit=crop&auto=format",
    isPrivate: false,
    align: "left",
    isItalic: true,
    imageUrl: "https://images.unsplash.com/photo-1632307918787-8cb52566dd35?w=800&h=600&fit=crop"
  },
  {
    id: 3,
    name: "Batanes Scooter Coastal Tour",
    region: "Batanes / Cagayan Valley",
    x: 48,
    y: 8,
    type: "visited",
    category: "Culture",
    note: "Rode a scooter around Batan Island. Uninterrupted waves hitting rolling pasture land. The Stone houses at Honesty Coffee Shop are phenomenal.",
    author: "Ana Villanueva",
    authorAvatar: "https://images.unsplash.com/photo-1601632650940-3903583a835d?w=80&h=80&fit=crop&auto=format",
    isPrivate: false,
    align: "center",
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop"
  },
  {
    id: 4,
    name: "Siargao Surf at Cloud 9",
    region: "Central & Eastern Visayas (Cebu/Bohol/Samar)",
    x: 78,
    y: 60,
    type: "wishlist",
    category: "Adventure",
    note: "Want to learn to surf at Cloud 9! Visited once briefly after the typhoon, now returning for proper local living lessons and barrel riding.",
    author: "Leila Marcos",
    authorAvatar: "https://images.unsplash.com/photo-1639526473371-e68e5336df56?w=80&h=80&fit=crop&auto=format",
    isPrivate: false,
    align: "left",
    imageUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&h=600&fit=crop"
  },
  {
    id: 5,
    name: "Batad Rich Amphitheatre Terraces",
    region: "Metro Manila / Central Luzon",
    x: 50,
    y: 28,
    type: "visited",
    category: "Deep Travel",
    note: "Hiked down to Batad. Hand-placed stone steps. Slept in a traditional Ifugao house with zero network signal. Extremely grounding.",
    author: "Ramon Dela Cruz",
    authorAvatar: "https://images.unsplash.com/photo-1565565915331-293fd8113954?w=80&h=80&fit=crop&auto=format",
    isPrivate: false,
    isQuote: true,
    align: "left",
    imageUrl: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800&h=600&fit=crop"
  },
  {
    id: 6,
    name: "Chocolate Hills Morning Sunset",
    region: "Central & Eastern Visayas (Cebu/Bohol/Samar)",
    x: 62,
    y: 59,
    type: "visited",
    category: "Reflection",
    note: "Morning panorama at sunrise. The hills look like chocolate mounds in the misty dawn. Met local chocolate makers and tarsier conservation workers.",
    author: "Sofia Reyes",
    authorAvatar: "https://images.unsplash.com/photo-1688541197205-02bd8c71074d?w=80&h=80&fit=crop&auto=format",
    isPrivate: false,
    align: "right",
    imageUrl: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800&h=600&fit=crop"
  },
  {
    id: 7,
    name: "Boracay Stations Secret Food Stalls",
    region: "Western Visayas (Panay/Iloilo)",
    x: 38,
    y: 53,
    type: "visited",
    category: "Food",
    note: "Ate grilled isolation barbecue skewers behind White Beach Station 3. Far from high-end noise, tasting true island sauces.",
    author: "Marco Buenaventura",
    authorAvatar: "https://images.unsplash.com/photo-1672933354004-3cbd9874f099?w=80&h=80&fit=crop&auto=format",
    isPrivate: false,
    align: "left",
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop"
  }
];
