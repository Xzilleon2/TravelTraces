import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { AuthModal } from "./components/AuthModal";
import { CustomCursor } from "./components/CustomCursor";
import { AppSkeleton } from "./components/AppSkeleton";

// Page imports
const LandingPage = lazy(() => import("./pages/LandingPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const StoriesPage = lazy(() => import("./pages/StoriesPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const MappingLayerPage = lazy(() => import("./pages/MappingLayerPage"));
const MapsWorkspacePage = lazy(() => import("./pages/MapsWorkspacePage"));
const GeoreferencedPhotosPage = lazy(() => import("./pages/GeoreferencedPhotosPage"));
const TravelGroupsPage = lazy(() => import("./pages/TravelGroupsPage"));
const SavedTouristSpotsPage = lazy(() => import("./pages/SavedTouristSpotsPage"));
const AccountDeletionPage = lazy(() => import("./pages/AccountDeletionPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));

function AppLayout() {
  const location = useLocation();
  const isImmersiveMap = location.pathname === "/maps";

  useEffect(() => {
    document.querySelectorAll("img").forEach((image) => {
      image.loading = "lazy";
      image.decoding = "async";
    });
  }, [location.pathname]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />

      <main className="page-shell" style={{ flex: 1 }}>
        <Suspense fallback={<AppSkeleton />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/maps" element={<MapsWorkspacePage />} />

            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/map/layers" element={<MappingLayerPage />} />
            <Route path="/geo-photos" element={<GeoreferencedPhotosPage />} />
            <Route path="/travel-groups" element={<TravelGroupsPage />} />
            <Route path="/saved-places" element={<SavedTouristSpotsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/account/delete" element={<AccountDeletionPage />} />

            <Route path="*" element={<LandingPage />} />
          </Routes>
        </Suspense>
      </main>

      {!isImmersiveMap && <Footer />}
      <AuthModal />
      <CustomCursor />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}
