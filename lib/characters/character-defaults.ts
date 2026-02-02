// Character Defaults and Factory Functions
// Provides default values and character creation utilities

import type {
  PhysicalAttributes,
  AthleteStats,
  GearConfig,
  JerseyConfig,
  HelmetConfig,
  CharacterPersonality,
  LODConfig,
  PlayerPosition,
} from './character-types';

// ============================================
// Default Physical Attributes by Position
// ============================================

export const DEFAULT_PHYSICAL_BY_POSITION: Record<PlayerPosition, PhysicalAttributes> = {
  QB: {
    height: 1.88,
    weight: 102,
    bodyType: 'athletic',
    skinTone: '#d4a574',
  },
  WR: {
    height: 1.85,
    weight: 91,
    bodyType: 'lean',
    skinTone: '#d4a574',
  },
  TE: {
    height: 1.96,
    weight: 113,
    bodyType: 'athletic',
    skinTone: '#d4a574',
  },
  RB: {
    height: 1.78,
    weight: 100,
    bodyType: 'athletic',
    skinTone: '#d4a574',
  },
  OL: {
    height: 1.96,
    weight: 140,
    bodyType: 'heavy',
    skinTone: '#d4a574',
  },
  DL: {
    height: 1.93,
    weight: 136,
    bodyType: 'heavy',
    skinTone: '#d4a574',
  },
  LB: {
    height: 1.88,
    weight: 113,
    bodyType: 'athletic',
    skinTone: '#d4a574',
  },
  CB: {
    height: 1.83,
    weight: 88,
    bodyType: 'lean',
    skinTone: '#d4a574',
  },
  S: {
    height: 1.85,
    weight: 95,
    bodyType: 'athletic',
    skinTone: '#d4a574',
  },
};

// ============================================
// Default Stats by Position
// ============================================

export const DEFAULT_STATS_BY_POSITION: Record<PlayerPosition, AthleteStats> = {
  QB: {
    speed: 70,
    acceleration: 75,
    armStrength: 85,
    accuracy: 80,
    agility: 75,
    catching: 40,
    routeRunning: 30,
    stamina: 80,
  },
  WR: {
    speed: 90,
    acceleration: 88,
    armStrength: 50,
    accuracy: 50,
    agility: 85,
    catching: 85,
    routeRunning: 88,
    stamina: 85,
  },
  TE: {
    speed: 75,
    acceleration: 72,
    armStrength: 55,
    accuracy: 45,
    agility: 68,
    catching: 80,
    routeRunning: 75,
    stamina: 82,
  },
  RB: {
    speed: 88,
    acceleration: 90,
    armStrength: 50,
    accuracy: 45,
    agility: 88,
    catching: 70,
    routeRunning: 60,
    stamina: 85,
  },
  OL: {
    speed: 50,
    acceleration: 55,
    armStrength: 75,
    accuracy: 30,
    agility: 50,
    catching: 30,
    routeRunning: 20,
    stamina: 75,
  },
  DL: {
    speed: 60,
    acceleration: 65,
    armStrength: 80,
    accuracy: 30,
    agility: 55,
    catching: 35,
    routeRunning: 20,
    stamina: 78,
  },
  LB: {
    speed: 75,
    acceleration: 78,
    armStrength: 70,
    accuracy: 40,
    agility: 72,
    catching: 55,
    routeRunning: 35,
    stamina: 80,
  },
  CB: {
    speed: 92,
    acceleration: 90,
    armStrength: 45,
    accuracy: 40,
    agility: 88,
    catching: 70,
    routeRunning: 50,
    stamina: 82,
  },
  S: {
    speed: 88,
    acceleration: 85,
    armStrength: 55,
    accuracy: 45,
    agility: 82,
    catching: 65,
    routeRunning: 45,
    stamina: 80,
  },
};

// ============================================
// Default Colors & Team Palettes
// ============================================

export const TEAM_COLORS = {
  home: {
    primary: '#c41e3a',      // Cardinal Red
    secondary: '#1a1a2e',    // Dark Navy
    accent: '#ffd700',       // Gold
  },
  away: {
    primary: '#1e3a5f',      // Deep Blue
    secondary: '#ffffff',    // White
    accent: '#c0c0c0',       // Silver
  },
  neutral: {
    primary: '#333333',      // Dark Gray
    secondary: '#666666',    // Medium Gray
    accent: '#ffffff',       // White
  },
};

