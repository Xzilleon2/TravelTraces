import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Copy, LocateFixed, Plus, Trash2, UserPlus, WifiOff } from "lucide-react";
import { GatedPage } from "../components/GatedPage";
import { useAuth } from "../context/AuthContext";
import { WorkspaceButton } from "../components/workspace/WorkspaceButton";
import { WorkspaceSection } from "../components/workspace/WorkspaceSection";
import { fieldLabel, inputField, sectionCard, toggleGrid } from "../components/workspace/workspaceStyles";
import type { LocationVisibility, NotificationPreferences, TravelGroup, TravelNotification } from "../services/mappingApi";
import {
  checkInTravelGroup,
  createTravelGroup,
  createTravelGroupInvite,
  deleteTravelNotification,
  getNotificationPreferences,
  joinTravelGroup,
  listTravelGroupLocations,
  listTravelGroups,
  listTravelNotifications,
  markTravelNotificationRead,
  updateNotificationPreferences,
  updateTravelGroupLocation,
} from "../services/mappingApi";

const defaultPreferences: NotificationPreferences = {
  user_id: "demo-user",
  meetup_arrivals: true,
  destination_arrivals: true,
  check_ins: true,
  checkpoints: true,
  group_ride_start: true,
  event_arrivals: true,
};

function useCurrentPosition() {
  return () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is unavailable in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 });
  });
}

