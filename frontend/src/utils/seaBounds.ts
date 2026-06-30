/** Southeast Asia map bounds and defaults for TravelPlaces. */
export const SEA_COUNTRIES = [
  "Philippines",
  "Indonesia",
  "Malaysia",
  "Singapore",
  "Thailand",
  "Vietnam",
  "Cambodia",
  "Laos",
  "Myanmar",
  "Brunei",
  "Timor-Leste",
] as const;

export const SEA_BOUNDS: [[number, number], [number, number]] = [
  [92.0, -11.0],
  [141.5, 28.5],
];

/** MapLibre center [lng, lat] — Southeast Asia. */
export const SEA_CENTER: [number, number] = [115.0, 6.5];

export const SEA_DEFAULT_ZOOM = 4.8;

export function isInSeaBounds(lat: number, lon: number): boolean {
  const [[minLon, minLat], [maxLon, maxLat]] = SEA_BOUNDS;
  return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}
