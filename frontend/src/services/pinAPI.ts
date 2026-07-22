const API_URL = import.meta.env.VITE_API_URL;

export interface Pins {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  scope: string;
}

export interface PinsResponse {
  pins: Pins[];
}

export async function fetchPins(scope = "public") {
  const response = await fetch(
    `${API_URL}/public/pins?scope=${scope}`
  );

  if (!response.ok) {
    throw new Error("Unable to fetch pins.");
  }

  return response.json() as Promise<PinsResponse>;
}