import { lazy, type ReactNode, Suspense, useEffect, useLayoutEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, domMax, LazyMotion, MotionConfig } from "motion/react";
import { Hero } from "./components/hero/Hero";
import { Nav } from "./components/Nav";
import {
  LazyStudioShell as StudioShell,
  loadStudioShell,
} from "./components/studio/v2/LazyStudioShell";
import { PacksSection } from "./components/packs/PacksSection";
import { Footer } from "./components/Footer";
import { PageMeta } from "./components/PageMeta";
import { buildHomePage } from "./lib/seo/pages";
import { LANDINGS } from "./lib/seo/landings";
import { loadSavedPrefs } from "./store/page-start";
import { startAnalytics } from "./lib/analytics";
import { LenisProvider, useLenis } from "./components/ui/LenisProvider";
import { ScrollProgress } from "./components/ui/ScrollProgress";

// Every page but the home is its own chunk, so the home (where most visits
// land) doesn't download them. The pack page chunk is fetched once the home is
// idle, so opening a pack (and its view-transition morph) doesn't wait on it.
const loadPackPage = () => import("./components/packs/PackPage");
const PackPage = lazy(() => loadPackPage().then((m) => ({ default: m.PackPage })));
const PackPurchaseSuccess = lazy(() =>
  import("./components/packs/PackPurchaseSuccess").then((m) => ({
    default: m.PackPurchaseSuccess,
  })),
);
const RecoverForm = lazy(() =>
  import("./components/RecoverForm").then((m) => ({ default: m.RecoverForm })),
);
const LandingPage = lazy(() =>
  import("./components/landing/LandingPage").then((m) => ({ default: m.LandingPage })),
);
const PrivacyPage = lazy(() =>
  import("./components/PrivacyPage").then((m) => ({ default: m.PrivacyPage })),
);

// Motion features ship in the main bundle, not as a lazy chunk: when a lazy
// chunk resolves it updates LazyMotion's context, and an update that reaches a
// part of the prerendered page still hydrating (the Studio, a lazy route)
// makes React throw that part away and redraw it (error #421). domMax is
// required because PillTabs uses layoutId for its sliding thumb.
const loadFeatures = domMax;

export default function App() {
  return (
    <AppFrame>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppFrame>
  );
}

/** Everything around the router: motion features and preferences. */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

/** Everything inside the router. The prerender renders it under a StaticRouter. */
export function AppContent() {
  // Saved favorites and the motion pause load once the prerendered page has
  // hydrated, so the first render matches the HTML.
  useEffect(() => loadSavedPrefs(), []);
  // Visit counting starts after hydration too (see lib/analytics).
  useEffect(() => startAnalytics(), []);
  return (
    <LenisProvider>
      <ScrollProgress />
      <RoutesShell />
    </LenisProvider>
  );
}

// Inside BrowserRouter so useLocation works. AnimatePresence keys on the
// pathname so route changes trigger exit/enter animations; mode="wait" ensures
// the outgoing route fully exits before the incoming one mounts (avoids
// stacking two pages mid-transition).
function RoutesShell() {
  const location = useLocation();
  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait" initial={false}>
        <Suspense fallback={null} key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/packs/:slug" element={<PackPage />} />
            <Route path="/packs/:slug/success" element={<PackPurchaseSuccess />} />
            {LANDINGS.map((landing) => (
              <Route
                key={landing.slug}
                path={`/${landing.slug}`}
                element={<LandingPage landing={landing} />}
              />
            ))}
            <Route path="/recover" element={<RecoverForm />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </>
  );
}

// Snap scroll to the top on every route change. Skipped when a hash is
// present so HomePage's scroll-to-anchor effect (e.g. /#packs from PackPage's
// back-link) wins. useLayoutEffect to reset before the new route paints —
// avoids a flash of the new page mid-scroll. When Lenis is active we must
// reset its internal scroll too — a plain window.scrollTo gets overwritten
// by Lenis's next rAF tick, leaving the new route landing mid-page.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const lenis = useLenis();
  // `pathname` is intentionally a dep even though it's not read inside the
  // callback: the whole point is to re-run on every route change. Without it
  // the effect only fires when `hash` changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger
  useLayoutEffect(() => {
    if (hash) return;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true, force: true });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname, hash, lenis]);
  return null;
}

// Stable reference: PageMeta re-runs its effect when `jsonLd` identity changes.
const HOME_PAGE = buildHomePage();

function HomePage() {
  // Scroll to the hash target on mount or when navigation lands here with a
  // fragment (e.g. /#packs from the pack page back-link). Without this, hash
  // anchors only work for in-page clicks, not cross-route navigations.
  const { hash } = useLocation();
  // The Studio is its own chunk, so `#studio` may mount a few frames late:
  // keep looking for up to ~2 s.
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    let raf = 0;
    let tries = 120;
    const find = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
      else if (tries-- > 0) raf = requestAnimationFrame(find);
    };
    raf = requestAnimationFrame(find);
    return () => cancelAnimationFrame(raf);
  }, [hash]);

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
    idle(() => {
      void loadPackPage();
      void loadStudioShell();
    });
  }, []);

  return (
    <>
      <PageMeta {...HOME_PAGE} />
      <Nav />
      <Hero />
      <PacksSection />
      <StudioShell />
      <Footer />
    </>
  );
}
