import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { NavLink } from "react-router";
import {
  Award,
  Bookmark,
  Calendar,
  Camera,
  Edit3,
  Gem,
  Globe2,
  Mail,
  MapPin,
  Pin,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GatedPage } from "../components/GatedPage";
import { useAuth, type User } from "../context/AuthContext";
import type { ApiPin, TouristSpot, TravelGroup } from "../services/mappingApi";
import { listPins, listTouristSpots, listTravelGroups } from "../services/mappingApi";
import { LOCAL_STORIES_KEY, SAVED_STORIES_KEY } from "./StoriesPage";

const tabs = ["Overview", "Badges", "Saved Places", "Travel Groups", "Settings"] as const;
type ProfileTab = (typeof tabs)[number];

type ProfileData = {
  pins: ApiPin[];
  spots: TouristSpot[];
  groups: TravelGroup[];
};

const emptyProfileData: ProfileData = {
  pins: [],
  spots: [],
  groups: [],
};

type ProfileForm = Pick<User, "name" | "email" | "avatar" | "location" | "joinedDate" | "bio" | "nationality">;

function readStorageCount(key: string) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown[];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function formatDate(value?: string | number | null) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function calculateLevel(input: { pins: number; stories: number; savedPlaces: number; groups: number }) {
  const points = input.pins * 18 + input.stories * 24 + input.savedPlaces * 8 + input.groups * 30;
  const level = Math.max(1, Math.floor(points / 120) + 1);
  const currentFloor = (level - 1) * 120;
  const nextFloor = level * 120;
  const progress = Math.min(100, Math.round(((points - currentFloor) / Math.max(1, nextFloor - currentFloor)) * 100));
  return { level, points, progress, nextLevelPoints: nextFloor };
}

function buildBadges(input: { pins: number; stories: number; savedPlaces: number; followers: number; groups: number }) {
  return [
    { title: "First Trace", detail: "Created a travel pin", unlocked: input.pins > 0, icon: Pin },
    { title: "Story Keeper", detail: "Posted 3 or more stories", unlocked: input.stories >= 3, icon: Sparkles },
    { title: "Trail Curator", detail: "Saved 5 travel places or stories", unlocked: input.savedPlaces >= 5, icon: Bookmark },
    { title: "Community Signal", detail: "Reached 100 followers", unlocked: input.followers >= 100, icon: Users },
    { title: "Group Traveler", detail: "Joined a travel group", unlocked: input.groups > 0, icon: ShieldCheck },
    { title: "Hidden Gem Hunter", detail: "Built a rich travel profile", unlocked: input.pins + input.stories >= 10, icon: Gem },
  ];
}

function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="rounded border border-[#3A2A22]/10 bg-[#FBF7F0] p-4 shadow-[0_14px_34px_rgba(58,42,34,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded bg-[#EFE7DC] text-[#C4713A]">
          <Icon size={18} />
        </span>
        <strong className="font-[var(--font-display)] text-3xl font-semibold leading-none text-[#2C211C]">{value}</strong>
      </div>
      <p className="m-0 mt-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#6B5A50]">{label}</p>
    </div>
  );
}

