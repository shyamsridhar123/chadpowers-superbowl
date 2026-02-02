"use client";

import { useGameStore } from "@/lib/game-store";
import { MainMenu } from "./MainMenu";
import { GameController } from "./GameController";

export function Game() {
  const mode = useGameStore((state) => state.mode);

  if (mode === "menu") {
    return <MainMenu />;
  }

  return <GameController />;
}
