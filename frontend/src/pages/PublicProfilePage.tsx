import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Award,
  CheckCircle2,
  Flag,
  Globe2,
  Lock,
  MapPin,
  MessageSquare,
  Send,
  Share2,
  Sparkles,
  Trophy,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { BADGES, GAMIFIED_USERS, type BadgeId, type GamifiedUser, getLevelFromXp, getXpProgress } from "../components/gamification";
import { GatedPage } from "../components/GatedPage";
import type { User } from "../context/AuthContext";
import type { ApiPin, TravelGroup } from "../services/mappingApi";
import { listLocalStories, readLocalTable } from "../services/localDb";

const LOCKED_BADGE_LIMIT = 12;

function publicCount(seed: number, fallback: number): number {
  return Number.isFinite(seed) && seed > 0 ? seed : fallback;
}

function localAvatar(user: User) {
  if (user.avatar) return user.avatar;
  const initials = (user.name || user.email || "TT").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#EDEAE0"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#7A4B32">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function localUserToGamifiedUser(user: User): GamifiedUser {
  const stories = listLocalStories().filter((story) => story.ownerId === user.id || story.author === user.name);
  const pins = readLocalTable<ApiPin>("pins").filter((pin) => pin.creator_id === user.id);
  const groups = readLocalTable<TravelGroup>("travelGroups").filter((group) => group.owner_id === user.id || group.members.some((member) => member.user_id === user.id));
  const badges: BadgeId[] = [];
  if (pins.length > 0) badges.push("first_step");
  if (stories.length >= 3) badges.push("storyteller");
  const xp = badges.length * 100;
  return {
    id: user.id,
    name: user.name || user.email,
    avatar: localAvatar(user),
    location: user.location || "Location not set",
    bio: user.bio || "No bio added yet.",
    xp,
    storiesCount: stories.length,
    pinsCount: pins.length,
    challengesCompleted: badges.length,
    communitiesJoined: groups.length,
    badges,
    joinedDate: user.joinedDate || "recently",
    recentStories: stories.filter((story) => (story.scope ?? "public") === "public").slice(0, 4).map((story) => ({
      id: story.id,
      title: story.title,
      region: story.region,
      img: story.img,
      date: story.date,
      likes: story.likes,
    })),
  };
}

function Panel({ title, eyebrow, children, action }: { title: string; eyebrow?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#3A2A22]/10 bg-[#FFF9F0] p-5 shadow-[0_16px_36px_rgba(58,42,34,0.07)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
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
    <div className="rounded-lg border border-[#3A2A22]/10 bg-[#FFF9F0] p-4">
      <p className="m-0 font-[var(--font-label)] text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5E4B40]">{label}</p>
      <strong className="mt-2 block font-[var(--font-display)] text-2xl font-semibold leading-none text-[#2C211C]">{value}</strong>
      {supporting ? <p className="m-0 mt-2 text-sm leading-5 text-[#5E4B40]">{supporting}</p> : null}
    </div>
  );
}

