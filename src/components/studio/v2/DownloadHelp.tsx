import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { InkButton } from "@/components/ui/InkButton";
import { getPacks } from "@/lib/packs";
import type { Device } from "@/lib/palettes";
import { PackCover } from "../../packs/PackCover";

/** How to turn the downloaded file into a wallpaper, for the screens each device size is made for. */
const STEPS: Record<Device, [string, string][]> = {
  mobile: [
    [
      "On iPhone",
      "Files › Downloads › open it › Share › Save Image. Then Photos › Share › Use as Wallpaper.",
    ],
    ["On Android", "Open it in Photos or Gallery › Use as › Wallpaper."],
  ],
  tablet: [
    [
      "On iPad",
      "Files › Downloads › open it › Share › Save Image. Then Photos › Share › Use as Wallpaper.",
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
 * wallpaper (on iPhone a download lands in Files, not Photos), and the packs
 * for whoever wants more. A modal `<dialog>`, so focus, Escape and the
 * backdrop come from the browser.
 */
export function DownloadHelp({ device, filename, bytes, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const packs = getPacks();
  const prices = new Set(packs.map((p) => p.priceEur));
  const price = `€${Math.min(...prices).toFixed(2)}`;
  const offer = `${prices.size > 1 ? `From ${price}` : `${price} each`}${packs.some((p) => p.etsyUrl) ? " on Etsy" : ""}.`;

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
      className="m-auto w-[min(620px,calc(100vw-32px))] rounded-sharp border-2 border-ink bg-bg p-0 text-ink shadow-[0_30px_60px_rgb(0_0_0/0.3)] backdrop:bg-ink/40"
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

        <div className="flex flex-wrap items-center gap-4 border-t-2 border-ink pt-5">
          <div className="flex min-w-[260px] flex-1 items-center gap-4">
            <div aria-hidden className="flex shrink-0 gap-1">
              {packs.map((pack) => (
                <PackCover
                  key={pack.slug}
                  cover={pack.previews[0]}
                  w={240}
                  h={520}
                  decorative
                  className="h-24 w-[46px] rounded-[9px] border-[3px] border-ink object-cover"
                />
              ))}
            </div>
            <p className="m-0 grid gap-1 font-sans">
              <span className="text-[15px] font-semibold">Want something you can't make here?</span>
              <span className="text-[14px] text-ink-dim">Hand-picked packs. {offer}</span>
            </p>
          </div>
          {/* biome-ignore lint/a11y/useValidAnchor: a real link to the packs; the click also closes the dialog over them */}
          <a
            href="#packs"
            onClick={onClose}
            className="inline-flex min-h-11 items-center rounded-sharp bg-ink px-4 font-sans text-[15px] font-semibold text-bg hover:bg-ink/85 focus-ring"
          >
            See the packs →
          </a>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
