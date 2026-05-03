import { useHistoryStore, loadHistoryItem, removeHistoryItem, type HistoryItem } from "@/store";
import { useFittedGradientCanvas } from "@/lib/useGradientCanvas";
import { activeColors } from "@/lib/palettes";
import { CornerPipButton } from "../ui/CornerPipButton";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/shadcn/sheet";

/**
 * Drawer that holds the user's saved gradients. Opens from the right via a
 * "Saved (n)" trigger living in the BottomBar — keeps History accessible at
 * all times without consuming vertical space in the studio fold. Clicking a
 * saved card calls `loadHistoryItem` (cross-store coordinator) and closes
 * the drawer; the per-card delete pip uses `removeHistoryItem`.
 */
export function HistoryDrawer() {
  const count = useHistoryStore((s) => s.history.length);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Open saved gradients (${count})`}
          className="tactile inline-flex items-center gap-2 rounded-[2px] px-3 py-1.5 font-sans text-[11px] tracking-[0.14em] uppercase text-white/85 hover:text-white"
        >
          Saved
          <span
            className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full bg-white/10 text-white/80 text-[10px] tracking-[0.04em] tabular-nums"
            aria-hidden
          >
            {count}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <div className="flex justify-between items-baseline">
          <SheetTitle>Your history</SheetTitle>
          <span className="font-sans text-[11px] tracking-[0.18em] uppercase text-white/40">{count} saved</span>
        </div>
        <SheetDescription>
          Click a tile to reload its config. Use the corner pip to remove a saved gradient.
        </SheetDescription>
        <HistoryGrid />
      </SheetContent>
    </Sheet>
  );
}

function HistoryGrid() {
  const history = useHistoryStore((s) => s.history);
  if (history.length === 0) {
    return (
      <div className="rounded-[2px] border border-dashed border-white/14 p-10 text-center font-sans text-[11px] tracking-[0.18em] uppercase text-white/40">
        Nothing here yet — save your first gradient ↑
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {history.map((h, i) => (
        <HistoryCard key={i} item={h} index={i} />
      ))}
    </div>
  );
}

function HistoryCard({ item, index }: { item: HistoryItem; index: number }) {
  // `item.active` may be undefined for items saved before the per-slot mask
  // landed — `activeColors` treats that as all four active.
  const ref = useFittedGradientCanvas(
    {
      nativeW: 1440,
      nativeH: 2560,
      colors: activeColors(item.colors, item.active),
      style: item.style,
      blur: item.blur,
      seed: item.seed,
    },
    [item],
  );

  return (
    <div className="relative aspect-square group/card">
      <SheetClose asChild>
        <button
          onClick={() => loadHistoryItem(item)}
          className="absolute inset-0 rounded-[2px] liquid-subtle overflow-hidden cursor-pointer transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-white/30 p-0"
        >
          <canvas ref={ref} className="block w-full h-full" />
        </button>
      </SheetClose>
      <CornerPipButton
        ariaLabel="Delete saved gradient"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          removeHistoryItem(index);
        }}
        revealOnGroupHover
      >
        ×
      </CornerPipButton>
    </div>
  );
}
