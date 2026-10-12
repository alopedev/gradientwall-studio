import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLMotionProps, m } from "motion/react";
import { forwardRef } from "react";
import { cn } from "./shadcn/utils";

/**
 * Buttons of identity B ("Dessau paper"): black ink on grey paper, no glass.
 * `primary` is the filled ink rectangle (4 px corners), `round` the filled
 * circle Shuffle uses, `ghost` a 2 px ink outline, `icon` an outlined circle
 * and `quiet` plain text. Press feedback is a short spring; the motion config
 * upstream turns it off for reduced-motion users.
 */
export const inkButton = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-sans text-[0.9rem] font-medium outline-none transition-[background-color,box-shadow,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "gws-sheen min-h-11 overflow-hidden rounded-sharp bg-ink px-4 font-semibold text-bg hover:bg-ink/85",
        round:
          "gws-sheen size-16 overflow-hidden rounded-full bg-ink font-semibold text-bg hover:bg-ink/85",
        ghost:
          "min-h-11 rounded-sharp px-4 text-ink shadow-[inset_0_0_0_2px_var(--color-ink)] hover:bg-ink/[0.06] aria-expanded:bg-ink aria-expanded:text-bg",
        icon: "size-11 rounded-full text-ink shadow-[inset_0_0_0_2px_var(--color-ink)] hover:bg-ink hover:text-bg",
        quiet:
          "min-h-11 rounded-sharp px-3 text-[0.85rem] text-ink-dim hover:bg-ink/[0.06] hover:text-ink",
      },
    },
    defaultVariants: { variant: "ghost" },
  },
);

export interface InkButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof inkButton> {
  children?: React.ReactNode;
}

export const InkButton = forwardRef<HTMLButtonElement, InkButtonProps>(function InkButton(
  { variant, className, type = "button", children, ...props },
  ref,
) {
  return (
    <m.button
      ref={ref}
      type={type}
      whileTap={{ scale: 0.955 }}
      transition={{ type: "spring", stiffness: 520, damping: 22 }}
      className={cn(inkButton({ variant }), className)}
      {...props}
    >
      {children}
    </m.button>
  );
});
