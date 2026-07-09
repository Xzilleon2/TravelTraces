import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import {
  Award,
  Bookmark,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Gem,
  Globe2,
  Lock,
  MapPin,
  Pin,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { GatedPage } from "../components/GatedPage";
import { ImageCropDialog } from "../components/ImageCropDialog";
import { useAuth, type User } from "../context/AuthContext";
import type { ApiPin, TouristSpot, TravelGroup } from "../services/mappingApi";
import { deleteTouristSpot, listPins, listTouristSpots, listTravelGroups } from "../services/mappingApi";
import { listLocalStories, readLocalTable } from "../services/localDb";
import { getUserAchievementSummary, getUserAchievements, type UserAchievement } from "../services/achievementService";
import type { AchievementIconKey } from "../services/achievementRules";
import { getSavedItemsByUser, getSocialStats, type SavedItemFilter } from "../services/userData";
import { readTravelPlanStories, totalTravelDays, travelPlanStatus, type TravelPlanDestination, type TravelPlanStory } from "../services/travelPlanStories";
import { SAVED_STORIES_KEY } from "./StoriesPage";
import { TravelPlanArticleView } from "./TravelPlanStoriesPage";

const tabs = ["Overview", "Achievements", "Saved Places", "Draft Plans", "Travel Groups", "Calendar", "Settings"] as const;
type ProfileTab = (typeof tabs)[number];

type ProfileData = {
  pins: ApiPin[];
  spots: TouristSpot[];
  groups: TravelGroup[];
};

type ProfileForm = Pick<User, "name" | "email" | "avatar" | "location" | "joinedDate" | "bio" | "nationality" | "travelStyle"> & {
  interests: string;
};

const emptyProfileData: ProfileData = {
  pins: [],
  spots: [],
  groups: [],
};

function readStorageCount(key: string): number {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown[];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function formatDate(value?: string | number | null): string {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatPlan(plan: User["plan"]): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "Private";
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(3, name.length - visible.length))}@${domain}`;
}

const achievementIconMap: Record<AchievementIconKey, LucideIcon> = {
  pin: Pin,
  story: BookOpen,
  sparkles: Sparkles,
  bookmark: Bookmark,
  calendar: CalendarDays,
  award: Award,
  users: Users,
  shield: ShieldCheck,
  gem: Gem,
};

type ProfileBadge = UserAchievement & { iconComponent: LucideIcon };

function buildBadges(user: User): ProfileBadge[] {
  return getUserAchievements(user).map((badge) => ({ ...badge, iconComponent: achievementIconMap[badge.icon] ?? Award }));
}

function Panel({ title, eyebrow, children, action }: { title: string; eyebrow?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#3A2A22]/10 bg-[#FFF9F0] p-6 shadow-[0_18px_42px_rgba(58,42,34,0.07)]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          {eyebrow ? <p className="m-0 font-[var(--font-label)] text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#7A4B32]">{eyebrow}</p> : null}
          <h2 className="m-0 mt-1 font-[var(--font-display)] text-2xl font-semibold leading-tight text-[#2C211C]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, supporting }: { label: string; value: ReactNode; supporting?: string }) {
  return (
    <div className="rounded-lg border border-[#3A2A22]/10 bg-[#FFF9F0] p-5">
      <p className="m-0 font-[var(--font-label)] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5E4B40]">{label}</p>
      <strong className="mt-2 block font-[var(--font-display)] text-3xl font-semibold leading-none text-[#2C211C]">{value}</strong>
      {supporting ? <p className="m-0 mt-2 text-sm leading-5 text-[#625247]">{supporting}</p> : null}
    </div>
  );
}

function FirstPinPrompt() {
  return (
    <div className="rounded-lg border border-[#C4713A]/35 bg-[#FFF4E8] p-5">
      <p className="m-0 font-[var(--font-label)] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#7A4B32]">Pins Created</p>
      <h3 className="m-0 mt-2 font-[var(--font-display)] text-2xl font-semibold text-[#2C211C]">Create your first pin</h3>
      <p className="m-0 mt-2 text-sm leading-6 text-[#5E4B40]">
        Start your map with a place you have visited, want to remember, or plan to explore next.
      </p>
      <NavLink
        to="/maps"
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[#3A2A22] px-4 font-[var(--font-label)] text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#FFF9F0] transition hover:bg-[#2C211C]"
      >
        Drop a pin
      </NavLink>
    </div>
  );
}

function BadgeCard({ badge }: { badge: ProfileBadge }) {
  const Icon = badge.iconComponent;
  return (
    <article className={`rounded-lg border p-4 transition ${badge.unlocked ? "border-[#C4713A]/35 bg-[#FFF9F0]" : "border-[#3A2A22]/10 bg-[#EFE7DC]/70"}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${badge.unlocked ? "bg-[#C4713A] text-[#FFF9F0]" : "bg-[#D8D0C2] text-[#5E4B40]"}`}>
          {badge.unlocked ? <Icon size={18} /> : <Lock size={16} />}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 font-[var(--font-display)] text-lg font-semibold leading-tight text-[#2C211C]">{badge.title}</h3>
            {badge.unlocked ? <CheckCircle2 size={15} className="text-[#7A4B32]" aria-label="Unlocked" /> : null}
          </div>
          <p className="m-0 mt-1 text-sm leading-5 text-[#5E4B40]">{badge.detail}</p>
          <p className={`m-0 mt-3 font-[var(--font-label)] text-[0.66rem] font-bold uppercase tracking-[0.1em] ${badge.unlocked ? "text-[#7A4B32]" : "text-[#5E4B40]"}`}>
            {badge.unlocked ? "Unlocked" : "Locked"} / {badge.xp} XP
          </p>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ icon: Icon, title, copy }: { icon: LucideIcon; title: string; copy: string }) {
  return (
    <div className="col-span-full mx-auto w-full max-w-3xl rounded-lg border border-dashed border-[#3A2A22]/20 bg-[#FFF9F0] p-[clamp(2rem,5vw,4rem)] text-center shadow-[0_18px_42px_rgba(58,42,34,0.06)]">
      <Icon className="mx-auto mb-3 text-[#7A4B32]" size={26} />
      <h3 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2C211C]">{title}</h3>
      <p className="m-0 mx-auto mt-2 max-w-md text-sm leading-6 text-[#5E4B40]">{copy}</p>
    </div>
  );
}

function draftPlanCover(plan: TravelPlanStory): string | null {
  return plan.coverImage || null;
}

function DraftPlanCard({ plan, onOpen }: { plan: TravelPlanStory; onOpen: () => void }) {
  const status = travelPlanStatus(plan);
  const completed = plan.destinations.filter((destination) => destination.status !== "planned").length;
  const total = plan.destinations.length;
  const cover = draftPlanCover(plan);
  const statusLabel = status === "completed" ? (cover ? "Ready to publish" : "Cover required") : status === "ongoing" ? "Ongoing draft" : "Planning draft";

  return (
    <article
      onClick={onOpen}
      className="overflow-hidden rounded-[0.25rem] bg-[#EDEAE0] transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)]"
      style={{ cursor: "pointer" }}
    >
      {cover ? (
        <img src={cover} alt="" className="block h-[180px] w-full object-cover" style={{ objectPosition: plan.coverPosition ?? "center center" }} />
      ) : (
        <div className="grid h-[180px] place-items-center border-b border-[#3A2A22]/10 bg-gradient-to-br from-[#EFE7DC] to-[#FBF7F0]">
          <div className="text-center">
            <BookOpen className="mx-auto mb-2 text-[#9E6B5C]" size={28} />
            <p className="m-0 font-[var(--font-label)] text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#7A4B32]">{status === "completed" ? "Cover required" : "Draft cover pending"}</p>
          </div>
        </div>
      )}
      <div className="p-5">
        <span className="font-[var(--font-label)] text-[0.68rem] uppercase tracking-[0.1em] text-[#C4713A]">{statusLabel}</span>
        <h3 className="mb-3 mt-2 font-[var(--font-display)] text-[1.15rem] font-semibold leading-[1.35] text-[#3A2A22]">{plan.travelPlanName}</h3>
        <p className="mb-4 font-[var(--font-body)] text-sm leading-6 text-[#4A4A3A]">{(plan.subtitle || plan.description || `${total} destination route created from Draw Route.`).slice(0, 120)}...</p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="m-0 font-[var(--font-ui)] text-[0.8rem] font-semibold text-[#1A1A1A]">{plan.ownerName}</p>
            <p className="m-0 font-[var(--font-ui)] text-xs text-[#6B6B5A]">Updated {formatDate(plan.updatedAt)}</p>
          </div>
          <div className="flex items-center gap-3 text-[#6B6B5A]">
            <span className="inline-flex items-center gap-1 font-[var(--font-ui)] text-xs"><BookOpen size={12} /> {total} points</span>
            <span className="inline-flex items-center gap-1 font-[var(--font-ui)] text-xs">{completed}/{total}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

const calendarWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type TravelCalendarEntry = {
  id: string;
  planId: string;
  planName: string;
  destination: TravelPlanDestination;
  dateKey: string;
  date: Date;
  colorClass: string;
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year || new Date().getFullYear(), (month || 1) - 1, day || 1);
}

function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function destinationDateKey(plan: TravelPlanStory, destination: TravelPlanDestination): string {
  if (destination.plannedDate) return destination.plannedDate;
  if (destination.dateVisited) return destination.dateVisited;
  const startDate = new Date(plan.createdAt);
  return toDateKey(addCalendarDays(Number.isNaN(startDate.getTime()) ? new Date() : startDate, Math.max(0, destination.plannedDay - 1)));
}

function monthGridDays(month: Date): Date[] {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = addCalendarDays(firstOfMonth, -mondayOffset);
  return Array.from({ length: 42 }, (_, index) => addCalendarDays(gridStart, index));
}

function TravelPlanCalendar({ plans, ownerId }: { plans: TravelPlanStory[]; ownerId: string }) {
  const navigate = useNavigate();
  const entries = useMemo<TravelCalendarEntry[]>(() => {
    const colors = ["bg-[#C4713A]", "bg-[#5C8A9E]", "bg-[#8066B3]", "bg-[#B85E78]", "bg-[#6F7D4E]"];
    return plans
      .filter((plan) => plan.ownerId === ownerId)
      .flatMap((plan) =>
        plan.destinations.map((destination, index) => {
          const dateKey = destinationDateKey(plan, destination);
          return {
            id: `${plan.id}-${destination.id}`,
            planId: plan.id,
            planName: plan.travelPlanName,
            destination,
            dateKey,
            date: parseDateKey(dateKey),
            colorClass: colors[index % colors.length] ?? "bg-[#C4713A]",
          };
        }),
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime() || a.destination.order - b.destination.order);
  }, [ownerId, plans]);

  const firstEntryDate = entries[0]?.date;
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => firstEntryDate ?? new Date());

  const days = useMemo(() => monthGridDays(visibleMonth), [visibleMonth]);
  const entriesByDate = useMemo(() => {
    const map = new Map<string, TravelCalendarEntry[]>();
    entries.forEach((entry) => {
      map.set(entry.dateKey, [...(map.get(entry.dateKey) ?? []), entry]);
    });
    return map;
  }, [entries]);

  const monthPlans = useMemo(() => {
    const planIds = new Set(
      entries
        .filter((entry) => entry.date.getFullYear() === visibleMonth.getFullYear() && entry.date.getMonth() === visibleMonth.getMonth())
        .map((entry) => entry.planId),
    );
    return plans.filter((plan) => planIds.has(plan.id));
  }, [entries, plans, visibleMonth]);

  const monthLabel = visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayKey = toDateKey(new Date());

  return (
    <section className="grid gap-6">
      <div className="overflow-hidden rounded-[1.35rem] border border-[#3A2A22]/12 bg-[#241B17] shadow-[0_28px_70px_rgba(58,42,34,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#FBF7F0]/10 px-5 py-5 sm:px-7">
          <div>
            <p className="m-0 font-[var(--font-label)] text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#D9A37C]">Travel Plan Calendar</p>
            <h2 className="m-0 mt-2 font-[var(--font-display)] text-4xl font-semibold leading-none text-[#FBF7F0] sm:text-5xl">{monthLabel}</h2>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear() - 1, current.getMonth(), 1))} className="min-h-11 rounded-full border border-[#FBF7F0]/15 bg-[#FBF7F0]/8 px-3 font-[var(--font-label)] text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#FBF7F0]">
              Year -
            </button>
            <button type="button" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="grid h-11 w-11 place-items-center rounded-full border border-[#FBF7F0]/15 bg-[#FBF7F0]/8 text-[#FBF7F0]" aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <input
              type="number"
              min={1900}
              max={2200}
              value={visibleMonth.getFullYear()}
              onChange={(event) => {
                const year = Number(event.target.value);
                if (Number.isFinite(year) && year >= 1900 && year <= 2200) setVisibleMonth((current) => new Date(year, current.getMonth(), 1));
              }}
              className="h-11 w-24 rounded-full border border-[#FBF7F0]/15 bg-[#FBF7F0]/8 px-3 text-center text-sm font-bold text-[#FBF7F0] outline-none focus:border-[#D9A37C]"
              aria-label="Calendar year"
            />
            <button type="button" onClick={() => setVisibleMonth(new Date())} className="min-h-11 rounded-full bg-[#FBF7F0] px-4 font-[var(--font-label)] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#3A2A22]">
              Today
            </button>
            <button type="button" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="grid h-11 w-11 place-items-center rounded-full border border-[#FBF7F0]/15 bg-[#FBF7F0]/8 text-[#FBF7F0]" aria-label="Next month">
              <ChevronRight size={18} />
            </button>
            <button type="button" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear() + 1, current.getMonth(), 1))} className="min-h-11 rounded-full border border-[#FBF7F0]/15 bg-[#FBF7F0]/8 px-3 font-[var(--font-label)] text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#FBF7F0]">
              Year +
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[920px] p-4 sm:p-6">
            <div className="grid grid-cols-7 border-b border-[#FBF7F0]/8 pb-3">
              {calendarWeekdays.map((day) => (
                <div key={day} className="px-3 font-[var(--font-label)] text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#E8DACB]/70">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const dateKey = toDateKey(day);
                const dayEntries = entriesByDate.get(dateKey) ?? [];
                const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                const isToday = dateKey === todayKey;
                return (
                  <div key={dateKey} className={`min-h-32 border-r border-t border-[#FBF7F0]/8 p-3 ${isCurrentMonth ? "bg-[#241B17]" : "bg-[#1C1613]"} ${day.getDay() === 0 || day.getDay() === 6 ? "bg-[#2B211D]" : ""}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-semibold ${isToday ? "bg-[#FBF7F0] text-[#3A2A22]" : isCurrentMonth ? "text-[#FBF7F0]" : "text-[#FBF7F0]/35"}`}>
                        {day.getDate()}
                      </span>
                      {dayEntries.length ? <span className="rounded-full bg-[#FBF7F0]/10 px-2 py-0.5 text-[0.62rem] font-bold text-[#FBF7F0]/75">{dayEntries.length}</span> : null}
                    </div>
                    <div className="space-y-2">
                      {dayEntries.slice(0, 3).map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => navigate(`/profile?tab=drafts&plan=${encodeURIComponent(entry.planId)}`)}
                          className={`block w-full rounded-full px-3 py-2 text-left text-xs font-bold leading-tight text-white shadow-[0_10px_20px_rgba(0,0,0,0.18)] transition hover:scale-[1.01] ${entry.colorClass}`}
                          title={`${entry.planName}: ${entry.destination.placeName}`}
                        >
                          <span className="block truncate">{entry.destination.plannedTime ? `${entry.destination.plannedTime} ` : ""}{entry.destination.placeName}</span>
                        </button>
                      ))}
                      {dayEntries.length > 3 ? <p className="m-0 text-xs font-semibold text-[#E8DACB]/65">+{dayEntries.length - 3} more stops</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {entries.length ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
          <Panel title="This Month's Routes" eyebrow="Calendar Summary">
            <div className="grid gap-3">
              {monthPlans.length ? monthPlans.map((plan) => {
                const status = travelPlanStatus(plan);
                return (
                  <button key={plan.id} type="button" onClick={() => navigate(`/profile?tab=drafts&plan=${encodeURIComponent(plan.id)}`)} className="rounded-lg border border-[#3A2A22]/10 bg-[#F5F0E8] p-4 text-left transition hover:border-[#C4713A]/50 hover:bg-[#FFF4E8]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="m-0 font-[var(--font-display)] text-2xl font-semibold text-[#2C211C]">{plan.travelPlanName}</h3>
                      <span className="rounded-full bg-[#3A2A22] px-3 py-1 font-[var(--font-label)] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#FFF9F0]">{status}</span>
                    </div>
                    <p className="m-0 mt-2 text-sm leading-6 text-[#5E4B40]">{plan.destinations.length} stops / {totalTravelDays(plan)} travel day{totalTravelDays(plan) === 1 ? "" : "s"}</p>
                  </button>
                );
              }) : <EmptyState icon={CalendarDays} title="No plans this month" copy="Use the month controls to browse scheduled travel plan stops." />}
            </div>
          </Panel>

          <Panel title="Upcoming Stops" eyebrow="Next Destinations">
            <div className="grid gap-3">
              {entries.filter((entry) => entry.dateKey >= todayKey).slice(0, 5).map((entry) => (
                <button key={entry.id} type="button" onClick={() => navigate(`/profile?tab=drafts&plan=${encodeURIComponent(entry.planId)}`)} className="grid grid-cols-[auto_1fr] gap-3 rounded-lg bg-[#F5F0E8] p-3 text-left">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#C4713A] text-[#FFF9F0]"><Clock3 size={18} /></span>
                  <span>
                    <span className="block font-semibold text-[#2C211C]">{entry.destination.placeName}</span>
                    <span className="block text-sm leading-5 text-[#5E4B40]">{formatDate(entry.dateKey)}{entry.destination.plannedTime ? ` at ${entry.destination.plannedTime}` : ""}</span>
                    <span className="block font-[var(--font-label)] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#7A4B32]">{entry.planName}</span>
                  </span>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      ) : (
        <Panel title="No Travel Plans Scheduled" eyebrow="Calendar">
          <div className="rounded-lg border border-dashed border-[#3A2A22]/20 bg-[#F5F0E8] p-8 text-center">
            <CalendarDays className="mx-auto mb-3 text-[#7A4B32]" size={30} />
            <h3 className="m-0 font-[var(--font-display)] text-2xl font-semibold text-[#2C211C]">Create a route from the map</h3>
            <p className="m-0 mx-auto mt-2 max-w-xl text-sm leading-6 text-[#5E4B40]">
              Draw Route turns multiple destinations into a Travel Plan. Once you add planned dates, every stop appears here as a calendar event.
            </p>
            <NavLink to="/maps" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#3A2A22] px-5 font-[var(--font-label)] text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#FFF9F0]">
              Open maps
            </NavLink>
          </div>
        </Panel>
      )}
    </section>
  );
}

function ProfileContent() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ProfileTab>("Overview");
  const [data, setData] = useState<ProfileData>(emptyProfileData);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [savedStoriesCount, setSavedStoriesCount] = useState(0);
  const [localStoriesCount, setLocalStoriesCount] = useState(0);
  const [travelPlans, setTravelPlans] = useState<TravelPlanStory[]>([]);
  const [activeDraftPlanId, setActiveDraftPlanId] = useState<string | null>(null);
  const [pendingSavedPlaceDelete, setPendingSavedPlaceDelete] = useState<TouristSpot | null>(null);
  const [savedFilter, setSavedFilter] = useState<SavedItemFilter>("All");
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [achievementToast, setAchievementToast] = useState<ProfileBadge | null>(null);
  const [avatarCropSrc, setAvatarCropSrc] = useState("");

  const groupIds = useMemo(() => user?.groupIds ?? [], [user?.groupIds]);

  useEffect(() => {
    if (!user) return undefined;
    const refreshStoryCounts = () => {
      const ownedStories = listLocalStories().filter((story) => story.ownerId === user.id || story.author === user.name || story.ownerId === "demo-user");
      const savedRows = readLocalTable<{ user_id?: string; userId?: string; saved_by?: string; story_id?: number; storyId?: number }>("savedStories");
      const userSavedRows = savedRows.filter((row) => {
        const owner = row.user_id ?? row.userId ?? row.saved_by;
        return !owner || owner === user.id;
      });
      setSavedStoriesCount(Math.max(readStorageCount(SAVED_STORIES_KEY), userSavedRows.length));
      setLocalStoriesCount(ownedStories.length);
    };
    refreshStoryCounts();
    window.addEventListener("traveltraces:local-db-updated", refreshStoryCounts);
    window.addEventListener("traveltraces:saved-stories-updated", refreshStoryCounts);
    window.addEventListener("traveltraces:local-stories-updated", refreshStoryCounts);
    window.addEventListener("storage", refreshStoryCounts);
    return () => {
      window.removeEventListener("traveltraces:local-db-updated", refreshStoryCounts);
      window.removeEventListener("traveltraces:saved-stories-updated", refreshStoryCounts);
      window.removeEventListener("traveltraces:local-stories-updated", refreshStoryCounts);
      window.removeEventListener("storage", refreshStoryCounts);
    };
  }, [user]);

  useEffect(() => {
    const refreshTravelPlans = () => setTravelPlans(readTravelPlanStories());
    refreshTravelPlans();
    window.addEventListener("traveltraces:travel-plan-stories-updated", refreshTravelPlans);
    window.addEventListener("storage", refreshTravelPlans);
    return () => {
      window.removeEventListener("traveltraces:travel-plan-stories-updated", refreshTravelPlans);
      window.removeEventListener("storage", refreshTravelPlans);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tab") === "drafts") {
      setActiveTab("Draft Plans");
    }
    const requestedPlan = params.get("plan");
    if (requestedPlan) {
      setActiveTab("Draft Plans");
      setActiveDraftPlanId(requestedPlan);
    }
  }, [location.search]);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      location: user.location,
      joinedDate: user.joinedDate,
      bio: user.bio,
      nationality: user.nationality,
      travelStyle: user.travelStyle ?? "",
      interests: (user.interests ?? []).join(", "),
    });
  }, [user]);

  useEffect(() => {
    const currentUser = user;
    if (!currentUser) return undefined;
    let cancelled = false;

    async function loadProfileData() {
      setLoading(true);
      const [pinsResult, spotsResult, groupsResult] = await Promise.allSettled([
        listPins(currentUser.id, groupIds),
        listTouristSpots(currentUser.id),
        listTravelGroups(currentUser.id),
      ]);

      if (cancelled) return;
      setData({
        pins: pinsResult.status === "fulfilled" ? pinsResult.value.filter((pin) => pin.creator_id === currentUser.id) : [],
        spots: spotsResult.status === "fulfilled" ? spotsResult.value : [],
        groups: groupsResult.status === "fulfilled" ? groupsResult.value : [],
      });
      if ([pinsResult, spotsResult, groupsResult].some((result) => result.status === "rejected")) {
        setStatus("Some profile activity could not be loaded. The available profile data is still shown.");
      }
      setLoading(false);
    }

    const refreshProfileData = () => void loadProfileData().catch(() => {
      if (!cancelled) {
        setData(emptyProfileData);
        setStatus("Profile activity could not be loaded right now.");
        setLoading(false);
      }
    });
    setStatus(null);
    refreshProfileData();
    window.addEventListener("traveltraces:local-db-updated", refreshProfileData);
    window.addEventListener("storage", refreshProfileData);

    return () => {
      cancelled = true;
      window.removeEventListener("traveltraces:local-db-updated", refreshProfileData);
      window.removeEventListener("storage", refreshProfileData);
    };
  }, [groupIds, user]);

  useEffect(() => {
    if (!user) return;
    const badges = buildBadges(user);
    const storageKey = `traveltraces.seenAchievements.${user.id}`;
    const seen = new Set(JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as string[]);
    const newlyUnlocked = badges.find((badge) => badge.unlocked && !seen.has(badge.title));
    if (!newlyUnlocked) return;
    badges.filter((badge) => badge.unlocked).forEach((badge) => seen.add(badge.title));
    window.localStorage.setItem(storageKey, JSON.stringify([...seen]));
    setAchievementToast(newlyUnlocked);
    const timer = window.setTimeout(() => setAchievementToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [data.groups.length, data.pins.length, data.spots.length, localStoriesCount, savedStoriesCount, travelPlans, user]);

  if (!user || !form) return null;

  const pinsCreated = data.pins.length;
  const storiesPosted = localStoriesCount;
  const savedItems = getSavedItemsByUser(user.id, savedFilter);
  const savedPlaces = getSavedItemsByUser(user.id).length;
  const travelGroups = data.groups.length;
  const socialStats = getSocialStats(user.id);
  const followersCount = socialStats.followersCount;
  const followingCount = socialStats.followingCount;
  const ownedTravelPlans = travelPlans.filter((plan) => plan.ownerId === user.id || plan.ownerName === user.name || plan.ownerId === "demo-user");
  const completedOwnedPlans = ownedTravelPlans.filter((plan) => travelPlanStatus(plan) === "completed" && plan.published).length;
  const travelPlanDays = ownedTravelPlans.reduce((total, plan) => total + totalTravelDays(plan), 0);
  const summary = getUserAchievementSummary(user);
  const badges = buildBadges(user);
  const unlockedBadges = badges.filter((badge) => badge.unlocked).length;
  const level = summary.level;
  const requiredProfileFields = [user.name, user.bio, user.avatar, user.location, user.interests?.length ? user.interests.join(",") : "", user.travelStyle];
  const profileCompletion = Math.round((requiredProfileFields.filter(Boolean).length / requiredProfileFields.length) * 100);
  const draftTravelPlans = ownedTravelPlans
    .filter((plan) => travelPlanStatus(plan) !== "completed" || !plan.published)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const activeDraftPlan = activeDraftPlanId ? draftTravelPlans.find((plan) => plan.id === activeDraftPlanId) ?? null : null;

  if (activeTab === "Draft Plans" && activeDraftPlan) {
    return (
      <TravelPlanArticleView
        plan={activeDraftPlan}
        onBack={() => setActiveDraftPlanId(null)}
        onPrev={() => undefined}
        onNext={() => undefined}
        hasPrev={false}
        hasNext={false}
        editable
        backLabel="Draft Plans"
        onPlanChange={(updatedPlan) => {
          setTravelPlans((current) => [updatedPlan, ...current.filter((plan) => plan.id !== updatedPlan.id)]);
          setActiveDraftPlanId(updatedPlan.id);
        }}
      />
    );
  }

  const handleFormChange = (field: keyof ProfileForm, value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleProfilePhotoFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatarCropSrc(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (event: FormEvent) => {
    event.preventDefault();
    updateUser({
      ...user,
      name: form.name.trim() || user.name,
      email: form.email.trim() || user.email,
      avatar: form.avatar.trim() || user.avatar,
      location: form.location.trim(),
      joinedDate: form.joinedDate.trim() || user.joinedDate,
      bio: form.bio.trim(),
      nationality: form.nationality.trim(),
      travelStyle: form.travelStyle.trim(),
      interests: form.interests.split(",").map((item) => item.trim()).filter(Boolean),
    });
    setStatus("Profile information updated for this session.");
    setActiveTab("Overview");
  };

  const handleDeleteSavedPlace = async (placeId: string) => {
    setData((current) => ({ ...current, spots: current.spots.filter((spot) => spot.place_id !== placeId) }));
    try {
      await deleteTouristSpot(placeId, user.id);
      setStatus("Saved place deleted.");
    } catch {
      setStatus("Saved place was removed from this view, but the database delete could not be confirmed.");
    } finally {
      setPendingSavedPlaceDelete(null);
    }
  };

  return (
    <section className="min-h-screen bg-[#F5F0E8] font-[var(--font-ui)] text-[#2C211C]">
      <ImageCropDialog
        open={Boolean(avatarCropSrc)}
        src={avatarCropSrc}
        title="Adjust profile picture"
        aspect={1}
        onCancel={() => setAvatarCropSrc("")}
        onSave={({ dataUrl }) => {
          handleFormChange("avatar", dataUrl);
          updateUser({ ...user, avatar: dataUrl });
          setAvatarCropSrc("");
          setStatus("Profile picture updated.");
        }}
      />
      {achievementToast ? (
        <div className="fixed right-5 top-24 z-[1200] max-w-sm rounded-xl border border-[#C4713A]/30 bg-[#FFF9F0] p-4 shadow-[0_18px_48px_rgba(58,42,34,0.18)]" role="status" aria-live="polite">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#C4713A] text-[#FFF9F0]">
              {(() => {
                const ToastIcon = achievementToast.iconComponent;
                return <ToastIcon size={18} />;
              })()}
            </span>
            <div>
              <p className="m-0 font-[var(--font-label)] text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#7A4B32]">Achievement unlocked</p>
              <h3 className="m-0 mt-1 font-[var(--font-display)] text-xl font-semibold text-[#2C211C]">{achievementToast.title}</h3>
              <p className="m-0 mt-1 text-sm leading-5 text-[#5E4B40]">+{achievementToast.xp} XP</p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="border-b border-[#3A2A22]/10 bg-[#FBF7F0] px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_20rem] lg:items-center">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <label className="group relative block h-32 w-32 shrink-0 cursor-pointer" title="Change profile picture">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={(event) => handleProfilePhotoFile(event.target.files?.[0] ?? null)}
                className="sr-only"
              />
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.name} profile`}
                  className="h-32 w-32 rounded-full border-4 border-[#EFE7DC] object-cover shadow-[0_18px_34px_rgba(58,42,34,0.16)]"
                />
              ) : (
                <span className="grid h-32 w-32 place-items-center rounded-full border-4 border-[#EFE7DC] bg-[#EDEAE0] text-[#7A4B32] shadow-[0_18px_34px_rgba(58,42,34,0.16)]" aria-label={`${user.name} profile placeholder`}>
                  <UserRound size={42} />
                </span>
              )}
              <span className="absolute inset-x-2 bottom-2 rounded-full bg-[#3A2A22]/85 px-3 py-1 text-center font-[var(--font-label)] text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[#FFF9F0] opacity-0 transition group-hover:opacity-100">
                Change
              </span>
            </label>
            <div className="min-w-0">
              <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#7A4B32]">Traveler Profile</p>
              <h1 className="m-0 mt-2 font-[var(--font-display)] text-[clamp(2.4rem,7vw,4.5rem)] font-semibold leading-none text-[#2C211C]">{user.name}</h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#5E4B40]">
                <span className="inline-flex items-center gap-2"><MapPin size={15} />{user.location || "Location not set"}</span>
                <span className="inline-flex items-center gap-2"><Globe2 size={15} />{user.nationality || "Nationality not set"}</span>
                <span className="inline-flex items-center gap-2"><Calendar size={15} />{user.joinedDate ? `Joined ${user.joinedDate}` : "Joined date not set"}</span>
              </div>
              <p className="m-0 mt-5 max-w-3xl font-[var(--font-body)] text-base leading-7 text-[#4D4038]">
                {user.bio || "No bio added yet."}
              </p>
            </div>
          </div>

          <aside className="rounded-lg border border-[#3A2A22]/10 bg-[#EFE7DC] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="m-0 font-[var(--font-label)] text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5E4B40]">Current Level</p>
                <p className="m-0 mt-1 font-[var(--font-display)] text-4xl font-semibold text-[#2C211C]">Level {level.level}</p>
              </div>
              <Trophy size={34} className="text-[#9A4F2B]" />
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#D8D0C2]">
              <div className="h-full rounded-full bg-[#C4713A]" style={{ width: `${level.progress}%` }} />
            </div>
            <p className="m-0 mt-3 text-sm leading-6 text-[#5E4B40]">
              {level.points} travel points. {Math.max(0, level.nextLevelPoints - level.points)} points until Level {level.level + 1}.
            </p>
          </aside>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav aria-label="Profile sections" className="no-scrollbar mb-8 flex gap-2 overflow-x-auto rounded-full border border-[#3A2A22]/10 bg-[#FFF9F0] p-1.5 shadow-[0_12px_28px_rgba(58,42,34,0.06)]">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`min-h-10 shrink-0 rounded-full px-4 font-[var(--font-label)] text-[0.72rem] font-bold uppercase tracking-[0.08em] transition ${
                activeTab === tab ? "bg-[#3A2A22] text-[#FFF9F0]" : "text-[#3A2A22] hover:bg-[#EFE7DC]"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {status ? <div className="mb-6 rounded-lg border border-[#C4713A]/30 bg-[#FFF4E8] p-4 text-sm font-semibold text-[#7A4B32]">{status}</div> : null}
        {profileCompletion < 100 ? (
          <div className="mb-6 rounded-lg border border-[#C4713A]/30 bg-[#FFF4E8] p-4 text-sm leading-6 text-[#5E4B40]" role="status">
            <strong className="text-[#7A4B32]">Complete your profile to unlock the best travel experience.</strong>{" "}
            Add your bio, avatar, location, interests, and travel style when you are ready.
          </div>
        ) : null}

        {activeTab === "Overview" ? (
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pinsCreated > 0 ? <StatCard label="Pins Created" value={pinsCreated} supporting="Places mapped from your travels." /> : <FirstPinPrompt />}
              <StatCard label="Stories Posted" value={storiesPosted} supporting="Travel notes shared with the community." />
              <StatCard label="Saved Places" value={savedPlaces} supporting="Stories and destinations saved for later." />
              <StatCard label="Followers" value={followersCount.toLocaleString()} />
              <StatCard label="Following" value={followingCount.toLocaleString()} />
              <StatCard label="Travel Groups" value={travelGroups} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <Panel title="Account & Privacy" eyebrow="Owner View">
                <dl className="grid gap-3 text-sm">
                  {[
                    ["Plan", formatPlan(user.plan)],
                    ["Public contact", maskEmail(user.email)],
                    ["Profile completion", `${profileCompletion}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 rounded-lg bg-[#F5F0E8] p-4">
                      <dt className="font-[var(--font-label)] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5E4B40]">{label}</dt>
                      <dd className="m-0 text-right font-semibold text-[#2C211C]">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="m-0 mt-4 text-sm leading-6 text-[#5E4B40]">
                  Email is masked on profile surfaces by default. Edit private account information from Settings.
                </p>
              </Panel>

              <Panel
                title="Achievements"
                eyebrow={`${unlockedBadges}/${badges.length} unlocked`}
                action={<button type="button" onClick={() => setActiveTab("Achievements")} className="text-sm font-bold text-[#7A4B32]">View all</button>}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {badges.map((badge) => (
                    <BadgeCard key={badge.title} badge={badge} />
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        ) : null}

        {activeTab === "Achievements" ? (
          <Panel title="Badges / Achievements" eyebrow={`${unlockedBadges}/${badges.length} unlocked`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <BadgeCard key={badge.title} badge={badge} />
              ))}
            </div>
          </Panel>
        ) : null}

        {activeTab === "Saved Places" ? (
          <Panel
            title="Saved Places"
            eyebrow="Collection"
            action={
              <select
                value={savedFilter}
                onChange={(event) => setSavedFilter(event.target.value as SavedItemFilter)}
                className="min-h-10 rounded-full border border-[#3A2A22]/15 bg-[#FFF9F0] px-4 text-sm font-bold text-[#3A2A22] outline-none"
              >
                {(["All", "Places", "Stories", "Routes", "Travel Plans", "Markers", "Favorites"] as SavedItemFilter[]).map((filter) => (
                  <option key={filter} value={filter}>{filter}</option>
                ))}
              </select>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              {savedItems.map((item) => (
                <article key={`${item.type}-${item.id}`} className="rounded-lg border border-[#3A2A22]/10 bg-[#F5F0E8] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2C211C]">{item.title}</h3>
                    {item.type === "Places" ? (
                      <button type="button" onClick={() => setPendingSavedPlaceDelete(item.source as TouristSpot)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#B23B2E]/25 text-[#8A2F25] hover:bg-[#B23B2E]/10" aria-label={`Delete ${item.title}`}>
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                  <p className="m-0 mt-1 font-[var(--font-label)] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#7A4B32]">{item.type}</p>
                  <p className="m-0 mt-3 text-sm leading-6 text-[#5E4B40]">{item.subtitle || "Saved for later."}</p>
                  <div className="mt-4 text-xs font-semibold text-[#5E4B40]">Saved {formatDate(item.createdAt)}</div>
                </article>
              ))}
              {!savedItems.length ? <EmptyState icon={Bookmark} title="No saved places yet" copy="Saved stories, routes, markers, and travel plans will appear here once you begin collecting places." /> : null}
            </div>
          </Panel>
        ) : null}

        {activeTab === "Draft Plans" ? (
          <Panel
            title="Draft Travel Plans"
            eyebrow="Private Workspace"
            action={<NavLink to="/maps" className="text-sm font-bold text-[#7A4B32]">Create with Draw Route</NavLink>}
          >
            <div className="mb-5 rounded-lg border border-[#C4713A]/25 bg-[#FFF4E8] p-4 text-sm leading-6 text-[#5E4B40]">
              Drafts are only visible to you. Finish documenting every point, then publish the Travel Plan when it is ready for the public page.
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {draftTravelPlans.map((plan) => (
                <DraftPlanCard key={plan.id} plan={plan} onOpen={() => setActiveDraftPlanId(plan.id)} />
              ))}
              {!draftTravelPlans.length ? (
                <EmptyState
                  icon={BookOpen}
                  title="No draft travel plans yet"
                  copy="Use Draw Route on the map to create a private multi-destination itinerary. Drafts will appear here before they are published."
                />
              ) : null}
            </div>
          </Panel>
        ) : null}

        {activeTab === "Travel Groups" ? (
          <Panel title="Travel Groups" eyebrow="Community" action={<NavLink to="/travel-groups" className="text-sm font-bold text-[#7A4B32]">Manage groups</NavLink>}>
            <div className="grid gap-4 md:grid-cols-2">
              {data.groups.map((group) => (
                <article key={group.circle_id} className="rounded-lg border border-[#3A2A22]/10 bg-[#F5F0E8] p-4">
                  <h3 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2C211C]">{group.name}</h3>
                  <p className="m-0 mt-1 text-sm text-[#5E4B40]">{group.members.length} member{group.members.length === 1 ? "" : "s"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.members.slice(0, 5).map((member) => (
                      <span key={member.user_id} className="rounded-full bg-[#FFF9F0] px-3 py-1 text-xs font-semibold text-[#5E4B40]">
                        {member.display_name || member.user_id}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
              {!data.groups.length ? <EmptyState icon={Users} title="No travel groups yet" copy="Groups you join or create will appear here for quick access." /> : null}
            </div>
          </Panel>
        ) : null}

        {activeTab === "Calendar" ? (
          <TravelPlanCalendar plans={travelPlans} ownerId={user.id} />
        ) : null}

        {activeTab === "Settings" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <Panel title="Edit Profile Information" eyebrow="Private Settings">
              <form onSubmit={handleSaveProfile} className="grid gap-4">
                {[
                  ["Full Name", "name"],
                  ["Email", "email"],
                  ["Where You Live", "location"],
                  ["Nationality", "nationality"],
                  ["Joined / Registered", "joinedDate"],
                  ["Travel Style", "travelStyle"],
                  ["Interests", "interests"],
                ].map(([label, field]) => (
                  <label key={field} className="grid gap-2">
                    <span className="font-[var(--font-label)] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5E4B40]">{label}</span>
                    <input
                      value={form[field as keyof ProfileForm] ?? ""}
                      onChange={(event) => handleFormChange(field as keyof ProfileForm, event.target.value)}
                      className="min-h-11 rounded-lg border border-[#3A2A22]/15 bg-[#FFF9F0] px-3 text-sm text-[#2C211C] outline-none transition focus:border-[#C4713A] focus:ring-2 focus:ring-[#C4713A]/20"
                    />
                  </label>
                ))}
                <label className="grid gap-2">
                  <span className="font-[var(--font-label)] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5E4B40]">Bio</span>
                  <textarea
                    value={form.bio}
                    maxLength={160}
                    onChange={(event) => handleFormChange("bio", event.target.value.slice(0, 160))}
                    rows={5}
                    className="resize-none rounded-lg border border-[#3A2A22]/15 bg-[#FFF9F0] px-3 py-2 text-sm leading-6 text-[#2C211C] outline-none transition focus:border-[#C4713A] focus:ring-2 focus:ring-[#C4713A]/20"
                  />
                  <span className="text-right text-xs font-semibold text-[#5E4B40]">{160 - form.bio.length} characters remaining</span>
                </label>
                <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#3A2A22] px-5 font-[var(--font-label)] text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#FFF9F0] transition hover:bg-[#2C211C]">
                  <Save size={15} /> Save Profile
                </button>
              </form>
            </Panel>

            <Panel title="Account Safety" eyebrow="Permanent Actions">
              <div className="rounded-lg bg-[#F5F0E8] p-4">
                <p className="m-0 font-semibold text-[#2C211C]">Delete account</p>
                <p className="m-0 mt-2 text-sm leading-6 text-[#5E4B40]">
                  This removes your account data, profile information, and private map records.
                </p>
              </div>
              <NavLink
                to="/account/delete"
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#B23B2E]/35 bg-[#B23B2E]/10 px-4 font-[var(--font-label)] text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#9B2F25] transition hover:bg-[#B23B2E]/15"
              >
                <Trash2 size={16} /> Delete Account
              </NavLink>
            </Panel>
          </div>
        ) : null}
      </div>
      <ConfirmDialog
        open={Boolean(pendingSavedPlaceDelete)}
        title={`Delete ${pendingSavedPlaceDelete?.name ?? "this saved place"}?`}
        description={`Are you sure you want to delete "${pendingSavedPlaceDelete?.name ?? "this saved place"}" from your saved places?`}
        confirmLabel="Delete Saved Place"
        onConfirm={() => pendingSavedPlaceDelete && void handleDeleteSavedPlace(pendingSavedPlaceDelete.place_id)}
        onCancel={() => setPendingSavedPlaceDelete(null)}
      />
    </section>
  );
}

export default function ProfilePage() {
  return (
    <GatedPage featureName="Your travel profile">
      <ProfileContent />
    </GatedPage>
  );
}
