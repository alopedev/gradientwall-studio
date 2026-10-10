import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLMotionProps, m } from "motion/react";
import { forwardRef } from "react";
import { cn } from "./shadcn/utils";

/**
 * Buttons of the Studio dock: rounded 14 px glass, gold for the primary
 * action, round for icon-only. Press feedback is a short spring; the motion
 * config upstream turns it off for reduced-motion users.
 */
const glassButton = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-sans text-[0.9rem] font-medium outline-none transition-[background-color,box-shadow,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "gws-sheen min-h-11 overflow-hidden rounded-glass bg-gradient-to-b from-[#f4cd6c] via-gold to-[#d9a531] px-4 font-semibold tracking-[0.01em] text-gold-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(0,0,0,0.12),0_8px_24px_-8px_rgba(233,185,73,0.7)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(0,0,0,0.12),0_10px_30px_-6px_rgba(233,185,73,0.85)]",
        ghost:
          "min-h-11 rounded-glass bg-white/5 px-4 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)] hover:bg-white/10 aria-expanded:bg-white/[0.13] aria-expanded:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]",
        icon: "size-11 rounded-full bg-white/5 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)] hover:bg-white/10",
        quiet:
          "min-h-11 rounded-[10px] px-3 text-[0.85rem] text-white/60 hover:bg-white/[0.06] hover:text-white",
      },
    },
    defaultVariants: { variant: "ghost" },
  },
);

export interface GlassButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof glassButton> {
  children?: React.ReactNode;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { variant, className, type = "button", children, ...props },
  ref,
) {
  return (
    <m.button
      ref={ref}
      type={type}
      whileTap={{ scale: 0.955 }}
      transition={{ type: "spring", stiffness: 520, damping: 22 }}
      className={cn(glassButton({ variant }), className)}
      {...props}
    >
      {children}
    </m.button>
  );
});
