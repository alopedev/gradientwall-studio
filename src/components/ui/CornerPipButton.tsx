import type { MouseEvent, ReactNode } from "react";

/**
 * Small circular "pip" button that lives in the top-right corner of a card
 * (Swatches toggle, History delete). Centralizes the frame chrome so corner
 * geometry / blur / transitions stay consistent across call sites; behavior
 * varies via variant + revealOnGroupHover.
 */
interface Props {
  ariaLabel: string;
  title?: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  /** "dim" = translucent dark base; "solid" = filled near-white. */
  variant?: "dim" | "solid";
  /**
   * Fade in only when the parent has `group/card` hover or this button has
   * focus-visible. Use for affordances that shouldn't draw attention by
   * default (e.g. delete buttons).
   */
  revealOnGroupHover?: boolean;
  children: ReactNode;
}

export function CornerPipButton({
  ariaLabel,
  title,
  onClick,
  disabled,
  variant = "dim",
  revealOnGroupHover = false,
  children,
}: Props) {
  const palette =
    variant === "solid"
      ? "bg-white/90 text-[#07070a] hover:bg-white"
      : "bg-black/55 text-white/90 hover:bg-black/75 disabled:opacity-40 disabled:cursor-not-allowed";
  const reveal = revealOnGroupHover
    ? "opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100"
    : "";
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`absolute top-1 right-1 z-10 h-5 w-5 inline-flex items-center justify-center rounded-full backdrop-blur-sm font-sans text-[12px] leading-none transition-[opacity,background-color,color] duration-150 ${palette} ${reveal}`}
    >
      {children}
    </button>
  );
}
