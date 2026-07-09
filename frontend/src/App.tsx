import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { AuthModal } from "./components/AuthModal";
import { AppSkeleton } from "./components/AppSkeleton";
import { ArrowUp } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { LANDING_IMAGE_LIST } from "./pages/landingAssets";

const onboardingCategories = ["Beaches", "Mountains", "Food Place", "Adventure", "Culture", "Wildlife", "Festivals", "Hidden Gems", "Forest", "Heritage", "Island Hopping", "Road Trips"];

// Page imports
const LandingPage = lazy(() => import("./pages/LandingPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const StoriesPage = lazy(() => import("./pages/StoriesPage"));
const TravelPlanStoriesPage = lazy(() => import("./pages/TravelPlanStoriesPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const MappingLayerPage = lazy(() => import("./pages/MappingLayerPage"));
const MapsWorkspacePage = lazy(() => import("./pages/MapsWorkspacePage"));
const GeoreferencedPhotosPage = lazy(() => import("./pages/GeoreferencedPhotosPage"));
const TravelGroupsPage = lazy(() => import("./pages/TravelGroupsPage"));
const AccountDeletionPage = lazy(() => import("./pages/AccountDeletionPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const image = new Image();
    image.decoding = "async";
    image.loading = "eager";
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;

    if (image.complete) {
      resolve();
    }
  });
}

function waitForFonts() {
  if (typeof document === "undefined" || !document.fonts?.ready) {
    return Promise.resolve();
  }

  return document.fonts.ready.catch(() => undefined);
}

function isPageReload() {
  if (typeof window === "undefined") return false;

  const navigation = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navigation) {
    return navigation.type === "reload";
  }

  return window.performance.navigation?.type === 1;
}

function LandingOpeningScreen({ progress, phase }: { progress: number; phase: "loading" | "exit" }) {
  return (
    <div className={`landing-opening-screen landing-opening-screen--${phase}`} aria-hidden="true">
      <div className="landing-opening-curtain landing-opening-curtain-top" />
      <div className="landing-opening-curtain landing-opening-curtain-bottom" />
      <div className="landing-opening-panel landing-opening-panel-left" />
      <div className="landing-opening-panel landing-opening-panel-right" />
      <div className="landing-opening-glow landing-opening-glow-left" />
      <div className="landing-opening-glow landing-opening-glow-right" />

      <div className="landing-opening-stage">
        <div className="landing-opening-card">
          <div className="landing-opening-wordmark" aria-label="TravelTraces">
            TravelTraces
          </div>

          <div className="landing-opening-progress-wrap">
            <div className="landing-opening-progress-label">
              <span>Loading</span>
              <strong>{progress}%</strong>
            </div>
            <div className="landing-opening-track" aria-hidden="true">
              <span style={{ transform: `scaleX(${Math.max(0.01, progress / 100)})` }} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .landing-opening-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 24%, rgba(196, 113, 58, 0.18), transparent 20%),
            radial-gradient(circle at 50% 100%, rgba(158, 107, 92, 0.2), transparent 30%),
            linear-gradient(180deg, #241a16 0%, #2f221d 48%, #1d1512 100%);
          color: #FBF7F0;
          isolation: isolate;
        }

        .landing-opening-stage {
          position: relative;
          z-index: 3;
          width: 100%;
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: clamp(1.25rem, 5vw, 3rem);
        }

        .landing-opening-card {
          width: min(100%, 42rem);
          display: grid;
          justify-items: center;
          gap: 1.15rem;
          text-align: center;
          animation: traveltraces-opening-rise 1150ms cubic-bezier(.16,1,.3,1) both;
        }

        .landing-opening-wordmark {
          display: block;
          font-family: var(--font-display);
          font-size: clamp(1.95rem, 7.4vw, 4.6rem);
          font-weight: 600;
          line-height: 1;
          letter-spacing: 0.18em;
          max-width: 100%;
          white-space: nowrap;
          text-transform: uppercase;
          filter: drop-shadow(0 18px 34px rgba(0, 0, 0, 0.28));
          opacity: 0;
          transform: scale(0.985);
          animation: traveltraces-wordmark-fade 1100ms ease 260ms both;
        }

        .landing-opening-progress-wrap {
          width: min(19rem, 78vw);
          display: grid;
          gap: 0.5rem;
          justify-items: center;
        }

        .landing-opening-progress-label {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.6rem;
          width: 100%;
          font-family: var(--font-label);
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(251, 247, 240, 0.68);
        }

        .landing-opening-progress-label strong {
          color: #FBF7F0;
          font-size: 0.95rem;
          letter-spacing: 0.12em;
        }

        .landing-opening-track {
          position: relative;
          width: 100%;
          height: 3px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(251, 247, 240, 0.12);
          box-shadow: inset 0 0 0 1px rgba(251, 247, 240, 0.04);
        }

        .landing-opening-track span {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #D88A48 0%, #E7B48A 50%, #F5D4B6 100%);
          transform-origin: left;
          box-shadow: 0 0 18px rgba(196, 113, 58, 0.45);
        }

        .landing-opening-curtain,
        .landing-opening-panel,
        .landing-opening-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .landing-opening-curtain {
          background: linear-gradient(180deg, rgba(17, 12, 10, 0.95), rgba(35, 25, 20, 0.88));
          z-index: 0;
        }

        .landing-opening-curtain-top {
          bottom: 50%;
          transform-origin: top;
          animation: traveltraces-curtain-open-top 1080ms cubic-bezier(.16,1,.3,1) 60ms both;
        }

        .landing-opening-curtain-bottom {
          top: 50%;
          transform-origin: bottom;
          animation: traveltraces-curtain-open-bottom 1080ms cubic-bezier(.16,1,.3,1) 60ms both;
        }

        .landing-opening-panel {
          z-index: 2;
          background:
            linear-gradient(180deg, rgba(35, 25, 20, 0.92), rgba(17, 12, 10, 0.84)),
            radial-gradient(circle at 50% 20%, rgba(196, 113, 58, 0.12), transparent 34%);
          opacity: 0;
          transform: scaleX(0);
          transform-origin: center;
        }

        .landing-opening-screen--exit .landing-opening-panel {
          opacity: 1;
        }

        .landing-opening-panel-left {
          clip-path: inset(0 50% 0 0);
          animation: traveltraces-panel-left-exit 780ms cubic-bezier(.16,1,.3,1) 14ms both;
        }

        .landing-opening-panel-right {
          clip-path: inset(0 0 0 50%);
          animation: traveltraces-panel-right-exit 780ms cubic-bezier(.16,1,.3,1) 14ms both;
        }

        .landing-opening-glow {
          z-index: 1;
          opacity: 0.85;
        }

        .landing-opening-glow-left,
        .landing-opening-glow-right {
          width: 32vw;
          height: 32vw;
          top: 50%;
          background: radial-gradient(circle, rgba(196, 113, 58, 0.24) 0%, rgba(196, 113, 58, 0) 70%);
          filter: blur(30px);
          transform: translateY(-50%);
        }

        .landing-opening-glow-left { left: -8vw; }
        .landing-opening-glow-right { right: -8vw; }

        .landing-opening-screen--exit .landing-opening-card {
          animation: traveltraces-opening-exit 700ms cubic-bezier(.16,1,.3,1) both;
        }

        @keyframes traveltraces-opening-rise {
          from { opacity: 0; transform: translateY(26px) scale(0.985); filter: blur(7px); }
          60% { opacity: 1; filter: blur(0); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        @keyframes traveltraces-wordmark-fade {
          0% { opacity: 0; transform: scale(0.985); filter: blur(8px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }

        @keyframes traveltraces-curtain-open-top {
          0% { transform: translateY(0); }
          100% { transform: translateY(-101%); }
        }

        @keyframes traveltraces-curtain-open-bottom {
          0% { transform: translateY(0); }
          100% { transform: translateY(101%); }
        }

        @keyframes traveltraces-panel-left-exit {
          0% { opacity: 0; transform: translateX(0); }
          8% { opacity: 1; }
          100% { opacity: 1; transform: translateX(-102%); }
        }

        @keyframes traveltraces-panel-right-exit {
          0% { opacity: 0; transform: translateX(0); }
          8% { opacity: 1; }
          100% { opacity: 1; transform: translateX(102%); }
        }

        @keyframes traveltraces-opening-exit {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.985); filter: blur(12px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .landing-opening-screen,
          .landing-opening-card,
          .landing-opening-curtain,
          .landing-opening-panel,
          .landing-opening-wordmark {
            animation: none !important;
          }

          .landing-opening-track span {
            transform: scaleX(1) !important;
          }
        }
      `}</style>
    </div>
  );
}

function CategorySelectionModal() {
  const navigate = useNavigate();
  const { needsInterestSelection, completeInterestSelection } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!needsInterestSelection) return undefined;
    setSelected([]);
    setError("");
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [needsInterestSelection]);

  if (!needsInterestSelection) return null;

  const toggleCategory = (category: string) => {
    setError("");
    setSelected((current) => (current.includes(category) ? current.filter((item) => item !== category) : [...current, category]));
  };

  const save = () => {
    if (selected.length < 3) {
      setError("Choose at least 3 travel interests so TravelTraces can personalize your feed.");
      return;
    }
    completeInterestSelection(selected);
    navigate("/explore");
  };

  return (
    <div className="fixed inset-0 z-[1200] grid place-items-center bg-[#1A1411]/70 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="interest-title">
      <section className="w-[min(100%,44rem)] rounded-2xl border border-[#EFE7DC]/60 bg-[#FBF7F0] p-[clamp(1.5rem,4vw,2.5rem)] text-center text-[#2C211C] shadow-[0_28px_80px_rgba(26,20,17,0.32)]">
        <p className="m-0 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.18em] text-[#9E6B5C]">Personalize your TravelTraces</p>
        <h2 id="interest-title" className="mx-auto mt-3 max-w-[12ch] font-[var(--font-display)] text-[clamp(2.25rem,7vw,4rem)] font-semibold leading-none">
          What kind of trips pull you in?
        </h2>
        <p className="mx-auto mt-4 max-w-[42ch] font-[var(--font-body)] text-base leading-7 text-[#5B4A40]">
          Pick a few interests. These become the first signal for your Explore, Stories, and route recommendations.
        </p>

        <div className="mx-auto mt-7 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          {onboardingCategories.map((category) => {
            const active = selected.includes(category);
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => toggleCategory(category)}
                className={`min-h-12 rounded-full border px-4 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.08em] transition ${
                  active
                    ? "border-[#3A2A22] bg-[#3A2A22] text-[#FBF7F0] shadow-[0_12px_28px_rgba(58,42,34,0.18)]"
                    : "border-[#3A2A22]/14 bg-[#EFE7DC] text-[#3A2A22] hover:border-[#C4713A]/45 hover:bg-[#F5E6D8]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {error ? <p className="mt-5 font-[var(--font-ui)] text-sm font-bold text-[#9B2F25]">{error}</p> : null}

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={save}
            className="min-h-12 rounded-full bg-[#C4713A] px-7 font-[var(--font-label)] text-xs font-bold uppercase tracking-[0.1em] text-[#FBF7F0] shadow-[0_16px_32px_rgba(196,113,58,0.24)]"
          >
            Continue to Explore
          </button>
          <span className="font-[var(--font-ui)] text-sm text-[#6B5A50]">{selected.length} selected</span>
        </div>
      </section>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const { isAuthenticated, authReady } = useAuth();
  const isImmersiveMap = location.pathname === "/maps";
  const showScrollTop = ["/explore", "/stories", "/travel-plan-stories", "/community", "/events"].includes(location.pathname);
  const wordmark = "TravelTraces";
  const minimumLoadingDurationMs = 5000 + wordmark.length * 125;
  const [isAtTop, setIsAtTop] = useState(true);
  const initialLandingOpeningEnabled = (() => {
    if (typeof window === "undefined") return false;

    if (window.location.pathname !== "/") {
      return false;
    }

    if (isPageReload()) {
      window.sessionStorage.removeItem("traveltraces.landing-opening-seen");
      return true;
    }

    return window.sessionStorage.getItem("traveltraces.landing-opening-seen") !== "true";
  })();
  const [canShowLandingOpening, setCanShowLandingOpening] = useState(() => {
    if (typeof window === "undefined") return false;

    if (window.location.pathname !== "/") {
      return false;
    }

    return initialLandingOpeningEnabled;
  });
  const [showLandingOpening, setShowLandingOpening] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.pathname === "/" && initialLandingOpeningEnabled;
  });
  const [loadingProgress, setLoadingProgress] = useState(1);
  const [loadingPhase, setLoadingPhase] = useState<"loading" | "exit">("loading");
  const progressTargetRef = useRef(0);
  const progressValueRef = useRef(0);
  const readyToFinishRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

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

    const update = () => setIsAtTop(window.scrollY < 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [showScrollTop, location.pathname]);

  useEffect(() => {
    if (!showLandingOpening || typeof document === "undefined") return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [showLandingOpening]);

  useEffect(() => {
    if (location.pathname !== "/") {
      setShowLandingOpening(false);
      setCanShowLandingOpening(false);
      setLoadingProgress(1);
      setLoadingPhase("loading");
      readyToFinishRef.current = false;
      progressTargetRef.current = 1;
      progressValueRef.current = 1;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      return undefined;
    }

    if (!canShowLandingOpening) {
      setShowLandingOpening(false);
      return undefined;
    }

    setShowLandingOpening(true);
    window.sessionStorage.setItem("traveltraces.landing-opening-seen", "true");
    setLoadingProgress(1);
    setLoadingPhase("loading");
    readyToFinishRef.current = false;
    progressTargetRef.current = 1;
    progressValueRef.current = 1;

    let cancelled = false;
    const startedAt = window.performance.now();
    const assetWeights = [0.24, 0.12, ...LANDING_IMAGE_LIST.map(() => 0.64 / LANDING_IMAGE_LIST.length)];
    const completed = assetWeights.map(() => false);
    let allReady = false;

    const updateTarget = () => {
      const completedWeight = completed.reduce((sum, isDone, index) => sum + (isDone ? assetWeights[index] : 0), 0);
      progressTargetRef.current = Math.min(99, Math.round(completedWeight * 99));
    };

    const markComplete = (index: number) => {
      if (cancelled || completed[index]) return;
      completed[index] = true;
      allReady = completed.every(Boolean);
      updateTarget();
    };

    const trackedAssets = [
      import("./pages/LandingPage").catch(() => undefined),
      waitForFonts(),
      ...LANDING_IMAGE_LIST.map((src) => preloadImage(src)),
    ];

    trackedAssets.forEach((promise, index) => {
      void promise.finally(() => markComplete(index));
    });

    const animateProgress = () => {
      if (cancelled) return;

      const current = progressValueRef.current;
      const elapsed = window.performance.now() - startedAt;
      const canFinish = allReady && elapsed >= minimumLoadingDurationMs;
      const timedProgress = Math.min(0.995, elapsed / minimumLoadingDurationMs);
      const target = canFinish ? 100 : Math.min(99, 1 + Math.pow(timedProgress, 0.82) * 98);
      const easing = canFinish ? 0.055 : 0.045;
      const next = Math.abs(target - current) < 0.08 ? target : current + (target - current) * easing;

      progressValueRef.current = next;
      const rounded = Math.max(1, Math.min(100, Math.round(next)));
      setLoadingProgress(canFinish && next >= 99.65 ? 100 : Math.min(99, rounded));

      if (!canFinish || next < 99.65) {
        animationFrameRef.current = window.requestAnimationFrame(animateProgress);
        return;
      }

      if (!readyToFinishRef.current) {
        readyToFinishRef.current = true;
        progressTargetRef.current = 100;
        progressValueRef.current = 100;
        setLoadingProgress(100);
        if (exitTimerRef.current !== null) {
          window.clearTimeout(exitTimerRef.current);
        }
        exitTimerRef.current = window.setTimeout(() => {
          if (!cancelled) {
            setLoadingPhase("exit");
            if (exitTimerRef.current !== null) {
              window.clearTimeout(exitTimerRef.current);
            }
            exitTimerRef.current = window.setTimeout(() => {
              if (!cancelled) {
                setShowLandingOpening(false);
              }
            }, 760);
          }
        }, 240);
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(animateProgress);
    };

    animationFrameRef.current = window.requestAnimationFrame(animateProgress);

    return () => {
      cancelled = true;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [canShowLandingOpening, location.pathname]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {showLandingOpening ? <LandingOpeningScreen progress={loadingProgress} phase={loadingPhase} /> : null}
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
            <Route path="/travel-plan-stories" element={<TravelPlanStoriesPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/map/layers" element={<MappingLayerPage />} />
            <Route path="/geo-photos" element={<GeoreferencedPhotosPage />} />
            <Route path="/travel-groups" element={<TravelGroupsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<PublicProfilePage />} />
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
      <CategorySelectionModal />
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
