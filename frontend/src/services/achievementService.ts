import type { User } from "../context/AuthContext";
import { listLocalStories, readLocalTable } from "./localDb";
import type { ApiPin, TravelGroup } from "./mappingApi";
import { readTravelPlanStories, totalTravelDays, travelPlanStatus } from "./travelPlanStories";
import { achievementRules, type AchievementProgress, type AchievementRule } from "./achievementRules";
import { getSavedItemsByUser, getSocialStats } from "./userData";

export type UserAchievement = AchievementRule & {
  progress: number;
  unlocked: boolean;
};

export function getLevelFromXp(totalXp: number) {
  const level = totalXp <= 0 ? 0 : Math.floor(totalXp / 100);
  const currentFloor = level * 100;
  const nextFloor = (level + 1) * 100;
  const progress = Math.min(100, Math.round(((totalXp - currentFloor) / Math.max(1, nextFloor - currentFloor)) * 100));
  return { level, points: totalXp, progress, nextLevelPoints: nextFloor };
}

export function getUserAchievementProgress(user: User): AchievementProgress {
  const stories = listLocalStories().filter((story) => story.ownerId === user.id || story.author === user.name);
  const pins = readLocalTable<ApiPin>("pins").filter((pin) => pin.creator_id === user.id);
  const groups = readLocalTable<TravelGroup>("travelGroups").filter((group) => group.owner_id === user.id || group.members.some((member) => member.user_id === user.id));
  const plans = readTravelPlanStories().filter((plan) => plan.ownerId === user.id || plan.ownerName === user.name);
  const completedPlans = plans.filter((plan) => travelPlanStatus(plan) === "completed" && plan.published);
  const social = getSocialStats(user.id);
  const savedItems = getSavedItemsByUser(user.id);
  return {
    pins: pins.length,
    stories: stories.length,
    savedItems: savedItems.length,
    followers: social.followersCount,
    groups: groups.length,
    travelPlans: plans.length,
    completedPlans: completedPlans.length,
    travelDays: plans.reduce((total, plan) => total + totalTravelDays(plan), 0),
    combinedPinsStories: pins.length + stories.length,
  };
}

export function getUserAchievements(user: User): UserAchievement[] {
  const progress = getUserAchievementProgress(user);
  return achievementRules.map((rule) => {
    const current = Number(progress[rule.progressKey]) || 0;
    return { ...rule, progress: current, unlocked: current >= rule.target };
  });
}

export function getUserAchievementSummary(user: User) {
  const achievements = getUserAchievements(user);
  const totalXp = achievements.filter((item) => item.unlocked).reduce((total, item) => total + item.xp, 0);
  return {
    achievements,
    unlockedCount: achievements.filter((item) => item.unlocked).length,
    totalXp,
    level: getLevelFromXp(totalXp),
    progress: getUserAchievementProgress(user),
  };
}