function TravelGroupsContent() {
  const { user } = useAuth();
  const viewerId = user!.id;
  const [groups, setGroups] = useState<TravelGroup[]>([]);
  const [activeId, setActiveId] = useState("");
  const [locations, setLocations] = useState(0);
  const [notifications, setNotifications] = useState<TravelNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({ ...defaultPreferences, user_id: viewerId });
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [visibility, setVisibility] = useState<LocationVisibility>("travel_group");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const getPosition = useCurrentPosition();

  const activeGroup = useMemo(() => groups.find((group) => group.circle_id === activeId) ?? groups[0] ?? null, [activeId, groups]);

  const refresh = async (nextActiveId = activeGroup?.circle_id || activeId) => {
    const nextGroups = await listTravelGroups(viewerId);
    setGroups(nextGroups);
    const selected = nextActiveId || nextGroups[0]?.circle_id || "";
    setActiveId(selected);
    if (selected) {
      const [nextLocations, nextNotifications] = await Promise.all([
        listTravelGroupLocations(selected),
        listTravelNotifications(selected),
      ]);
      setLocations(nextLocations.filter((item) => item.sharing_enabled && item.coordinate).length);
      setNotifications(nextNotifications);
    }
    setPreferences(await getNotificationPreferences(viewerId));
  };

  useEffect(() => {
    void refresh().catch(() => setStatus("Travel groups could not be loaded."));
  }, []);

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setBusy(true);
    try {
      const group = await createTravelGroup({ name: newGroupName.trim(), ownerId: viewerId, displayName: user?.name, role: "Organizer" });
      setNewGroupName("");
      await refresh(group.circle_id);
      setStatus("Travel group created.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create travel group.");
    } finally {
      setBusy(false);
    }
  };

  const joinGroup = async () => {
    if (!inviteCode.trim()) return;
    setBusy(true);
    try {
      const group = await joinTravelGroup({ inviteCode: inviteCode.trim(), userId: viewerId, displayName: user?.name, role: "Traveler" });
      setInviteCode("");
      await refresh(group.circle_id);
      setStatus("Joined travel group.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Invite code is invalid or expired.");
    } finally {
      setBusy(false);
    }
  };

  const generateInvite = async () => {
    if (!activeGroup) return;
    const invite = await createTravelGroupInvite(activeGroup.circle_id);
    setShareCode(invite.code);
    await navigator.clipboard?.writeText(invite.code).catch(() => undefined);
    setStatus("Invite code copied. It expires in 2 days.");
  };

  const shareLocation = async (enabled: boolean, checkIn = false) => {
    if (!activeGroup) return;
    setBusy(true);
    try {
      if (!enabled) {
        await updateTravelGroupLocation({ groupId: activeGroup.circle_id, userId: viewerId, sharingEnabled: false, visibilityScope: visibility });
      } else {
        const position = await getPosition();
        const payload = { groupId: activeGroup.circle_id, userId: viewerId, lat: position.coords.latitude, lon: position.coords.longitude, visibilityScope: visibility };
        if (checkIn) await checkInTravelGroup(payload);
        else await updateTravelGroupLocation({ ...payload, accuracyM: position.coords.accuracy, activity: "traveling", sharingEnabled: true });
      }
      await refresh(activeGroup.circle_id);
      setStatus(enabled ? "Location shared." : "Location sharing stopped.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Location update failed.");
    } finally {
      setBusy(false);
    }
  };

  const togglePreference = async (key: keyof Omit<NotificationPreferences, "user_id">) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(await updateNotificationPreferences(next));
  };

  return (
    <section className="min-h-screen bg-[#F5F0E8] px-4 py-8 font-[var(--font-ui)] text-[#1A1A1A]">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <div>
            <p className="mb-2 font-[var(--font-label)] text-sm font-semibold uppercase tracking-[0.06em] text-[#7A9E6F]">Travel coordination</p>
            <h1 className="m-0 font-[var(--font-display)] text-4xl font-semibold text-[#2D4A2D]">Travel Groups</h1>
          </div>
          <WorkspaceSection title="Create or Join" icon={UserPlus}>
            <div className="grid gap-3">
              <input value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} className={inputField} placeholder="New travel group name" />
              <WorkspaceButton variant="primary" icon={Plus} disabled={busy} onClick={() => void createGroup()}>Create Group</WorkspaceButton>
              <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} className={inputField} placeholder="Invite code" />
              <WorkspaceButton variant="secondary" icon={UserPlus} disabled={busy} onClick={() => void joinGroup()}>Join Group</WorkspaceButton>
            </div>
          </WorkspaceSection>
          <WorkspaceSection title="Live Location" icon={LocateFixed}>
            <div className="grid gap-3">
              <label className="grid gap-2">
                <span className={fieldLabel}>Active group</span>
                <select value={activeId} onChange={(event) => { setActiveId(event.target.value); void refresh(event.target.value); }} className={inputField}>
                  {groups.map((group) => <option key={group.circle_id} value={group.circle_id}>{group.name}</option>)}
                </select>
              </label>
              <label className="grid gap-2">
                <span className={fieldLabel}>Visibility</span>
                <select value={visibility} onChange={(event) => setVisibility(event.target.value as LocationVisibility)} className={inputField}>
                  <option value="private">Private</option><option value="friends">Friends</option><option value="travel_group">Travel Group</option><option value="event_participants">Event Participants</option><option value="public">Public</option>
                </select>
              </label>
              <div className={toggleGrid}>
                <WorkspaceButton variant="secondary" icon={LocateFixed} disabled={busy || !activeGroup} onClick={() => void shareLocation(true)}>Share</WorkspaceButton>
                <WorkspaceButton variant="neutral" icon={WifiOff} disabled={busy || !activeGroup} onClick={() => void shareLocation(false)}>Stop</WorkspaceButton>
              </div>
              <WorkspaceButton variant="primary" icon={Check} disabled={busy || !activeGroup} onClick={() => void shareLocation(true, true)}>Check In</WorkspaceButton>
              <div className={sectionCard}>{locations} active shared locations in this travel group.</div>
            </div>
          </WorkspaceSection>
        </div>
        <div className="space-y-6">
          <WorkspaceSection title="Invite Code" icon={Copy}>
            <WorkspaceButton variant="secondary" icon={Copy} disabled={!activeGroup} onClick={() => void generateInvite()}>Generate 2-Day Code</WorkspaceButton>
            {shareCode && <div className="mt-4 rounded-lg bg-[#F5F0E8] p-4 text-center font-[var(--font-display)] text-3xl font-bold text-[#2D4A2D]">{shareCode}</div>}
          </WorkspaceSection>
          <WorkspaceSection title="Notifications" icon={Bell}>
            <div className="grid gap-2">
              {notifications.map((item) => {
                const read = item.read_by.includes(viewerId);
                return (
                  <div key={item.event_id} className={`rounded-lg border p-3 text-sm ${read ? "border-[#2D4A2D]/10 bg-[#F5F0E8]" : "border-[#C4713A]/30 bg-[#C4713A]/10"}`}>
                    <div className="font-semibold">{item.message}</div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => void markTravelNotificationRead(item.circle_id, item.event_id, viewerId).then(() => refresh(activeId))} className="text-xs font-semibold uppercase text-[#2D4A2D]">Mark read</button>
                      <button onClick={() => void deleteTravelNotification(item.circle_id, item.event_id, viewerId).then(() => refresh(activeId))} className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-[#C0392B]"><Trash2 size={12} />Delete</button>
                    </div>
                  </div>
                );
              })}
              {!notifications.length && <div className="rounded-lg bg-[#F5F0E8] p-4 text-sm text-[#6B6B5A]">No travel notifications yet.</div>}
            </div>
          </WorkspaceSection>
          <WorkspaceSection title="Notification Preferences" icon={Bell}>
            <div className="grid gap-2 text-sm">
              {(["meetup_arrivals", "destination_arrivals", "check_ins", "checkpoints", "group_ride_start", "event_arrivals"] as const).map((key) => (
                <label key={key} className="flex min-h-10 items-center justify-between rounded-lg bg-[#F5F0E8] px-3">
                  <span className="capitalize">{key.replaceAll("_", " ")}</span>
                  <input type="checkbox" checked={preferences[key]} onChange={() => void togglePreference(key)} />
                </label>
              ))}
            </div>
          </WorkspaceSection>
          {status && <div className="rounded-lg border border-[#C4713A]/25 bg-[#C4713A]/10 p-4 text-sm text-[#8a4b26]">{status}</div>}
        </div>
      </div>
    </section>
  );
}

export default function TravelGroupsPage() {
  return <GatedPage featureName="Travel Groups"><TravelGroupsContent /></GatedPage>;
}
