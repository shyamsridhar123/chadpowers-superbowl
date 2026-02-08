"use client";

import { useGameStore } from "@/lib/game-store";
import { MainMenu } from "./MainMenu";
import { GameController } from "./GameController";
import { CelebrationScene } from "./CelebrationScene";

export function Game() {
  const mode = useGameStore((state) => state.mode);
  const celebrationData = useGameStore((state) => state.celebrationData);
  const startGame = useGameStore((state) => state.startGame);
  const startChallenge = useGameStore((state) => state.startChallenge);
  const endCelebration = useGameStore((state) => state.endCelebration);

  if (mode === "menu") {
    return <MainMenu />;
  }

  if (mode === "celebration" && celebrationData) {
    return (
      <CelebrationScene
        celebrationData={celebrationData}
        onPlayAgain={() => {
          if (celebrationData.mode === "practice") {
            startGame();
          } else {
            startChallenge();
          }
        }}
        onMainMenu={endCelebration}
      />
    );
  }

  return <GameController />;
}
