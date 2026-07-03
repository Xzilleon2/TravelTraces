import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { GamifiedUser } from "./gamification";

export function UserProfileModal({ user, onClose }: { user: GamifiedUser; onClose: () => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    onClose();
    navigate(`/profile/${user.id}`);
  }, [navigate, onClose, user.id]);

  return null;
}