// ============================================
// Default Gear Configurations
// ============================================

export function createDefaultJersey(
  teamPrimary: string,
  teamSecondary: string,
  number: number,
  name: string
): JerseyConfig {
  return {
    primaryColor: teamPrimary,
    secondaryColor: teamSecondary,
    number,
    name: name.toUpperCase(),
    nameColor: '#ffffff',
    numberColor: '#ffffff',
    style: 'solid',
  };
}

export function createDefaultHelmet(
  teamPrimary: string,
  facemaskColor = '#808080'
): HelmetConfig {
  return {
    color: teamPrimary,
    facemaskColor,
    facemaskStyle: 'standard',
    decalPosition: 'both',
    decalType: 'logo',
  };
}

export function createDefaultGear(
  teamPrimary: string,
  teamSecondary: string,
  number: number,
  name: string,
  position: PlayerPosition
): GearConfig {
  const hasGloves = ['WR', 'TE', 'RB', 'CB', 'S'].includes(position);
  const hasTowel = ['QB', 'RB'].includes(position);
  
  return {
    jersey: createDefaultJersey(teamPrimary, teamSecondary, number, name),
    helmet: createDefaultHelmet(teamPrimary),
    pantsColor: teamSecondary,
    socksColor: teamPrimary,
    cleatsColor: '#ffffff',
    glovesColor: hasGloves ? teamPrimary : undefined,
    hasGloves,
    hasEyeBlack: position === 'QB' || position === 'WR',
    hasSleeves: position === 'OL' || position === 'DL',
    hasArmBands: position === 'QB',
    hasTowel,
  };
}

// ============================================
// Default Personality
// ============================================

export const DEFAULT_PERSONALITY: CharacterPersonality = {
  confidence: 70,
  intensity: 70,
  showmanship: 50,
  leadership: 50,
};

// ============================================
// Default LOD Configuration (Mobile-optimized)
// ============================================

export const DEFAULT_HERO_LOD: LODConfig = {
  high: {
    polyCount: 35000,
    textureSize: 2048,
    boneCount: 65,
    hasSecondaryMotion: true,
    hasFacialAnimations: true,
  },
  medium: {
    polyCount: 15000,
    textureSize: 1024,
    boneCount: 35,
    hasSecondaryMotion: true,
    hasFacialAnimations: false,
  },
  low: {
    polyCount: 5000,
    textureSize: 512,
    boneCount: 22,
    hasSecondaryMotion: false,
    hasFacialAnimations: false,
  },
};

export const DEFAULT_NPC_LOD: LODConfig = {
  high: {
    polyCount: 15000,
    textureSize: 1024,
    boneCount: 35,
    hasSecondaryMotion: true,
    hasFacialAnimations: false,
  },
  medium: {
    polyCount: 8000,
    textureSize: 512,
    boneCount: 25,
    hasSecondaryMotion: false,
    hasFacialAnimations: false,
  },
  low: {
    polyCount: 2500,
    textureSize: 256,
    boneCount: 16,
    hasSecondaryMotion: false,
    hasFacialAnimations: false,
  },
};

export const DEFAULT_CROWD_LOD: LODConfig = {
  high: {
    polyCount: 500,
    textureSize: 256,
    boneCount: 8,
    hasSecondaryMotion: false,
    hasFacialAnimations: false,
  },
  medium: {
    polyCount: 200,
    textureSize: 128,
    boneCount: 4,
    hasSecondaryMotion: false,
    hasFacialAnimations: false,
  },
  low: {
    polyCount: 50,
    textureSize: 64,
    boneCount: 0,
    hasSecondaryMotion: false,
    hasFacialAnimations: false,
  },
};

// ============================================
// Skin Tone Presets
// ============================================

export const SKIN_TONES = {
  light: '#f5d0c5',
  lightMedium: '#e8beac',
  medium: '#d4a574',
  mediumDark: '#a67c52',
  dark: '#8d5524',
  veryDark: '#5c3d2e',
};