function SectionPanel({ title, icon: Icon, children, action }: { title: string; icon: LucideIcon; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded border border-[#3A2A22]/10 bg-[#EFE7DC] p-5 shadow-[0_18px_44px_rgba(58,42,34,0.08)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={19} className="text-[#C4713A]" />
          <h2 className="m-0 font-[var(--font-display)] text-2xl font-semibold text-[#2C211C]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="rounded border border-dashed border-[#3A2A22]/20 bg-[#FBF7F0] p-6 text-center text-[#6B5A50]">
      <Icon className="mx-auto mb-3 text-[#C4713A]" size={26} />
      <p className="m-0 text-sm">{title}</p>
    </div>
  );
}

function ProfileContent() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("Overview");
  const [data, setData] = useState<ProfileData>(emptyProfileData);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [savedStoriesCount, setSavedStoriesCount] = useState(0);
  const [localStoriesCount, setLocalStoriesCount] = useState(0);
  const [form, setForm] = useState<ProfileForm | null>(null);

  const groupIds = useMemo(() => user?.groupIds ?? [], [user?.groupIds]);

  useEffect(() => {
    setSavedStoriesCount(readStorageCount(SAVED_STORIES_KEY));
    setLocalStoriesCount(readStorageCount(LOCAL_STORIES_KEY));
  }, []);

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
    });
  }, [user]);

  useEffect(() => {
    const currentUser = user;
    if (!currentUser) return undefined;
    let cancelled = false;
    setLoading(true);
    setStatus(null);

    async function loadProfileData() {
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

    void loadProfileData().catch(() => {
      if (!cancelled) {
        setData(emptyProfileData);
        setStatus("Profile activity could not be loaded right now.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [groupIds, user]);

  if (!user || !form) return null;

  const pinsCreated = loading ? user.pinsCount : data.pins.length;
  const storiesPosted = user.storiesCount + localStoriesCount;
  const savedPlaces = data.spots.length + savedStoriesCount;
  const travelGroups = data.groups.length;
  const level = calculateLevel({ pins: pinsCreated, stories: storiesPosted, savedPlaces, groups: travelGroups });
  const badges = buildBadges({
    pins: pinsCreated,
    stories: storiesPosted,
    savedPlaces,
    followers: user.followersCount,
    groups: travelGroups,
  });
  const unlockedBadges = badges.filter((badge) => badge.unlocked).length;

  const handleFormChange = (field: keyof ProfileForm, value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
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
    });
    setStatus("Profile information updated for this session.");
    setActiveTab("Overview");
  };

  const overviewStats = [
    { label: "Pins Created", value: pinsCreated, icon: Pin },
    { label: "Followers", value: user.followersCount.toLocaleString(), icon: Users },
    { label: "Following", value: user.followingCount.toLocaleString(), icon: UserRound },
    { label: "Stories Posted", value: storiesPosted, icon: Sparkles },
    { label: "Saved Places", value: savedPlaces, icon: Bookmark },
    { label: "Travel Groups", value: travelGroups, icon: Globe2 },
  ];

  return (
    <section className="min-h-screen bg-[#F5F0E8] font-[var(--font-ui)] text-[#2C211C]">
      <div className="bg-[#2C211C] px-4 py-9 text-[#FBF7F0] sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            <div className="relative w-fit shrink-0">
              <img
                src={user.avatar}
                alt={`${user.name} profile`}
                className="h-32 w-32 rounded-full border-4 border-[#FBF7F0]/35 object-cover shadow-[0_24px_50px_rgba(0,0,0,0.24)]"
              />
              <span className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full border-2 border-[#2C211C] bg-[#C4713A]">
                <Camera size={16} />
              </span>
            </div>

            <div className="min-w-0">
              <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#CFA68A]">Traveler Profile</p>
              <h1 className="m-0 mt-2 font-[var(--font-display)] text-[clamp(2.2rem,7vw,4rem)] font-semibold leading-none">{user.name}</h1>
              <div className="mt-4 grid gap-2 text-sm text-[#EFE7DC]/82 sm:grid-cols-2">
                <span className="inline-flex items-center gap-2"><Mail size={15} />{user.email}</span>
                <span className="inline-flex items-center gap-2"><MapPin size={15} />{user.location || "No home location added"}</span>
                <span className="inline-flex items-center gap-2"><Calendar size={15} />Joined {user.joinedDate || "recently"}</span>
                <span className="inline-flex items-center gap-2"><Globe2 size={15} />{user.nationality || "Nationality not set"}</span>
              </div>
              <p className="m-0 mt-5 max-w-3xl font-[var(--font-body)] text-base leading-7 text-[#FBF7F0]/86">
                {user.bio || "No bio added yet."}
              </p>
            </div>
          </div>

          <div className="rounded border border-[#FBF7F0]/12 bg-[#FBF7F0]/8 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.12em] text-[#CFA68A]">Current Level</p>
                <p className="m-0 mt-1 font-[var(--font-display)] text-4xl font-semibold">Level {level.level}</p>
              </div>
              <Trophy size={38} className="text-[#C4713A]" />
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#FBF7F0]/14">
              <div className="h-full rounded-full bg-[#C4713A]" style={{ width: `${level.progress}%` }} />
            </div>
            <p className="m-0 mt-3 text-xs leading-5 text-[#EFE7DC]/75">
              {level.points} travel points. {level.nextLevelPoints - level.points} points until Level {level.level + 1}.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto rounded border border-[#3A2A22]/10 bg-[#FBF7F0]/85 p-2 shadow-[0_12px_34px_rgba(58,42,34,0.08)]">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`min-h-11 shrink-0 rounded px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] transition ${
                activeTab === tab ? "bg-[#3A2A22] text-[#FBF7F0]" : "text-[#3A2A22] hover:bg-[#EFE7DC]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {status ? <div className="mb-5 rounded border border-[#C4713A]/25 bg-[#C4713A]/10 p-4 text-sm text-[#7A3E1E]">{status}</div> : null}

        {activeTab === "Overview" ? (
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {overviewStats.map((stat) => (
                <div key={stat.label}>
                  <StatTile icon={stat.icon} label={stat.label} value={stat.value} />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setActiveTab("Settings")}
                className="rounded border border-[#3A2A22]/10 bg-[#3A2A22] p-4 text-left text-[#FBF7F0] shadow-[0_14px_34px_rgba(58,42,34,0.12)] transition hover:bg-[#2C211C]"
              >
                <span className="grid h-10 w-10 place-items-center rounded bg-[#FBF7F0]/12 text-[#CFA68A]">
                  <Settings size={18} />
                </span>
                <strong className="mt-4 block font-[var(--font-display)] text-3xl font-semibold leading-none">Settings</strong>
                <span className="mt-2 block font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#EFE7DC]/78">Edit profile and account</span>
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <SectionPanel title="Profile Details" icon={UserRound}>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  {[
                    ["Full Name", user.name],
                    ["Email", user.email],
                    ["Lives In", user.location || "Not set"],
                    ["Joined", user.joinedDate || "Recently"],
                    ["Nationality", user.nationality || "Not set"],
                    ["Plan", user.plan],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded bg-[#FBF7F0] p-3">
                      <dt className="font-[var(--font-label)] text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#9E6B5C]">{label}</dt>
                      <dd className="m-0 mt-1 font-semibold text-[#2C211C]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </SectionPanel>

              <SectionPanel title="Achievements" icon={Award}>
                <div className="mb-4 flex items-center justify-between rounded bg-[#FBF7F0] p-3">
                  <span className="text-sm font-semibold text-[#6B5A50]">Unlocked badges</span>
                  <strong className="font-[var(--font-display)] text-2xl text-[#2C211C]">{unlockedBadges}/{badges.length}</strong>
                </div>
                <div className="grid gap-3">
                  {badges.slice(0, 3).map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <div key={badge.title} className={`flex items-center gap-3 rounded p-3 ${badge.unlocked ? "bg-[#FBF7F0]" : "bg-[#D8D0C2]/50 opacity-70"}`}>
                        <span className="grid h-9 w-9 place-items-center rounded bg-[#EFE7DC] text-[#C4713A]"><Icon size={17} /></span>
                        <div>
                          <p className="m-0 font-semibold text-[#2C211C]">{badge.title}</p>
                          <p className="m-0 mt-0.5 text-xs text-[#6B5A50]">{badge.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionPanel>
            </div>
          </div>
        ) : null}

        {activeTab === "Badges" ? (
          <SectionPanel title="Badges / Achievements" icon={Award}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <article key={badge.title} className={`rounded border p-5 ${badge.unlocked ? "border-[#C4713A]/25 bg-[#FBF7F0]" : "border-[#3A2A22]/8 bg-[#D8D0C2]/45"}`}>
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <span className={`grid h-12 w-12 place-items-center rounded ${badge.unlocked ? "bg-[#C4713A] text-[#FBF7F0]" : "bg-[#EFE7DC] text-[#9A8C7C]"}`}>
                        <Icon size={22} />
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] ${badge.unlocked ? "bg-[#C4713A]/12 text-[#7A3E1E]" : "bg-[#3A2A22]/8 text-[#6B5A50]"}`}>
                        {badge.unlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                    <h3 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2C211C]">{badge.title}</h3>
                    <p className="m-0 mt-2 text-sm leading-6 text-[#6B5A50]">{badge.detail}</p>
                  </article>
                );
              })}
            </div>
          </SectionPanel>
        ) : null}

        {activeTab === "Saved Places" ? (
          <SectionPanel title="Saved Places" icon={Bookmark} action={<NavLink to="/saved-places" className="text-sm font-bold text-[#9E6B5C]">Open saved page</NavLink>}>
            <div className="grid gap-4 md:grid-cols-2">
              {data.spots.map((spot) => (
                <article key={spot.place_id} className="rounded bg-[#FBF7F0] p-4">
                  <h3 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2C211C]">{spot.name}</h3>
                  <p className="m-0 mt-1 text-sm font-semibold text-[#9E6B5C]">{spot.category}</p>
                  <p className="mt-3 text-sm leading-6 text-[#6B5A50]">{spot.notes || "No notes yet."}</p>
                  <div className="mt-4 text-xs text-[#6B6B5A]">Saved {formatDate(spot.saved_at)}</div>
                </article>
              ))}
              {!data.spots.length ? <EmptyState icon={Bookmark} title="Saved stories and tourist spots will appear here." /> : null}
            </div>
          </SectionPanel>
        ) : null}

        {activeTab === "Travel Groups" ? (
          <SectionPanel title="Travel Groups" icon={Users} action={<NavLink to="/travel-groups" className="text-sm font-bold text-[#9E6B5C]">Manage groups</NavLink>}>
            <div className="grid gap-4 md:grid-cols-2">
              {data.groups.map((group) => (
                <article key={group.circle_id} className="rounded bg-[#FBF7F0] p-4">
                  <h3 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2C211C]">{group.name}</h3>
                  <p className="m-0 mt-1 text-sm text-[#6B5A50]">{group.members.length} member{group.members.length === 1 ? "" : "s"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.members.slice(0, 5).map((member) => (
                      <span key={member.user_id} className="rounded-full bg-[#EFE7DC] px-3 py-1 text-xs font-semibold text-[#9E6B5C]">
                        {member.display_name || member.user_id}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
              {!data.groups.length ? <EmptyState icon={Users} title="No travel groups joined yet." /> : null}
            </div>
          </SectionPanel>
        ) : null}

        {activeTab === "Settings" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <SectionPanel title="Edit Profile Information" icon={Edit3}>
              <form onSubmit={handleSaveProfile} className="grid gap-4">
                {[
                  ["Full Name", "name"],
                  ["Email", "email"],
                  ["Where You Live", "location"],
                  ["Nationality", "nationality"],
                  ["Joined / Registered", "joinedDate"],
                  ["Profile Picture URL", "avatar"],
                ].map(([label, field]) => (
                  <label key={field} className="grid gap-2">
                    <span className="font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#6B5A50]">{label}</span>
                    <input
                      value={form[field as keyof ProfileForm]}
                      onChange={(event) => handleFormChange(field as keyof ProfileForm, event.target.value)}
                      className="min-h-11 rounded border border-[#3A2A22]/15 bg-[#FBF7F0] px-3 text-sm outline-none transition focus:border-[#C4713A]"
                    />
                  </label>
                ))}
                <label className="grid gap-2">
                  <span className="font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#6B5A50]">Bio</span>
                  <textarea
                    value={form.bio}
                    onChange={(event) => handleFormChange("bio", event.target.value)}
                    rows={5}
                    className="resize-none rounded border border-[#3A2A22]/15 bg-[#FBF7F0] px-3 py-2 text-sm leading-6 outline-none transition focus:border-[#C4713A]"
                  />
                </label>
                <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#3A2A22] px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#FBF7F0] transition hover:bg-[#2C211C]">
                  <Save size={15} /> Save Profile
                </button>
              </form>
            </SectionPanel>

            <SectionPanel title="Settings" icon={Settings}>
              <div className="grid gap-4">
                <div className="rounded bg-[#FBF7F0] p-4">
                  <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#9E6B5C]">Account</p>
                  <p className="m-0 mt-2 text-sm leading-6 text-[#6B5A50]">Manage your public information, account safety, and permanent account deletion.</p>
                </div>
                <NavLink
                  to="/account/delete"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#C0392B] transition hover:bg-[#C0392B]/15"
                >
                  <Trash2 size={16} /> Delete Account
                </NavLink>
              </div>
            </SectionPanel>
          </div>
        ) : null}
      </div>
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
