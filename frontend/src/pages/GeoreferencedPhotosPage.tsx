import { Navigate } from "react-router";

/** Photos are merged into map markers; keep route for backward-compatible bookmarks. */
export default function GeoreferencedPhotosPage() {
  return <Navigate to="/maps" replace />;
}
