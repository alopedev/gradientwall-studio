import { type MouseEvent, useState } from "react";
import { track } from "@/lib/analytics";
import { isPlainClick } from "@/lib/page-transition";
import { pickLook, toRenderParams, withSharedLook } from "@/lib/look";
import type { Landing } from "@/lib/seo/landings";
import { GALLERIES, type GalleryImage, galleryFor, galleryShape } from "@/lib/seo/gallery";
import { useConfigStore } from "@/store";
import { loadLook } from "@/store/coordinator";
import { useWallpaperEngine } from "../studio/engine";
import { InkButton } from "../ui/InkButton";
import { PAGE_COLUMN } from "../ui/layout";
import { useGoToSection } from "../ui/SectionLink";

const GRID = {
  phone: "grid-cols-2 md:grid-cols-4 xl:grid-cols-6",
  desktop: "grid-cols-2 md:grid-cols-3",
} as const;

const SIZES = {
  phone: "(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw",
  desktop: "(min-width: 768px) 33vw, 50vw",
} as const;

/**
 * The landing's gallery (`lib/seo/gallery.ts`): real image files of wallpapers
 * the Studio made, each with a full-size Download and a link that opens it in
 * the Studio. Plain grid, name and both actions always visible (option A,
 * chosen 2026-10-24).
 */
export function LandingGallery({ landing }: { landing: Landing }) {
  const gallery = GALLERIES[landing.slug];
  const images = galleryFor(landing);
  if (!gallery || !images.length) return null;
  const shape = galleryShape(landing);
  const id = `gallery-${landing.slug}`;
  return (
    <section
      aria-labelledby={id}
      className={`${PAGE_COLUMN} border-t border-ink py-[clamp(48px,6vw,88px)]`}
    >
      <h2 id={id} className="display-head text-[clamp(28px,3vw,44px)] text-ink">
        {gallery.heading}
      </h2>
      <p className="mt-4 max-w-[52ch] font-sans text-[16px] leading-relaxed text-ink-dim">
        Download one as it is, or open it in the Studio to change the colours.
      </p>
      <ul className={`m-0 mt-8 grid list-none gap-x-4 gap-y-6 p-0 ${GRID[shape]}`}>
        {images.map((image) => (
          <li key={image.src}>
            <GalleryItem image={image} shape={shape} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function GalleryItem({ image, shape }: { image: GalleryImage; shape: "phone" | "desktop" }) {
  const engine = useWallpaperEngine();
  const goToSection = useGoToSection();
  const [phase, setPhase] = useState<"idle" | "busy" | "done">("idle");
  const device = shape === "desktop" ? "desktop" : "mobile";
  const look = () => withSharedLook(pickLook(useConfigStore.getState()), image.piece);

  const download = async () => {
    if (phase === "busy") return;
    setPhase("busy");
    try {
      await engine.exportWallpaper(toRenderParams(look()), device);
      track("download", { device, source: "gallery" });
      setPhase("done");
      setTimeout(() => setPhase("idle"), 1800);
    } catch {
      setPhase("idle");
    }
  };

  const edit = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(e)) return;
    loadLook(look());
    useConfigStore.getState().setDevice(device);
    goToSection(e, "studio");
  };

  return (
    <figure className="m-0 flex flex-col gap-2.5" data-vt-scope>
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes={SIZES[shape]}
        width={image.width}
        height={image.height}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        data-vt-src
        className="block h-auto w-full rounded-sharp bg-paper-2"
      />
      <figcaption className="flex flex-col gap-2 font-sans">
        <span className="text-[15px] font-medium text-ink">{image.piece.name}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <InkButton
            variant="primary"
            onClick={download}
            aria-busy={phase === "busy"}
            aria-label={`Download ${image.alt}`}
            className="min-h-9 px-3 text-[13px]"
          >
            {phase === "busy" ? "Saving…" : phase === "done" ? "Saved" : "Download"}
          </InkButton>
          <a
            href={image.studioHref}
            onClick={edit}
            className="inline-flex min-h-9 items-center text-[13px] font-semibold text-ink underline underline-offset-4 focus-ring"
          >
            Edit in Studio
          </a>
        </span>
      </figcaption>
    </figure>
  );
}
