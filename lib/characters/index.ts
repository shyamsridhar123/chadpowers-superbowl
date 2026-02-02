// Character Library - Main Export
// Central export point for all character-related functionality

// Types
export type {
  PlayerPosition,
  CharacterRole,
  Team,
  QBAnimationState,
  ReceiverAnimationState,
  GenericAnimationState,
  PhysicalAttributes,
  AthleteStats,
  JerseyConfig,
  HelmetConfig,
  GearConfig,
  CharacterPersonality,
  CharacterIdentity,
  LODConfig,
  CharacterDefinition,
  CharacterInstance,
  TeamRoster,
  CharacterLibrary,
} from './character-types';

// Defaults
export {
  DEFAULT_PHYSICAL_BY_POSITION,
  DEFAULT_STATS_BY_POSITION,
  DEFAULT_PERSONALITY,
  DEFAULT_HERO_LOD,
  DEFAULT_NPC_LOD,
  DEFAULT_CROWD_LOD,
  TEAM_COLORS,
  SKIN_TONES,
  createDefaultJersey,
  createDefaultHelmet,
  createDefaultGear,
} from './character-defaults';

// Character Library (predefined characters)
export {
  CHAD_POWERS,
  RECEIVERS,
  TIGHT_ENDS,
  RUNNING_BACKS,
  DEFENDERS,
  ALL_PLAYERS,
  characterLibrary,
  createRandomReceiver,
} from './character-library';

// Builder utilities
export {
  CharacterBuilder,
  createCharacter,
  createQuickReceiver,
  createQuickQB,
  calculateOverallRating,
  getStatGrade,
  validateCharacter,
  compareCharacters,
  getMatchupAdvantage,
} from './character-builder';

// React Hooks
export {
  useCharacterLibrary,
  useCharacterStats,
  useChadPowers,
  useReceiverPool,
  useCharacterInstance,
  useCharacterColors,
  useCharacterLOD,
} from './character-hooks';
