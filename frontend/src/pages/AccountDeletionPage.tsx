import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { GatedPage } from "../components/GatedPage";
import { useAuth } from "../context/AuthContext";
import { WorkspaceButton } from "../components/workspace/WorkspaceButton";
import { WorkspaceSection } from "../components/workspace/WorkspaceSection";
import { inputField, sectionCard } from "../components/workspace/workspaceStyles";
import { deleteAccount } from "../services/authApi";

function AccountDeletionContent() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [armed, setArmed] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canDelete = password.length >= 12 && confirmation === "Delete My Account" && armed;

  const handleDelete = async () => {
    if (!canDelete) return;
    setBusy(true);
    try {
      await deleteAccount(password);
      await logout();
      navigate("/");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Account deletion failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#F5F0E8] px-4 py-10 font-[var(--font-ui)] text-[#1A1A1A]">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="mb-2 font-[var(--font-label)] text-sm font-semibold uppercase tracking-[0.06em] text-[#C4713A]">Data ownership</p>
          <h1 className="m-0 font-[var(--font-display)] text-4xl font-semibold text-[#3A2A22]">Delete My Account</h1>
        </div>
        <WorkspaceSection title="Permanent Account Deletion" icon={AlertTriangle} iconClassName="text-[#C0392B]">
          <div className="rounded-lg border border-[#C0392B]/25 bg-[#C0392B]/10 p-4 text-sm leading-6 text-[#8a2c23]">
            This action is permanent and cannot be undone. Travel posts, photos, saved tourist spots, collections, meetup history, notifications, and location sharing records will be removed.
          </div>
          <div className="mt-5 grid gap-4">
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputField} placeholder="Confirm password" />
            <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputField} placeholder='Type "Delete My Account"' />
            <label className={`${sectionCard} flex min-h-12 cursor-pointer items-center gap-3`}>
              <input type="checkbox" checked={armed} onChange={(event) => setArmed(event.target.checked)} />
              <span>I understand this permanently removes my TravelPlaces data.</span>
            </label>
            <WorkspaceButton variant="primary" icon={Trash2} disabled={!canDelete || busy} onClick={() => void handleDelete()}>
              Permanently Delete Account
            </WorkspaceButton>
          </div>
          {status && <div className="mt-4 rounded-lg border border-[#C4713A]/25 bg-[#C4713A]/10 p-4 text-sm text-[#8a4b26]">{status}</div>}
        </WorkspaceSection>
      </div>
    </section>
  );
}

export default function AccountDeletionPage() {
  return <GatedPage featureName="Account settings"><AccountDeletionContent /></GatedPage>;
}
