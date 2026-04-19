import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary-sharp" | "ghost-sharp" | "pill-mini" | "pill-mini-primary" | "block" | "block-primary";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const base =
  "inline-flex items-center gap-2 transition-colors duration-150 font-sans disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  // Hero CTA — sharp 2px, off-white, dark ink
  "primary-sharp":
    "rounded-[2px] bg-[#f8f8f8] text-[#171717] font-medium px-5 py-3 text-sm tracking-[0.01em] hover:bg-white hover:-translate-y-px transition-transform",
  // Hero secondary — sharp 2px outline, white ink
  "ghost-sharp":
    "rounded-[2px] border border-white/35 text-white font-medium px-5 py-3 text-sm tracking-[0.01em] hover:bg-white/10 hover:border-white/55",
  // Studio preview chrome — liquid pill, dim ink → ink on hover
  "pill-mini":
    "liquid-pill rounded-full px-3 py-2 text-[11px] tracking-[0.1em] uppercase text-[color:var(--color-ink-dim)] hover:text-white",
  "pill-mini-primary":
    "rounded-full bg-[#f8f8f8] text-[#171717] px-3 py-2 text-[11px] tracking-[0.1em] uppercase font-medium hover:bg-white hover:-translate-y-px transition-transform",
  // Panel section CTAs — sharp 2px
  block:
    "flex-1 rounded-[2px] border border-white/14 text-white px-4 py-3 text-xs font-sans tracking-[0.14em] uppercase hover:bg-white/5 hover:border-white/30",
  "block-primary":
    "flex-1 rounded-[2px] bg-[#f8f8f8] text-[#171717] px-4 py-3 text-xs font-sans font-medium tracking-[0.14em] uppercase hover:bg-white hover:-translate-y-px transition-transform",
};

export function Button({ variant = "primary-sharp", className = "", children, ...rest }: Props) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
