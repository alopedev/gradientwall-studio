import { GALLERY_SEEDS } from "@/lib/palettes";
import { Reveal } from "./ui/Reveal";
import { GalleryFeatured } from "./GalleryFeatured";
import { GalleryGridCard } from "./GalleryGridCard";

const FEATURED_COUNT = 3;

export function Gallery() {
  const featured = GALLERY_SEEDS.slice(0, FEATURED_COUNT);
  const residual = GALLERY_SEEDS.slice(FEATURED_COUNT);

  return (
    <section
      id="gallery"
      className="relative mx-auto max-w-[1600px] px-[clamp(24px,5vw,80px)] py-[clamp(60px,9vw,120px)] border-t border-white/8"
    >
      <Reveal className="grid md:grid-cols-2 gap-12 items-end mb-14">
        <div>
          <span className="block mb-4 font-sans text-[11px] tracking-[0.22em] uppercase text-white/40">
            03 — Community
          </span>
          <h2 className="display-head text-[clamp(40px,5.5vw,76px)]">
            <span className="block text-white">Made by others.</span>
            <span className="block text-white/75">Remixed by you.</span>
          </h2>
        </div>
        <p className="max-w-[42ch] text-[15px] text-white/75 font-sans font-light">
          A quiet feed of gradients from the GradientWall community. Tap any piece to open it in the studio as a
          starting point.
        </p>
      </Reveal>

      <div className="flex flex-col gap-[clamp(48px,6vw,80px)]">
        {featured.map((seed, i) => (
          <GalleryFeatured key={seed.name} seed={seed} index={i} />
        ))}
      </div>

      <Reveal className="mt-[clamp(48px,6vw,80px)] mb-6">
        <span className="block font-sans text-[11px] tracking-[0.22em] uppercase text-white/40">
          More from the community
        </span>
      </Reveal>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {residual.map((seed, i) => (
          <GalleryGridCard key={seed.name} seed={seed} index={i} />
        ))}
      </div>
    </section>
  );
}
