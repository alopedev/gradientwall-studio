import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Arrow } from "@/components/ui/Arrow";
import { InkButton, inkButton } from "@/components/ui/InkButton";
import { describeDesigns, getPacks, type Pack } from "@/lib/packs";
import { packPath } from "@/lib/seo/pages";
import type { Device } from "@/lib/palettes";
import { PackCover } from "../../packs/PackCover";

/** How to turn the downloaded file into a wallpaper, for the screens each device size is made for. */
const STEPS: Record<Device, [string, string][]> = {
  mobile: [
    [
      "On iPhone",
      "Tap Save Image (or find it in Files › Downloads). Then Photos › Share › Use as Wallpaper.",
    ],
    ["On Android", "Open it in Photos or Gallery › Use as › Wallpaper."],
  ],
  tablet: [
    [
      "On iPad",
      "Tap Save Image (or find it in Files › Downloads). Then Photos › Share › Use as Wallpaper.",
    ],
    ["On Android", "Open it in Photos or Gallery › Use as › Wallpaper."],
  ],
  desktop: [
    ["On a Mac", "Right-click the file in Finder › Set Desktop Picture."],
    ["On Windows", "Right-click the file › Set as desktop background."],
  ],
};

interface Props {
  device: Device;
  filename: string;
  bytes: number;
  onClose: () => void;
}

/**
 * Shown after the first download of a visit: the file, how to set it as a
 * wallpaper (on iPhone the share sheet's Save Image puts it in Photos; a
 * fallback download lands in Files), and the packs for whoever wants more:
 * one row each, with a button straight to its Etsy listing (4D, chosen
 * 2026-11-09). A modal `<dialog>`, so focus, Escape and the backdrop come
 * from the browser.
 */
export function DownloadHelp({ device, filename, bytes, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const packs = getPacks();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // jsdom has no showModal; the open attribute is enough there.
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    return () => dialog.close?.();
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="gw-dialog m-auto w-[min(620px,calc(100vw-32px))] rounded-sharp border-2 border-ink bg-bg p-0 text-ink shadow-[0_30px_60px_rgb(0_0_0/0.3)] backdrop:bg-ink/40"
    >
      <div className="grid gap-5 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <h2 id={titleId} className="display-head m-0 text-[clamp(24px,4vw,30px)] text-ink">
              your wallpaper is downloading.
            </h2>
            <p className="m-0 break-words font-sans text-[14px] text-ink-dim">
              {filename}{" "}
              <span className="whitespace-nowrap">· {(bytes / 1048576).toFixed(1)} MB</span>
            </p>
          </div>
          <InkButton variant="icon" onClick={onClose} aria-label="Close" className="shrink-0">
            <X className="size-5" aria-hidden />
          </InkButton>
        </div>

        <dl className="m-0 grid gap-4 font-sans text-[15px] leading-snug sm:grid-cols-2">
          {STEPS[device].map(([where, how]) => (
            <div key={where} className="grid content-start gap-1">
              <dt className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
                {where}
              </dt>
              <dd className="m-0">{how}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-3 border-t-2 border-ink pt-5 font-sans">
          <p className="m-0 text-[15px] font-semibold">Want something you can't make here?</p>
          <ul className="m-0 grid list-none gap-2.5 p-0">
            {packs.map((pack) => (
              <li key={pack.slug} className="flex items-center gap-3">
                <PackCover
                  cover={pack.previews[0]}
                  w={240}
                  h={520}
                  box={[30, 62]}
                  decorative
                  className="h-[62px] w-[30px] shrink-0 rounded-[7px] border-2 border-ink object-cover"
                />
                <p className="m-0 grid min-w-0 flex-1 gap-0.5">
                  <span className="display-head text-[22px] text-ink">{pack.name}</span>
                  <span className="text-[13px] text-ink-dim">{describeDesigns(pack)}</span>
                </p>
                <PackButton pack={pack} />
              </li>
            ))}
          </ul>
          {packs.some((p) => p.etsyUrl) && (
            <p className="m-0 text-[13px] text-ink-dim">
              Opens Etsy. Instant download after checkout.
            </p>
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

/** The row's button: the price, straight to the Etsy listing (or to the pack page while it has none). */
function PackButton({ pack }: { pack: Pack }) {
  const price = `€${pack.priceEur.toFixed(2)}`;
  const className = `${inkButton({ variant: "primary" })} shrink-0`;
  if (!pack.etsyUrl) {
    return (
      <a href={packPath(pack.slug)} className={className}>
        {price}
        <span className="sr-only">: see {pack.name}</span>
        <Arrow />
      </a>
    );
  }
  return (
    <a
      href={pack.etsyUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-etsy-source="download-help"
      className={className}
    >
      {price}
      <span className="sr-only">: {pack.name} on Etsy</span>
      <Arrow to="out" />
    </a>
  );
}
