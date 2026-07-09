export function localAvatarDataUrl(seed: string | null | undefined): string {
  const name = (seed ?? "TravelTraces").trim() || "TravelTraces";
  const initials =
    name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TT";
  const hue = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0) % 38;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="hsl(${18 + hue} 42% 32%)"/><text x="48" y="55" text-anchor="middle" font-family="Georgia, serif" font-size="30" font-weight="700" fill="#FBF7F0">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
