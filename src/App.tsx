import { MotionConfig } from "motion/react";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Marquee } from "./components/Marquee";
import { Studio } from "./components/studio/Studio";
import { Gallery } from "./components/Gallery";
import { Footer } from "./components/Footer";

export default function App() {
  // `reducedMotion="user"` honors the OS-level prefers-reduced-motion setting.
  // When enabled, Motion animates instantly (no easing, no spring), preserving
  // all behavior — just skipping the motion. Accessibility-first.
  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <Hero />
      <Marquee />
      <Studio />
      <Gallery />
      <Footer />
    </MotionConfig>
  );
}
