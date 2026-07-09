export type AchievementIconKey = "pin" | "story" | "sparkles" | "bookmark" | "calendar" | "award" | "users" | "shield" | "gem";

export type AchievementRule = {
  id: string;
  title: string;
  detail: string;
  xp: number;
  icon: AchievementIconKey;
  target: number;
  progressKey: keyof AchievementProgress;
};

export type AchievementProgress = {
  pins: number;
  stories: number;
  savedItems: number;
  followers: number;
  groups: number;
  travelPlans: number;
  completedPlans: number;
  travelDays: number;
  combinedPinsStories: number;
};

export const achievementRules: AchievementRule[] = [
  { id: "first-trace", title: "First Trace", detail: "Create your first travel pin.", xp: 50, icon: "pin", target: 1, progressKey: "pins" },
  { id: "story-starter", title: "Story Starter", detail: "Post your first travel story.", xp: 75, icon: "story", target: 1, progressKey: "stories" },
  { id: "story-keeper", title: "Story Keeper", detail: "Post 3 or more travel stories.", xp: 150, icon: "sparkles", target: 3, progressKey: "stories" },
  { id: "trail-curator", title: "Trail Curator", detail: "Save 5 places, routes, or stories.", xp: 100, icon: "bookmark", target: 5, progressKey: "savedItems" },
  { id: "route-planner", title: "Route Planner", detail: "Create your first Travel Plan draft.", xp: 120, icon: "calendar", target: 1, progressKey: "travelPlans" },
  { id: "album-ready", title: "Album Ready", detail: "Complete and publish a Travel Plan.", xp: 250, icon: "award", target: 1, progressKey: "completedPlans" },
  { id: "three-day-traveler", title: "Three-Day Traveler", detail: "Plan at least 3 travel days.", xp: 180, icon: "calendar", target: 3, progressKey: "travelDays" },
  { id: "community-signal", title: "Community Signal", detail: "Reach 100 followers.", xp: 300, icon: "users", target: 100, progressKey: "followers" },
  { id: "group-traveler", title: "Group Traveler", detail: "Join or create a travel group.", xp: 90, icon: "shield", target: 1, progressKey: "groups" },
  { id: "hidden-gem-hunter", title: "Hidden Gem Hunter", detail: "Build 10 combined pins and stories.", xp: 220, icon: "gem", target: 10, progressKey: "combinedPinsStories" },
];
