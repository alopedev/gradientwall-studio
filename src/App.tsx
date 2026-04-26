import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LazyMotion, MotionConfig } from "motion/react";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Marquee } from "./components/Marquee";
import { Studio } from "./components/studio/Studio";
import { PacksSection } from "./components/packs/PacksSection";
import { PackPage } from "./components/packs/PackPage";
import { Closer } from "./components/Closer";
import { Footer } from "./components/Footer";

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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/packs/:slug" element={<PackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </MotionConfig>
    </LazyMotion>
  );
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
    // Defer one frame so layout has settled and the section is in the DOM.
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "instant", block: "start" }));
  }, [hash]);

  return (
    <>
      <Nav />
      <Hero />
      <Marquee />
      <Studio />
      <PacksSection />
      <Closer />
      <Footer />
    </>
  );
}
