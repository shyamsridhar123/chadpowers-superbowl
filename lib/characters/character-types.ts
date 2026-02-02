// Character Types for Chad Powers Football Game
// Defines all character-related interfaces and enums

// ============================================
// Position & Role Types
// ============================================

export type PlayerPosition = 
  | 'QB'      // Quarterback
  | 'WR'      // Wide Receiver
  | 'TE'      // Tight End
  | 'RB'      // Running Back
  | 'OL'      // Offensive Line
  | 'DL'      // Defensive Line
  | 'LB'      // Linebacker
  | 'CB'      // Cornerback
  | 'S';      // Safety

export type CharacterRole = 'player' | 'coach' | 'referee' | 'mascot' | 'cheerleader';

export type Team = 'home' | 'away' | 'neutral';

// ============================================
// Animation States
// ============================================

export type QBAnimationState = 
  | 'idle'
  | 'dropback'
  | 'scramble'
  | 'throw'
  | 'followthrough'
  | 'sacked'
  | 'celebrate'
  | 'disappointed';

export type ReceiverAnimationState = 
  | 'idle'
  | 'stance'
  | 'running'
  | 'cutting'
  | 'catching'
  | 'diving'
  | 'celebrating'
  | 'incomplete';

export type GenericAnimationState = 
  | 'idle'
  | 'walking'
  | 'running'
  | 'jumping'
  | 'celebrating'
  | 'reacting';

// ============================================
// Physical Attributes
// ============================================

export interface PhysicalAttributes {
  height: number;           // in game units (1 unit ≈ 1 meter)
  weight: number;           // affects physics interactions
  bodyType: 'lean' | 'athletic' | 'heavy';
  skinTone: string;         // hex color
}

export interface AthleteStats {
  speed: number;            // 1-100
  acceleration: number;     // 1-100
  armStrength: number;      // 1-100 (QB throwing power)
  accuracy: number;         // 1-100 (QB accuracy)
  agility: number;          // 1-100
  catching: number;         // 1-100
  routeRunning: number;     // 1-100
  stamina: number;          // 1-100
}

// ============================================
// Appearance & Equipment
// ============================================

export interface JerseyConfig {
  primaryColor: string;
  secondaryColor: string;
  number: number;
  name: string;
  nameColor: string;
  numberColor: string;
  style: 'solid' | 'striped' | 'gradient';
}

export interface HelmetConfig {
  color: string;
  facemaskColor: string;
  facemaskStyle: 'standard' | 'cage' | 'visor';
  decalPosition?: 'left' | 'right' | 'both';
  decalType?: 'logo' | 'number' | 'stripe';
}

export interface GearConfig {
  jersey: JerseyConfig;
  helmet: HelmetConfig;
  pantsColor: string;
  socksColor: string;
  cleatsColor: string;
  glovesColor?: string;
  hasGloves: boolean;
  hasEyeBlack: boolean;
  hasSleeves: boolean;
  hasArmBands: boolean;
  hasTowel: boolean;
}

// ============================================
// Character Personality & Identity
// ============================================

export interface CharacterPersonality {
  confidence: number;       // 1-100, affects animations and reactions
  intensity: number;        // 1-100, affects movement speed and aggression
  showmanship: number;      // 1-100, affects celebration style
  leadership: number;       // 1-100, affects team dynamics
}

export interface CharacterIdentity {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  displayName: string;      // What shows in UI
  bio?: string;             // Character backstory
  college?: string;
  homeTown?: string;
}

// ============================================
// LOD (Level of Detail) Configuration
// ============================================

export interface LODConfig {
  high: {
    polyCount: number;
    textureSize: number;
    boneCount: number;
    hasSecondaryMotion: boolean;
    hasFacialAnimations: boolean;
  };
  medium: {
    polyCount: number;
    textureSize: number;
    boneCount: number;
    hasSecondaryMotion: boolean;
    hasFacialAnimations: boolean;
  };
  low: {
    polyCount: number;
    textureSize: number;
    boneCount: number;
    hasSecondaryMotion: boolean;
    hasFacialAnimations: boolean;
  };
}

// ============================================
// Complete Character Definition
// ============================================

export interface CharacterDefinition {
  identity: CharacterIdentity;
  role: CharacterRole;
  position?: PlayerPosition;
  team: Team;
  physical: PhysicalAttributes;
  stats: AthleteStats;
  gear: GearConfig;
  personality: CharacterPersonality;
  lodConfig: LODConfig;
  modelPath?: string;       // Path to GLTF/GLB model (optional, for custom models)
  animationPaths?: {        // Paths to animation files
    idle?: string;
    run?: string;
    throw?: string;
    catch?: string;
    celebrate?: string;
  };
}

// ============================================
// Character Instance (runtime state)
// ============================================

export interface CharacterInstance {
  definition: CharacterDefinition;
  currentPosition: [number, number, number];
  currentRotation: number;
  currentAnimationState: string;
  animationProgress: number;
  isActive: boolean;
  currentLOD: 'high' | 'medium' | 'low';
}

// ============================================
// Character Collection Types
// ============================================

export interface TeamRoster {
  teamName: string;
  teamAbbreviation: string;
  primaryColor: string;
  secondaryColor: string;
  mascot?: string;
  players: CharacterDefinition[];
}

export interface CharacterLibrary {
  quarterbacks: CharacterDefinition[];
  receivers: CharacterDefinition[];
  allPlayers: CharacterDefinition[];
  coaches: CharacterDefinition[];
  getCharacterById: (id: string) => CharacterDefinition | undefined;
  getPlayersByPosition: (position: PlayerPosition) => CharacterDefinition[];
  getTeamRoster: (team: Team) => CharacterDefinition[];
}
