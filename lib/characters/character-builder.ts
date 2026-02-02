// Character Builder Utilities
// Functions for creating, customizing, and validating characters

import type {
  CharacterDefinition,
  CharacterIdentity,
  PhysicalAttributes,
  AthleteStats,
  GearConfig,
  CharacterPersonality,
  LODConfig,
  PlayerPosition,
  Team,
} from './character-types';
import {
  DEFAULT_PHYSICAL_BY_POSITION,
  DEFAULT_STATS_BY_POSITION,
  DEFAULT_PERSONALITY,
  DEFAULT_NPC_LOD,
  DEFAULT_HERO_LOD,
  TEAM_COLORS,
  createDefaultGear,
} from './character-defaults';

// ============================================
// Character Builder Class
// ============================================

export class CharacterBuilder {
  private character: Partial<CharacterDefinition> = {};

  constructor() {
    this.reset();
  }

  reset(): CharacterBuilder {
    this.character = {
      role: 'player',
      team: 'home',
      personality: { ...DEFAULT_PERSONALITY },
    };
    return this;
  }

  // Identity
  setIdentity(identity: CharacterIdentity): CharacterBuilder {
    this.character.identity = identity;
    return this;
  }

  setName(firstName: string, lastName: string, nickname?: string): CharacterBuilder {
    this.character.identity = {
      id: `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now()}`,
      firstName,
      lastName,
      nickname,
      displayName: `${firstName.charAt(0)}. ${lastName.toUpperCase()}`,
    };
    return this;
  }

  // Position & Team
  setPosition(position: PlayerPosition): CharacterBuilder {
    this.character.position = position;
    // Apply default physical and stats based on position
    if (!this.character.physical) {
      this.character.physical = { ...DEFAULT_PHYSICAL_BY_POSITION[position] };
    }
    if (!this.character.stats) {
      this.character.stats = { ...DEFAULT_STATS_BY_POSITION[position] };
    }
    return this;
  }

  setTeam(team: Team): CharacterBuilder {
    this.character.team = team;
    return this;
  }

  // Physical Attributes
  setPhysical(physical: Partial<PhysicalAttributes>): CharacterBuilder {
    this.character.physical = {
      ...(this.character.physical || DEFAULT_PHYSICAL_BY_POSITION.QB),
      ...physical,
    };
    return this;
  }

  setHeight(height: number): CharacterBuilder {
    if (this.character.physical) {
      this.character.physical.height = height;
    }
    return this;
  }

  setWeight(weight: number): CharacterBuilder {
    if (this.character.physical) {
      this.character.physical.weight = weight;
    }
    return this;
  }

  setSkinTone(skinTone: string): CharacterBuilder {
    if (this.character.physical) {
      this.character.physical.skinTone = skinTone;
    }
    return this;
  }

  // Stats
  setStats(stats: Partial<AthleteStats>): CharacterBuilder {
    this.character.stats = {
      ...(this.character.stats || DEFAULT_STATS_BY_POSITION.QB),
      ...stats,
    };
    return this;
  }

  boostStat(stat: keyof AthleteStats, amount: number): CharacterBuilder {
    if (this.character.stats) {
      this.character.stats[stat] = Math.min(100, Math.max(1, this.character.stats[stat] + amount));
    }
    return this;
  }

  // Gear
  setGear(gear: GearConfig): CharacterBuilder {
    this.character.gear = gear;
    return this;
  }

  setJerseyNumber(number: number): CharacterBuilder {
    if (this.character.gear) {
      this.character.gear.jersey.number = number;
    }
    return this;
  }

  setTeamColors(primary: string, secondary: string): CharacterBuilder {
    if (this.character.gear) {
      this.character.gear.jersey.primaryColor = primary;
      this.character.gear.jersey.secondaryColor = secondary;
      this.character.gear.helmet.color = primary;
      this.character.gear.pantsColor = secondary;
      this.character.gear.socksColor = primary;
    }
    return this;
  }

  // Personality
  setPersonality(personality: Partial<CharacterPersonality>): CharacterBuilder {
    this.character.personality = {
      ...(this.character.personality || DEFAULT_PERSONALITY),
      ...personality,
    };
    return this;
  }

  // LOD
  setLOD(lodConfig: LODConfig): CharacterBuilder {
    this.character.lodConfig = lodConfig;
    return this;
  }

  setAsHero(): CharacterBuilder {
    this.character.lodConfig = DEFAULT_HERO_LOD;
    return this;
  }

  setAsNPC(): CharacterBuilder {
    this.character.lodConfig = DEFAULT_NPC_LOD;
    return this;
  }

  // Model paths
  setModelPath(path: string): CharacterBuilder {
    this.character.modelPath = path;
    return this;
  }

  setAnimationPaths(paths: CharacterDefinition['animationPaths']): CharacterBuilder {
    this.character.animationPaths = paths;
    return this;
  }

  // Build
  build(): CharacterDefinition {
    // Validate required fields
    if (!this.character.identity) {
      throw new Error('Character identity is required');
    }
    if (!this.character.position) {
      throw new Error('Character position is required');
    }
    if (!this.character.physical) {
      this.character.physical = DEFAULT_PHYSICAL_BY_POSITION[this.character.position];
    }
    if (!this.character.stats) {
      this.character.stats = DEFAULT_STATS_BY_POSITION[this.character.position];
    }
    if (!this.character.gear) {
      const teamColors = TEAM_COLORS[this.character.team || 'home'];
      this.character.gear = createDefaultGear(
        teamColors.primary,
        teamColors.secondary,
        Math.floor(Math.random() * 99) + 1,
        this.character.identity.lastName,
        this.character.position
      );
    }
    if (!this.character.lodConfig) {
      this.character.lodConfig = DEFAULT_NPC_LOD;
    }

    return this.character as CharacterDefinition;
  }
}

