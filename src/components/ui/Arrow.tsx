import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "./shadcn/utils";

const ICONS = { right: ArrowRight, left: ArrowLeft, down: ArrowDown, out: ArrowUpRight } as const;

/**
 * The arrow beside a link's or a button's text: an icon from the icon set
 * (Lucide), never a text glyph such as "→" or "↗", which some screens draw as
 * an emoji (Àlex, 2026-11-09; `identity.test.ts` guards it). `out` is for
 * links that leave the site, `down` for links further down the same page.
 * It takes the size and colour of the text around it and is hidden from
 * screen readers: the words already say where the link goes.
 */
export function Arrow({
  to = "right",
  className,
}: {
  to?: keyof typeof ICONS;
  className?: string;
}) {
  const Icon = ICONS[to];
  return (
    <Icon
      aria-hidden
      strokeWidth={2.25}
      className={cn("inline-block size-[1.1em] shrink-0 align-[-0.16em]", className)}
    />
  );
}
