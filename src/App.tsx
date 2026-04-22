import { LazyMotion, MotionConfig } from "motion/react";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Marquee } from "./components/Marquee";
import { Studio } from "./components/studio/Studio";
import { Gallery } from "./components/Gallery";
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
        <Nav />
        <Hero />
        <Marquee />
        <Studio />
        <Gallery />
        <Closer />
        <Footer />
      </MotionConfig>
    </LazyMotion>
  );
}