// ============================================
// Factory Functions
// ============================================

export function createCharacter(): CharacterBuilder {
  return new CharacterBuilder();
}

export function createQuickReceiver(
  firstName: string,
  lastName: string,
  jerseyNumber: number,
  team: Team = 'home'
): CharacterDefinition {
  const teamColors = TEAM_COLORS[team];
  
  return createCharacter()
    .setName(firstName, lastName)
    .setPosition('WR')
    .setTeam(team)
    .setGear(createDefaultGear(teamColors.primary, teamColors.secondary, jerseyNumber, lastName, 'WR'))
    .setAsNPC()
    .build();
}

export function createQuickQB(
  firstName: string,
  lastName: string,
  jerseyNumber: number,
  team: Team = 'home'
): CharacterDefinition {
  const teamColors = TEAM_COLORS[team];
  
  return createCharacter()
    .setName(firstName, lastName)
    .setPosition('QB')
    .setTeam(team)
    .setGear(createDefaultGear(teamColors.primary, teamColors.secondary, jerseyNumber, lastName, 'QB'))
    .setAsHero()
    .build();
}

// ============================================
// Stat Calculation Utilities
// ============================================

export function calculateOverallRating(stats: AthleteStats, position: PlayerPosition): number {
  const weights: Record<PlayerPosition, Partial<Record<keyof AthleteStats, number>>> = {
    QB: { armStrength: 0.25, accuracy: 0.30, speed: 0.10, agility: 0.15, stamina: 0.10, acceleration: 0.10 },
    WR: { speed: 0.25, catching: 0.25, routeRunning: 0.20, acceleration: 0.15, agility: 0.15 },
    TE: { catching: 0.25, speed: 0.15, routeRunning: 0.15, acceleration: 0.15, stamina: 0.15, armStrength: 0.15 },
    RB: { speed: 0.25, acceleration: 0.25, agility: 0.20, catching: 0.15, stamina: 0.15 },
    OL: { stamina: 0.35, armStrength: 0.35, acceleration: 0.15, agility: 0.15 },
    DL: { speed: 0.20, acceleration: 0.25, armStrength: 0.30, agility: 0.15, stamina: 0.10 },
    LB: { speed: 0.25, acceleration: 0.20, catching: 0.15, agility: 0.20, stamina: 0.20 },
    CB: { speed: 0.30, acceleration: 0.25, agility: 0.20, catching: 0.15, stamina: 0.10 },
    S: { speed: 0.25, acceleration: 0.20, catching: 0.20, agility: 0.20, stamina: 0.15 },
  };

  const positionWeights = weights[position];
  let overall = 0;
  let totalWeight = 0;

  for (const [stat, weight] of Object.entries(positionWeights)) {
    if (weight && stats[stat as keyof AthleteStats]) {
      overall += stats[stat as keyof AthleteStats] * weight;
      totalWeight += weight;
    }
  }

  return Math.round(totalWeight > 0 ? overall / totalWeight : 70);
}

export function getStatGrade(value: number): string {
  if (value >= 95) return 'S';
  if (value >= 90) return 'A+';
  if (value >= 85) return 'A';
  if (value >= 80) return 'B+';
  if (value >= 75) return 'B';
  if (value >= 70) return 'C+';
  if (value >= 65) return 'C';
  if (value >= 60) return 'D+';
  if (value >= 55) return 'D';
  return 'F';
}

// ============================================
// Validation Utilities
// ============================================

export function validateCharacter(character: CharacterDefinition): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!character.identity?.id) {
    errors.push('Character must have an ID');
  }
  if (!character.identity?.firstName || !character.identity?.lastName) {
    errors.push('Character must have a first and last name');
  }
  if (!character.position) {
    errors.push('Character must have a position');
  }
  if (!character.physical) {
    errors.push('Character must have physical attributes');
  }
  if (!character.stats) {
    errors.push('Character must have stats');
  }
  if (!character.gear) {
    errors.push('Character must have gear configuration');
  }
  if (character.gear?.jersey.number < 1 || character.gear?.jersey.number > 99) {
    errors.push('Jersey number must be between 1 and 99');
  }

  // Validate stat ranges
  if (character.stats) {
    for (const [key, value] of Object.entries(character.stats)) {
      if (value < 1 || value > 100) {
        errors.push(`Stat ${key} must be between 1 and 100`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// Character Comparison
// ============================================

export function compareCharacters(
  char1: CharacterDefinition,
  char2: CharacterDefinition,
  stat: keyof AthleteStats
): { winner: CharacterDefinition; difference: number } {
  const stat1 = char1.stats[stat];
  const stat2 = char2.stats[stat];
  
  return {
    winner: stat1 >= stat2 ? char1 : char2,
    difference: Math.abs(stat1 - stat2),
  };
}

export function getMatchupAdvantage(
  receiver: CharacterDefinition,
  defender: CharacterDefinition
): { advantage: 'receiver' | 'defender' | 'even'; reason: string } {
  const speedDiff = receiver.stats.speed - defender.stats.speed;
  const agilityDiff = receiver.stats.agility - defender.stats.agility;
  const catchDiff = receiver.stats.catching - 60; // vs average

  const receiverScore = speedDiff * 0.4 + agilityDiff * 0.3 + catchDiff * 0.3;

  if (receiverScore > 10) {
    return { advantage: 'receiver', reason: 'Speed and route-running advantage' };
  } else if (receiverScore < -10) {
    return { advantage: 'defender', reason: 'Coverage and athleticism advantage' };
  }
  return { advantage: 'even', reason: 'Evenly matched' };
}
