"use client";

import { FootballPlayer, PLAYER_PRESETS } from "./FootballPlayer";
import { CHAD_POWERS } from "@/lib/characters";

interface QuarterbackProps {
  position: [number, number, number];
  isThrowing?: boolean;
}

export function Quarterback({ position, isThrowing = false }: QuarterbackProps) {
  return (
    <FootballPlayer
      position={position}
      animationState={isThrowing ? 'throwing' : 'idle'}
      isAnimating={true}
      character={CHAD_POWERS}
      {...PLAYER_PRESETS.quarterback}
    />
  );
}
