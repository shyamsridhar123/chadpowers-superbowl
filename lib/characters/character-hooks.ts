// React Hooks for Character Management
// Provides easy access to character library in React components

import { useMemo, useCallback } from 'react';
import type {
  CharacterDefinition,
  PlayerPosition,
  Team,
  AthleteStats,
  CharacterInstance,
} from './character-types';
import {
  characterLibrary,
  CHAD_POWERS,
  RECEIVERS,
  TIGHT_ENDS,
  RUNNING_BACKS,
  DEFENDERS,
  createRandomReceiver,
} from './character-library';
import { calculateOverallRating, getStatGrade } from './character-builder';

// ============================================
// Hook: useCharacterLibrary
// ============================================

export function useCharacterLibrary() {
  const getCharacter = useCallback((id: string) => {
    return characterLibrary.getCharacterById(id);
  }, []);

  const getByPosition = useCallback((position: PlayerPosition) => {
    return characterLibrary.getPlayersByPosition(position);
  }, []);

  const getTeamPlayers = useCallback((team: Team) => {
    return characterLibrary.getTeamRoster(team);
  }, []);

  return {
    library: characterLibrary,
    getCharacter,
    getByPosition,
    getTeamPlayers,
    chadPowers: CHAD_POWERS,
    receivers: RECEIVERS,
    tightEnds: TIGHT_ENDS,
    runningBacks: RUNNING_BACKS,
    defenders: DEFENDERS,
  };
}

// ============================================
// Hook: useCharacterStats
// ============================================

export function useCharacterStats(character: CharacterDefinition) {
  const overall = useMemo(() => {
    if (!character.position) return 70;
    return calculateOverallRating(character.stats, character.position);
  }, [character.stats, character.position]);

  const grades = useMemo(() => {
    const result: Partial<Record<keyof AthleteStats, string>> = {};
    for (const [key, value] of Object.entries(character.stats)) {
      result[key as keyof AthleteStats] = getStatGrade(value);
    }
    return result;
  }, [character.stats]);

  const topStats = useMemo(() => {
    return Object.entries(character.stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key, value]) => ({ stat: key as keyof AthleteStats, value }));
  }, [character.stats]);

  const weakStats = useMemo(() => {
    return Object.entries(character.stats)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3)
      .map(([key, value]) => ({ stat: key as keyof AthleteStats, value }));
  }, [character.stats]);

  return {
    overall,
    grades,
    topStats,
    weakStats,
    overallGrade: getStatGrade(overall),
  };
}

// ============================================
// Hook: useChadPowers
// ============================================

export function useChadPowers() {
  return useMemo(() => CHAD_POWERS, []);
}

// ============================================
// Hook: useReceiverPool
// ============================================

export function useReceiverPool(count: number = 3, team: Team = 'home') {
  const pool = useMemo(() => {
    const available = RECEIVERS.filter((r) => r.team === team);
    
    // If we need more than available, generate random ones
    if (count <= available.length) {
      return available.slice(0, count);
    }
    
    const extras = Array.from({ length: count - available.length }, (_, i) =>
      createRandomReceiver(team, i)
    );
    
    return [...available, ...extras];
  }, [count, team]);

  const getReceiverBySpeed = useCallback(() => {
    return [...pool].sort((a, b) => b.stats.speed - a.stats.speed);
  }, [pool]);

  const getReceiverByCatching = useCallback(() => {
    return [...pool].sort((a, b) => b.stats.catching - a.stats.catching);
  }, [pool]);

  const getReceiverByRouteRunning = useCallback(() => {
    return [...pool].sort((a, b) => b.stats.routeRunning - a.stats.routeRunning);
  }, [pool]);

  return {
    receivers: pool,
    getReceiverBySpeed,
    getReceiverByCatching,
    getReceiverByRouteRunning,
  };
}

// ============================================
// Hook: useCharacterInstance
// ============================================

export function useCharacterInstance(
  definition: CharacterDefinition,
  initialPosition: [number, number, number] = [0, 0, 0]
): CharacterInstance {
  return useMemo(() => ({
    definition,
    currentPosition: initialPosition,
    currentRotation: 0,
    currentAnimationState: 'idle',
    animationProgress: 0,
    isActive: true,
    currentLOD: 'high',
  }), [definition, initialPosition]);
}

// ============================================
// Hook: useCharacterColors
// ============================================

export function useCharacterColors(character: CharacterDefinition) {
  return useMemo(() => ({
    jersey: {
      primary: character.gear.jersey.primaryColor,
      secondary: character.gear.jersey.secondaryColor,
      number: character.gear.jersey.numberColor,
      name: character.gear.jersey.nameColor,
    },
    helmet: {
      main: character.gear.helmet.color,
      facemask: character.gear.helmet.facemaskColor,
    },
    pants: character.gear.pantsColor,
    socks: character.gear.socksColor,
    cleats: character.gear.cleatsColor,
    gloves: character.gear.glovesColor,
    skin: character.physical.skinTone,
  }), [character.gear, character.physical.skinTone]);
}

// ============================================
// Hook: useCharacterLOD
// ============================================

export function useCharacterLOD(
  character: CharacterDefinition,
  qualityTier: 'high' | 'medium' | 'low' = 'high'
) {
  return useMemo(() => {
    const lodConfig = character.lodConfig[qualityTier];
    return {
      ...lodConfig,
      tier: qualityTier,
      shouldShowSecondaryMotion: lodConfig.hasSecondaryMotion && qualityTier !== 'low',
      shouldShowFacialAnimations: lodConfig.hasFacialAnimations && qualityTier === 'high',
    };
  }, [character.lodConfig, qualityTier]);
}
