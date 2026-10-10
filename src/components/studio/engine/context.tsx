import { createContext, type ReactNode, useContext } from "react";
import { webglEngine } from "./webgl-engine";
import type { WallpaperEngine } from "./types";

const EngineContext = createContext<WallpaperEngine>(webglEngine);

/** Swap the engine for a subtree (tests). The default is the WebGL v2 engine, which falls back to Canvas2D. */
export function EngineProvider({
  engine,
  children,
}: {
  engine: WallpaperEngine;
  children: ReactNode;
}) {
  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>;
}

export function useWallpaperEngine(): WallpaperEngine {
  return useContext(EngineContext);
}
