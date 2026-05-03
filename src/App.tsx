import { useEffect, useLayoutEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LazyMotion, MotionConfig, AnimatePresence } from "motion/react";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Marquee } from "./components/Marquee";
import { Studio } from "./components/studio/Studio";
import { PacksSection } from "./components/packs/PacksSection";
import { PackPage } from "./components/packs/PackPage";
import { PackPurchaseSuccess } from "./components/packs/PackPurchaseSuccess";
import { RecoverForm } from "./components/RecoverForm";
import { Footer } from "./components/Footer";
import { PageMeta } from "./components/PageMeta";
import { LenisProvider, useLenis } from "./components/ui/LenisProvider";
import { ScrollProgress } from "./components/ui/ScrollProgress";

// JSON-LD: tells Google we're a brand (Organization) AND a searchable site
// (WebSite). The Organization block populates the right-hand "knowledge
// panel" with logo + name when someone searches "GradientWall". The WebSite
// block lets Google show sitelinks under the main result on direct searches.
const HOME_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GradientWall",
    url: "https://gradientwall.com",
    logo: "https://gradientwall.com/favicon.svg",
    description:
      "GradientWall makes cinematic gradient wallpapers — a free interactive studio plus curated 10-packs.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GradientWall",
    url: "https://gradientwall.com",
  },
];

// Async-load domMax features so the motion feature bundle (layout, drag,
// animation) code-splits out of the critical path. The `m` components render
// in their initial state until features resolve — fine for our scroll reveals
// (whileInView fires below the fold) and acceptable for the hero entrance
// (features resolve within ~10-30ms after main bundle). domMax is required
// because PillTabs uses layoutId for its sliding thumb.
const loadFeatures = () => import("motion/react").then((mod) => mod.domMax);

export default function App() {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <LenisProvider>
            <ScrollProgress />
            <RoutesShell />
          </LenisProvider>
        </BrowserRouter>
      </MotionConfig>
    </LazyMotion>
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
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/packs/:slug" element={<PackPage />} />
          <Route path="/packs/:slug/success" element={<PackPurchaseSuccess />} />
          <Route path="/recover" element={<RecoverForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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

function HomePage() {
  // Scroll to the hash target on mount or when navigation lands here with a
  // fragment (e.g. /#packs from the pack page back-link). Without this, hash
  // anchors only work for in-page clicks, not cross-route navigations.
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "instant", block: "start" }));
  }, [hash]);

  return (
    <>
      <PageMeta
        title="GradientWall — Cinematic gradient wallpapers"
        description="Make your own cinematic gradient wallpapers in the studio, or get a curated 10-pack for €4.99. No watermarks, no account."
        path="/"
        ogImageAlt="GradientWall — purple-to-amber gradient wallpaper"
        jsonLd={HOME_JSON_LD}
      />
      <Nav />
      <Hero />
      <Marquee />
      <Studio />
      <PacksSection />
      <Footer />
    </>
  );
}
