import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Marquee } from "./components/Marquee";
import { Studio } from "./components/studio/Studio";
import { Gallery } from "./components/Gallery";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <>
      <Nav />
      <Hero />
      <Marquee />
      <Studio />
      <Gallery />
      <Footer />
    </>
  );
}
