import type { ReactNode } from "react";

interface FramedProps {
  children: ReactNode;
  /** Distancia al borde del parent. Default 12px. */
  offset?: number;
  /** Tamaño del cuadrito. Default 7px. */
  size?: number;
  /** Color del accent. Default white. */
  color?: string;
  className?: string;
  /** Estilo extra para el wrapper. `position: relative` se fuerza internamente. */
  style?: React.CSSProperties;
}

/**
 * Encuadra el contenido con 4 cuadritos blancos en las esquinas — marca
 * brutalist editorial. El parent recibe `position: relative` automáticamente;
 * los accents son `absolute` sin afectar el flujo.
 */
export function Framed({ children, offset = 12, size = 7, color = "#ffffff", className, style }: FramedProps) {
  const base: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    background: color,
    pointerEvents: "none",
  };
  return (
    <div className={className} style={{ ...style, position: "relative" }}>
      <span aria-hidden data-corner="tl" style={{ ...base, top: offset, left: offset }} />
      <span aria-hidden data-corner="tr" style={{ ...base, top: offset, right: offset }} />
      <span aria-hidden data-corner="bl" style={{ ...base, bottom: offset, left: offset }} />
      <span aria-hidden data-corner="br" style={{ ...base, bottom: offset, right: offset }} />
      {children}
    </div>
  );
}