function VisitorBadge({ badgeId, unlocked }: { badgeId: BadgeId; unlocked: boolean }) {
  const badge = BADGES[badgeId];
  return (
    <article className={`rounded-lg border p-4 ${unlocked ? "border-[#C4713A]/35 bg-[#FFF9F0]" : "border-[#3A2A22]/10 bg-[#EFE7DC]/70"}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${unlocked ? "bg-[#C4713A] text-[#FFF9F0]" : "bg-[#D8D0C2] text-[#5E4B40]"}`}>
          {unlocked ? <Award size={18} /> : <Lock size={16} />}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 font-[var(--font-display)] text-lg font-semibold leading-tight text-[#2C211C]">{badge.name}</h3>
            {unlocked ? <CheckCircle2 size={15} className="text-[#7A4B32]" aria-label="Unlocked" /> : null}
          </div>
          <p className="m-0 mt-1 text-sm leading-5 text-[#5E4B40]">{badge.description}</p>
          <p className={`m-0 mt-3 font-[var(--font-label)] text-[0.66rem] font-bold uppercase tracking-[0.1em] ${unlocked ? "text-[#7A4B32]" : "text-[#5E4B40]"}`}>
            {unlocked ? "Unlocked" : "Locked"}
          </p>
        </div>
      </div>
    </article>
  );
}

function VisitorAction({
  children,
  onClick,
  variant = "secondary",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
}) {
  const classes = {
    primary: "bg-[#3A2A22] text-[#FFF9F0] hover:bg-[#2C211C]",
    secondary: "border border-[#3A2A22]/15 bg-[#FFF9F0] text-[#3A2A22] hover:bg-[#EFE7DC]",
    danger: "border border-[#B23B2E]/30 bg-[#B23B2E]/10 text-[#9B2F25] hover:bg-[#B23B2E]/15",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 font-[var(--font-label)] text-[0.72rem] font-bold uppercase tracking-[0.08em] transition ${classes[variant]}`}
    >
      {children}
    </button>
  );
}

function PublicProfileView({ user }: { user: GamifiedUser }) {
  const [following, setFollowing] = useState(user.isFollowing ?? false);
  const [notice, setNotice] = useState<string | null>(null);
  const level = getLevelFromXp(user.xp);
  const progress = getXpProgress(user.xp);
  const unlockedBadgeSet = useMemo(() => new Set(user.badges), [user.badges]);
  const publicBadges = useMemo(() => {
    const locked = (Object.keys(BADGES) as BadgeId[]).filter((badgeId) => !unlockedBadgeSet.has(badgeId)).slice(0, Math.max(0, LOCKED_BADGE_LIMIT - user.badges.length));
    return [...user.badges, ...locked].slice(0, LOCKED_BADGE_LIMIT);
  }, [unlockedBadgeSet, user.badges]);
  const followersCount = publicCount(Math.round(user.xp / 9), user.storiesCount * 36);
  const followingCount = publicCount(user.communitiesJoined * 27, 48);
  const savedPlacesCount = publicCount(user.badges.length + Math.round(user.pinsCount / 3), user.storiesCount);
  const travelGroupsCount = user.communitiesJoined;

  const handleShare = () => {
    const profileUrl = `${window.location.origin}/profile/${user.id}`;
    void navigator.clipboard?.writeText(profileUrl);
    setNotice("Profile link copied.");
  };

  return (
    <section className="min-h-screen bg-[#F5F0E8] font-[var(--font-ui)] text-[#2C211C]">
      <header className="border-b border-[#3A2A22]/10 bg-[#FBF7F0] px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_20rem] lg:items-center">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <img
              src={user.avatar}
              alt={`${user.name} profile`}
              className="h-32 w-32 rounded-full border-4 border-[#EFE7DC] object-cover shadow-[0_18px_34px_rgba(58,42,34,0.16)]"
            />
            <div className="min-w-0">
              <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.16em] text-[#7A4B32]">Traveler Profile</p>
              <h1 className="m-0 mt-2 font-[var(--font-display)] text-[clamp(2.4rem,7vw,4.5rem)] font-semibold leading-none text-[#2C211C]">{user.name}</h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#5E4B40]">
                <span className="inline-flex items-center gap-2"><MapPin size={15} />{user.location}</span>
                <span className="inline-flex items-center gap-2"><Globe2 size={15} />TravelTraces member</span>
                <span className="inline-flex items-center gap-2"><Sparkles size={15} />Joined {user.joinedDate}</span>
              </div>
              <p className="m-0 mt-5 max-w-3xl font-[var(--font-body)] text-base leading-7 text-[#4D4038]">{user.bio}</p>
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
              <div className="h-full rounded-full bg-[#C4713A]" style={{ width: `${progress.pct}%` }} />
            </div>
            <p className="m-0 mt-3 text-sm leading-6 text-[#5E4B40]">
              {user.xp.toLocaleString()} XP. {progress.needed > 0 ? `${Math.max(0, progress.needed - progress.current).toLocaleString()} XP until Level ${level.level + 1}.` : "Maximum level reached."}
            </p>
          </aside>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap gap-3">
          <VisitorAction variant={following ? "secondary" : "primary"} onClick={() => setFollowing((value) => !value)}>
            {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
            {following ? "Following" : "Follow"}
          </VisitorAction>
          <VisitorAction onClick={() => setNotice("Message request opened.")}>
            <MessageSquare size={15} /> Message
          </VisitorAction>
          <VisitorAction onClick={handleShare}>
            <Share2 size={15} /> Share Profile
          </VisitorAction>
          <VisitorAction variant="danger" onClick={() => setNotice("Report submitted for review.")}>
            <Flag size={15} /> Report User
          </VisitorAction>
        </div>

        {notice ? <div className="rounded-lg border border-[#C4713A]/30 bg-[#FFF4E8] p-3 text-sm font-semibold text-[#7A4B32]">{notice}</div> : null}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Pins Created" value={user.pinsCount.toLocaleString()} />
          <StatCard label="Stories Posted" value={user.storiesCount.toLocaleString()} />
          <StatCard label="Saved Places" value={savedPlacesCount.toLocaleString()} />
          <StatCard label="Followers" value={followersCount.toLocaleString()} />
          <StatCard label="Following" value={followingCount.toLocaleString()} />
          <StatCard label="Travel Groups" value={travelGroupsCount.toLocaleString()} />
        </div>

        <Panel title="Achievements" eyebrow={`${user.badges.length}/${Object.keys(BADGES).length} unlocked`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publicBadges.map((badgeId) => (
              <VisitorBadge key={badgeId} badgeId={badgeId} unlocked={unlockedBadgeSet.has(badgeId)} />
            ))}
          </div>
        </Panel>

        {user.recentStories.length > 0 ? (
          <Panel title="Recent Stories" eyebrow="Public Posts">
            <div className="grid gap-4 md:grid-cols-2">
              {user.recentStories.map((story) => (
                <article key={story.id} className="overflow-hidden rounded-lg border border-[#3A2A22]/10 bg-[#F5F0E8]">
                  <img src={story.img} alt={story.title} className="h-36 w-full object-cover" />
                  <div className="p-4">
                    <h3 className="m-0 font-[var(--font-display)] text-xl font-semibold leading-tight text-[#2C211C]">{story.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-[#5E4B40]">
                      <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{story.region}</span>
                      <span className="inline-flex items-center gap-1.5"><Send size={13} />{story.likes.toLocaleString()} likes</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        ) : null}
      </div>
    </section>
  );
}

function PublicProfileContent() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const localUser = userId ? readLocalTable<User>("users").find((user) => user.id === userId) : null;
  const publicUser = userId ? GAMIFIED_USERS[userId] ?? (localUser ? localUserToGamifiedUser(localUser) : null) : null;

  if (!publicUser) {
    return (
      <section className="min-h-screen bg-[#F5F0E8] px-4 py-16 text-center text-[#2C211C]">
        <h1 className="m-0 font-[var(--font-display)] text-4xl font-semibold">Traveler not found</h1>
        <p className="mx-auto mt-3 max-w-xl text-[#5E4B40]">This profile is not available or may have been removed.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-6 rounded-full bg-[#3A2A22] px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[#FFF9F0]"
        >
          Go back
        </button>
      </section>
    );
  }

  return <PublicProfileView user={publicUser} />;
}

export default function PublicProfilePage() {
  return (
    <GatedPage featureName="Traveler profile">
      <PublicProfileContent />
    </GatedPage>
  );
}
