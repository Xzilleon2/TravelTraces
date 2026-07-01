import { useEffect, useMemo, useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  Bell,
  Bookmark,
  Calendar,
  Camera,
  Compass,
  LogOut,
  Mail,
  Map,
  MapPin,
  Route,
  Settings,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GatedPage } from "../components/GatedPage";
import { useAuth } from "../context/AuthContext";
import type { ApiPin, TouristSpot, TravelGroup, TravelNotification, UserMap } from "../services/mappingApi";
import {
  listPins,
  listRoutes,
  listTouristSpots,
  listTravelGroups,
  listTravelNotifications,
  listUserMaps,
} from "../services/mappingApi";
import { listHostedTourMeetups, type HostedTourMeetupRecord } from "../services/eventsApi";

const tabs = ["Overview", "Travel Posts", "Saved Places", "Maps", "Travel Groups", "Meetups", "Settings"] as const;
type ProfileTab = (typeof tabs)[number];

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  date: string;
  icon: LucideIcon;
};

type ProfileData = {
  pins: ApiPin[];
  spots: TouristSpot[];
  maps: UserMap[];
  groups: TravelGroup[];
  routes: Array<Record<string, unknown>>;
  notifications: TravelNotification[];
  hostedMeetups: HostedTourMeetupRecord[];
};

const emptyProfileData: ProfileData = {
  pins: [],
  spots: [],
  maps: [],
  groups: [],
  routes: [],
  notifications: [],
  hostedMeetups: [],
};

function formatDate(value?: string | number | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatScope(scope?: string) {
  if (!scope) return "Private";
  return `${scope.charAt(0).toUpperCase()}${scope.slice(1)}`;
}

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#3A2A22]/10 bg-white/85 p-4 shadow-[0_14px_35px_rgba(58,42,34,0.08)]">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-[#EFE7DC] text-[#C4713A]">
        <Icon size={19} />
      </div>
      <div className="font-[var(--font-display)] text-3xl font-semibold text-[#2C211C]">{value}</div>
      <div className="mt-1 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#6B5A50]">{label}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, action }: { icon: LucideIcon; title: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[#3A2A22]/20 bg-[#F8F4EC] p-6 text-center text-[#6B5A50]">
      <Icon className="mx-auto mb-3 text-[#C4713A]" size={26} />
      <p className="m-0 font-[var(--font-ui)] text-sm">{title}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, action }: { title: string; icon: LucideIcon; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#3A2A22]/10 bg-[#EFE7DC] p-5 shadow-[0_18px_40px_rgba(58,42,34,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={19} className="shrink-0 text-[#C4713A]" />
          <h2 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2C211C]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SmallLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#3A2A22]/15 px-3 text-xs font-bold uppercase tracking-[0.06em] text-[#3A2A22] transition hover:bg-white"
    >
      {children}
    </NavLink>
  );
}

function ProfileContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>("Overview");
  const [data, setData] = useState<ProfileData>(emptyProfileData);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const groupIds = useMemo(() => user?.groupIds ?? [], [user?.groupIds]);

  useEffect(() => {
    if (!user) return undefined;

    let cancelled = false;
    setLoading(true);
    setStatus(null);

    async function loadProfileData() {
      const [pinsResult, spotsResult, mapsResult, groupsResult, routesResult] = await Promise.allSettled([
        listPins(user.id, groupIds),
        listTouristSpots(user.id),
        listUserMaps(user.id),
        listTravelGroups(user.id),
        listRoutes(user.id, groupIds),
      ]);

      const groups = groupsResult.status === "fulfilled" ? groupsResult.value : [];
      const notificationResults = await Promise.allSettled(groups.slice(0, 6).map((group) => listTravelNotifications(group.circle_id)));
      const notifications = notificationResults.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
      const hostedMeetups = listHostedTourMeetups().filter((meetup) => meetup.organizerId === user.id);

      if (cancelled) return;
      setData({
        pins: pinsResult.status === "fulfilled" ? pinsResult.value.filter((pin) => pin.creator_id === user.id) : [],
        spots: spotsResult.status === "fulfilled" ? spotsResult.value : [],
        maps: mapsResult.status === "fulfilled" ? mapsResult.value.filter((map) => map.owner_id === user.id || map.creator_id === user.id) : [],
        groups,
        routes: routesResult.status === "fulfilled" ? routesResult.value : [],
        notifications,
        hostedMeetups,
      });

      if ([pinsResult, spotsResult, mapsResult, groupsResult, routesResult].some((result) => result.status === "rejected")) {
        setStatus("Some profile activity could not be loaded. Available account data is still shown.");
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

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const activities: ActivityItem[] = [
      ...data.pins.map((pin) => ({
        id: `pin-${pin.pin_id}`,
        title: "Created travel post",
        detail: pin.title || pin.address || "Untitled travel post",
        date: pin.created_at,
        icon: MapPin,
      })),
      ...data.spots.map((spot) => ({
        id: `spot-${spot.place_id}`,
        title: "Saved tourist spot",
        detail: spot.name,
        date: spot.saved_at,
        icon: Bookmark,
      })),
      ...data.maps.map((map) => ({
        id: `map-${map.map_id}`,
        title: "Created map workspace",
        detail: map.title,
        date: map.created_at,
        icon: Map,
      })),
      ...data.hostedMeetups.map((meetup) => ({
        id: `meetup-${meetup.eventId}`,
        title: "Hosted tour meetup",
        detail: meetup.title,
        date: meetup.createdAt,
        icon: Calendar,
      })),
      ...data.notifications.map((notification) => ({
        id: `notice-${notification.event_id}`,
        title: "Travel group update",
        detail: notification.message,
        date: notification.created_at,
        icon: Bell,
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [data]);

  if (!user) return null;

  const handleLogout = () => {
    void logout().finally(() => navigate("/"));
  };

  return (
    <section className="min-h-screen bg-[#FBF7F0] font-[var(--font-ui)] text-[#2C211C]">
      <div className="border-b border-[#3A2A22]/10 bg-[#3A2A22] px-4 py-8 text-[#FBF7F0] sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end">
          <div className="relative w-fit shrink-0">
            <img
              src={user.avatar}
              alt={`${user.name} profile photo`}
              className="h-28 w-28 rounded-full border-4 border-[#EFE7DC]/35 object-cover shadow-[0_18px_45px_rgba(0,0,0,0.22)]"
            />
            <span className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full border-2 border-[#3A2A22] bg-[#C4713A] text-[#FBF7F0]">
              <Camera size={17} />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="m-0 font-[var(--font-display)] text-[clamp(2rem,6vw,3.5rem)] font-semibold leading-tight">{user.name}</h1>
              <span className="rounded-full bg-[#C4713A]/18 px-3 py-1 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] text-[#FBF7F0]">
                {user.plan}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#EFE7DC]/78">
              <span className="inline-flex items-center gap-2"><Mail size={15} />{user.email}</span>
              <span className="inline-flex items-center gap-2"><MapPin size={15} />{user.location || "No home region added"}</span>
              <span className="inline-flex items-center gap-2"><Calendar size={15} />Joined {user.joinedDate || "recently"}</span>
            </div>
            <p className="mt-4 max-w-3xl font-[var(--font-body)] text-base leading-7 text-[#EFE7DC]/86">
              {user.bio || "No bio added yet."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <button
              type="button"
              onClick={() => setActiveTab("Settings")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#EFE7DC]/25 px-4 text-sm font-bold uppercase tracking-[0.06em] text-[#EFE7DC] transition hover:bg-white/10"
            >
              <Settings size={16} /> Settings
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#C4713A] px-4 text-sm font-bold uppercase tracking-[0.06em] text-[#F5F0E8] transition hover:bg-[#a95d2c]"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto rounded-lg border border-[#3A2A22]/10 bg-white/70 p-2 shadow-[0_12px_30px_rgba(58,42,34,0.08)]">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`min-h-11 shrink-0 rounded-xl px-4 text-xs font-bold uppercase tracking-[0.06em] transition ${
                activeTab === tab ? "bg-[#3A2A22] text-[#FBF7F0]" : "text-[#3A2A22] hover:bg-[#EFE7DC]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {status ? <div className="mb-5 rounded-lg border border-[#C4713A]/25 bg-[#C4713A]/10 p-4 text-sm text-[#7A3E1E]">{status}</div> : null}

        {activeTab === "Overview" ? (
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={MapPin} label="Travel posts" value={loading ? "-" : data.pins.length} />
              <StatCard icon={Bookmark} label="Saved places" value={loading ? "-" : data.spots.length} />
              <StatCard icon={Map} label="Maps created" value={loading ? "-" : data.maps.length} />
              <StatCard icon={Users} label="Travel groups" value={loading ? "-" : data.groups.length} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <SectionCard title="Recent Activity" icon={Compass}>
                <div className="grid gap-3">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex gap-3 rounded-lg bg-white/75 p-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#F5F0E8] text-[#C4713A]">
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 font-semibold text-[#2C211C]">{activity.title}</p>
                          <p className="m-0 mt-1 text-sm text-[#6B5A50]">{activity.detail}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-[#6B6B5A]">{formatDate(activity.date)}</span>
                      </div>
                    );
                  })}
                  {!recentActivity.length ? <EmptyState icon={Compass} title="No recent travel activity yet." /> : null}
                </div>
              </SectionCard>

              <SectionCard title="Travel Snapshot" icon={Route}>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-white/75 p-3"><span>Saved routes</span><strong>{data.routes.length}</strong></div>
                  <div className="flex items-center justify-between rounded-lg bg-white/75 p-3"><span>Hosted meetups</span><strong>{data.hostedMeetups.length}</strong></div>
                  <div className="flex items-center justify-between rounded-lg bg-white/75 p-3"><span>Followers</span><strong>{user.followersCount.toLocaleString()}</strong></div>
                  <div className="flex items-center justify-between rounded-lg bg-white/75 p-3"><span>Following</span><strong>{user.followingCount.toLocaleString()}</strong></div>
                </div>
              </SectionCard>
            </div>
          </div>
        ) : null}

        {activeTab === "Travel Posts" ? (
          <SectionCard title="Created Travel Posts" icon={MapPin} action={<SmallLink to="/maps">Open Maps</SmallLink>}>
            <div className="grid gap-4 md:grid-cols-2">
              {data.pins.map((pin) => (
                <article key={pin.pin_id} className="rounded-lg bg-white/80 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2C211C]">{pin.title || "Untitled travel post"}</h3>
                      <p className="m-0 mt-1 text-xs font-bold uppercase tracking-[0.06em] text-[#9E6B5C]">{formatScope(pin.scope)} map</p>
                    </div>
                    <span className="rounded-full bg-[#C4713A]/12 px-3 py-1 text-xs font-bold text-[#7A3E1E]">{formatDate(pin.created_at)}</span>
                  </div>
                  <p className="line-clamp-3 text-sm leading-6 text-[#6B6B5A]">{pin.note || pin.address || "No notes added."}</p>
                  <div className="mt-4 text-xs text-[#6B6B5A]">{pin.coordinate.lat.toFixed(4)}, {pin.coordinate.lon.toFixed(4)}</div>
                </article>
              ))}
              {!data.pins.length ? <EmptyState icon={MapPin} title="No travel posts yet." action={<SmallLink to="/maps">Drop a marker</SmallLink>} /> : null}
            </div>
          </SectionCard>
        ) : null}

        {activeTab === "Saved Places" ? (
          <SectionCard title="Saved Tourist Spots" icon={Bookmark} action={<SmallLink to="/saved-places">Manage Saved Places</SmallLink>}>
            <div className="grid gap-4 md:grid-cols-2">
              {data.spots.map((spot) => (
                <article key={spot.place_id} className="rounded-lg bg-white/80 p-4">
                  <h3 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2C211C]">{spot.name}</h3>
                  <p className="m-0 mt-1 text-sm font-semibold text-[#9E6B5C]">{spot.category}</p>
                  <p className="mt-3 text-sm leading-6 text-[#6B6B5A]">{spot.notes || "No notes yet."}</p>
                  <div className="mt-4 text-xs text-[#6B6B5A]">Saved {formatDate(spot.saved_at)}</div>
                </article>
              ))}
              {!data.spots.length ? <EmptyState icon={Bookmark} title="No saved tourist spots yet." action={<SmallLink to="/saved-places">Save a place</SmallLink>} /> : null}
            </div>
          </SectionCard>
        ) : null}

        {activeTab === "Maps" ? (
          <SectionCard title="Created Maps" icon={Map} action={<SmallLink to="/maps">Open Workspace</SmallLink>}>
            <div className="grid gap-4 md:grid-cols-2">
              {data.maps.map((map) => (
                <article key={map.map_id} className="rounded-lg bg-white/80 p-4">
                  <h3 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2C211C]">{map.title}</h3>
                  <p className="m-0 mt-1 text-xs font-bold uppercase tracking-[0.06em] text-[#9E6B5C]">{formatScope(map.scope)} workspace</p>
                  <p className="mt-3 text-sm leading-6 text-[#6B6B5A]">{map.description || "No description added."}</p>
                  <div className="mt-4 text-xs text-[#6B6B5A]">Updated {formatDate(map.updated_at)}</div>
                </article>
              ))}
              {!data.maps.length ? <EmptyState icon={Map} title="No maps created yet." action={<SmallLink to="/maps">Create map activity</SmallLink>} /> : null}
            </div>
          </SectionCard>
        ) : null}

        {activeTab === "Travel Groups" ? (
          <SectionCard title="Travel Groups" icon={Users} action={<SmallLink to="/travel-groups">Manage Groups</SmallLink>}>
            <div className="grid gap-4 md:grid-cols-2">
              {data.groups.map((group) => (
                <article key={group.circle_id} className="rounded-lg bg-white/80 p-4">
                  <h3 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2C211C]">{group.name}</h3>
                  <p className="m-0 mt-1 text-sm text-[#6B6B5A]">{group.members.length} member{group.members.length === 1 ? "" : "s"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.members.slice(0, 4).map((member) => (
                      <span key={member.user_id} className="rounded-full bg-[#F5F0E8] px-3 py-1 text-xs font-semibold text-[#9E6B5C]">{member.display_name || member.user_id}</span>
                    ))}
                  </div>
                </article>
              ))}
              {!data.groups.length ? <EmptyState icon={Users} title="No travel groups joined yet." action={<SmallLink to="/travel-groups">Join a group</SmallLink>} /> : null}
            </div>
          </SectionCard>
        ) : null}

        {activeTab === "Meetups" ? (
          <SectionCard title="Meetups" icon={Calendar} action={<SmallLink to="/events">Browse Events</SmallLink>}>
            <div className="grid gap-4">
              {data.hostedMeetups.map((meetup) => (
                <article key={meetup.eventId} className="rounded-lg bg-white/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="m-0 font-[var(--font-display)] text-xl font-semibold text-[#2C211C]">{meetup.title}</h3>
                      <p className="m-0 mt-1 text-sm text-[#6B5A50]">{meetup.destinationTitle} / {meetup.meetingPoint}</p>
                    </div>
                    <span className="rounded-full bg-[#C4713A]/12 px-3 py-1 text-xs font-bold text-[#7A3E1E]">{formatDate(`${meetup.date}T${meetup.time || "00:00"}`)}</span>
                  </div>
                </article>
              ))}
              {!data.hostedMeetups.length ? <EmptyState icon={Calendar} title="No hosted travel meetups yet." action={<SmallLink to="/events">Host a tour meetup</SmallLink>} /> : null}
            </div>
          </SectionCard>
        ) : null}

        {activeTab === "Settings" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <SectionCard title="Account Settings" icon={Settings}>
              <div className="grid gap-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/75 p-3">
                  <span className="font-semibold text-[#6B6B5A]">Display name</span>
                  <span>{user.name}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/75 p-3">
                  <span className="font-semibold text-[#6B6B5A]">Email</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/75 p-3">
                  <span className="font-semibold text-[#6B6B5A]">Plan</span>
                  <span className="capitalize">{user.plan}</span>
                </div>
              </div>
            </SectionCard>
            <SectionCard title="Account Actions" icon={UserRound}>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#3A2A22] px-4 text-sm font-bold uppercase tracking-[0.06em] text-[#FBF7F0] transition hover:bg-[#2C211C]"
                >
                  <LogOut size={16} /> Logout
                </button>
                <NavLink
                  to="/account/delete"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 text-sm font-bold uppercase tracking-[0.06em] text-[#C0392B] transition hover:bg-[#C0392B]/15"
                >
                  <Trash2 size={16} /> Delete Account
                </NavLink>
              </div>
            </SectionCard>
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
