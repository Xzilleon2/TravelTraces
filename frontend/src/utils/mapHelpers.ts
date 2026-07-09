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
  lat?: number;
  lon?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isQuote?: boolean;
  align?: "left" | "center" | "right";
  isBullet?: boolean;
  date?: string;
  imageUrl?: string;
}

export const COMPANIONS_DATA: Companion[] = [];

export const MIDPOINT_HUBS: MidpointHub[] = [];

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

export const INITIAL_PINS: Pin[] = [];
