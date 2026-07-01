import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { AuthModal } from "./components/AuthModal";
import { AppSkeleton } from "./components/AppSkeleton";
import { ArrowUp } from "lucide-react";
import { useAuth } from "./context/AuthContext";

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
  const { isAuthenticated, authReady } = useAuth();
  const isImmersiveMap = location.pathname === "/maps";
  const showScrollTop = ["/explore", "/stories"].includes(location.pathname);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    document.querySelectorAll("img").forEach((image) => {
      image.loading = "lazy";
      image.decoding = "async";
    });
  }, [location.pathname]);

  useEffect(() => {
    if (!authReady) return;
    document.body.classList.toggle("logged-in-theme", isAuthenticated);
    return () => {
      document.body.classList.remove("logged-in-theme");
    };
  }, [authReady, isAuthenticated]);

  useEffect(() => {
    if (!showScrollTop) {
      setIsAtTop(true);
      return undefined;
    }

    const update = () => setIsAtTop(window.scrollY < 360);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [showScrollTop, location.pathname]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />

      <main className="page-shell" style={{ flex: 1, paddingTop: 64 }}>
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

      {showScrollTop && !isAtTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          className="floating-top-button"
        >
          <ArrowUp size={16} />
          <span>Top</span>
        </button>
      )}

      {!isImmersiveMap && <Footer />}
      <AuthModal />
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
