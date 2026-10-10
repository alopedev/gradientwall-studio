import { createContext, type ReactNode, useContext } from "react";
import { canvas2DEngine } from "./canvas2d-engine";
import type { WallpaperEngine } from "./types";

const EngineContext = createContext<WallpaperEngine>(canvas2DEngine);

/** Swap the engine for a subtree (tests, or the WebGL v2 engine once it lands). */
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
