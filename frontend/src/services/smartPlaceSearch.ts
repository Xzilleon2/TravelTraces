import { searchLocations, type ApiLocation } from "./mappingApi";

export type PlaceSuggestion = {
  id: string;
  name: string;
  displayName: string;
  address?: string;
  lat: number;
  lon: number;
  category?: string;
  source: "local" | "saved_place" | "tourist_spot" | "pin" | "maptiler" | "photon" | "pelias" | "nominatim";
  score?: number;
};

const cache = new Map<string, PlaceSuggestion[]>();

function sourceFromProvider(provider: string): PlaceSuggestion["source"] {
  const text = provider.toLowerCase();
  if (text.includes("saved")) return "saved_place";
  if (text.includes("tourist")) return "tourist_spot";
  if (text.includes("pin")) return "pin";
  if (text.includes("maptiler")) return "maptiler";
  if (text.includes("photon")) return "photon";
  if (text.includes("pelias")) return "pelias";
  if (text.includes("nominatim")) return "nominatim";
  return "local";
}

function rankSuggestion(query: string, location: ApiLocation, index: number) {
  const label = location.label.toLowerCase();
  const needle = query.toLowerCase();
  const prefixBoost = label.startsWith(needle) ? 30 : 0;
  const textMatch = label.includes(needle) ? 45 : 0;
  const localRegionBoost = /philippines|davao|southeast asia|palawan|siargao|cebu|batanes/i.test(location.label) ? 12 : 0;
  return textMatch + prefixBoost + localRegionBoost + Math.max(0, 10 - index);
}

export async function smartPlaceSearch(query: string, options?: { limit?: number; signal?: AbortSignal }): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  const limit = options?.limit ?? 8;
  if (trimmed.length < 2) return [];
  const key = `${trimmed.toLowerCase()}::${limit}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const results = await searchLocations(trimmed, limit);
  if (options?.signal?.aborted) return [];
  const suggestions = results
    .map((location, index) => {
      const [lat, lon] = location.coordinate;
      const displayName = location.label;
      return {
        id: `${location.provider}-${lat.toFixed(5)}-${lon.toFixed(5)}-${index}`,
        name: displayName.split(",")[0]?.trim() || displayName,
        displayName,
        address: displayName,
        lat,
        lon,
        source: sourceFromProvider(location.provider),
        score: rankSuggestion(trimmed, location, index),
      } satisfies PlaceSuggestion;
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);
  cache.set(key, suggestions);
  return suggestions;
}
