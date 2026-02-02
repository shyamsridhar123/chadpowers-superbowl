// Character Library for Chad Powers Football Game
// Contains all predefined playable and NPC characters

import type {
  CharacterDefinition,
  CharacterLibrary,
  PlayerPosition,
  Team,
} from './character-types';
import {
  DEFAULT_PHYSICAL_BY_POSITION,
  DEFAULT_STATS_BY_POSITION,
  DEFAULT_PERSONALITY,
  DEFAULT_HERO_LOD,
  DEFAULT_NPC_LOD,
  TEAM_COLORS,
  SKIN_TONES,
  createDefaultGear,
} from './character-defaults';

// ============================================
// HERO CHARACTER: CHAD POWERS
// ============================================

export const CHAD_POWERS: CharacterDefinition = {
  identity: {
    id: 'chad-powers',
    firstName: 'Chad',
    lastName: 'Powers',
    nickname: 'The Powerhouse',
    displayName: 'CHAD POWERS',
    bio: 'A mysterious walk-on with an arm of gold and a heart of pure determination. Nobody knows where he came from, but everyone knows where he\'s going - straight to the end zone.',
    college: 'Penn State',
    homeTown: 'Unknown',
  },
  role: 'player',
  position: 'QB',
  team: 'home',
  physical: {
    height: 1.91,
    weight: 104,
    bodyType: 'athletic',
    skinTone: SKIN_TONES.medium,
  },
  stats: {
    speed: 78,
    acceleration: 82,
    armStrength: 95,      // Elite arm
    accuracy: 88,         // Very accurate
    agility: 80,
    catching: 45,
    routeRunning: 35,
    stamina: 90,
  },
  gear: {
    jersey: {
      primaryColor: TEAM_COLORS.home.primary,
      secondaryColor: TEAM_COLORS.home.secondary,
      number: 7,
      name: 'POWERS',
      nameColor: '#ffffff',
      numberColor: '#ffffff',
      style: 'solid',
    },
    helmet: {
      color: TEAM_COLORS.home.primary,
      facemaskColor: '#c0c0c0',
      facemaskStyle: 'standard',
      decalPosition: 'both',
      decalType: 'logo',
    },
    pantsColor: TEAM_COLORS.home.secondary,
    socksColor: TEAM_COLORS.home.primary,
    cleatsColor: '#ffffff',
    glovesColor: undefined,
    hasGloves: false,
    hasEyeBlack: true,
    hasSleeves: false,
    hasArmBands: true,
    hasTowel: true,
  },
  personality: {
    confidence: 95,       // Extremely confident
    intensity: 85,
    showmanship: 90,      // Loves the spotlight
    leadership: 88,
  },
  lodConfig: DEFAULT_HERO_LOD,
};

// ============================================
// WIDE RECEIVERS
// ============================================

export const RECEIVERS: CharacterDefinition[] = [
  {
    identity: {
      id: 'receiver-speedster',
      firstName: 'Marcus',
      lastName: 'Swift',
      nickname: 'Lightning',
      displayName: 'M. SWIFT',
      bio: 'The fastest player on the field. If you blink, he\'s already in the end zone.',
      college: 'Texas State',
      homeTown: 'Houston, TX',
    },
    role: 'player',
    position: 'WR',
    team: 'home',
    physical: {
      height: 1.80,
      weight: 84,
      bodyType: 'lean',
      skinTone: SKIN_TONES.dark,
    },
    stats: {
      speed: 98,            // Blazing fast
      acceleration: 95,
      armStrength: 45,
      accuracy: 40,
      agility: 90,
      catching: 82,
      routeRunning: 78,
      stamina: 88,
    },
    gear: createDefaultGear(TEAM_COLORS.home.primary, TEAM_COLORS.home.secondary, 11, 'SWIFT', 'WR'),
    personality: {
      confidence: 85,
      intensity: 80,
      showmanship: 88,
      leadership: 55,
    },
    lodConfig: DEFAULT_NPC_LOD,
  },
  {
    identity: {
      id: 'receiver-possession',
      firstName: 'Devon',
      lastName: 'Chambers',
      nickname: 'Reliable',
      displayName: 'D. CHAMBERS',
      bio: 'The go-to receiver in clutch moments. Never drops a catchable ball.',
      college: 'Michigan',
      homeTown: 'Detroit, MI',
    },
    role: 'player',
    position: 'WR',
    team: 'home',
    physical: {
      height: 1.88,
      weight: 93,
      bodyType: 'athletic',
      skinTone: SKIN_TONES.mediumDark,
    },
    stats: {
      speed: 82,
      acceleration: 80,
      armStrength: 52,
      accuracy: 45,
      agility: 78,
      catching: 95,         // Elite hands
      routeRunning: 92,     // Precise routes
      stamina: 85,
    },
    gear: createDefaultGear(TEAM_COLORS.home.primary, TEAM_COLORS.home.secondary, 84, 'CHAMBERS', 'WR'),
    personality: {
      confidence: 75,
      intensity: 70,
      showmanship: 45,
      leadership: 78,
    },
    lodConfig: DEFAULT_NPC_LOD,
  },
  {
    identity: {
      id: 'receiver-redzone',
      firstName: 'Tyrone',
      lastName: 'Jackson',
      nickname: 'Skyscraper',
      displayName: 'T. JACKSON',
      bio: 'A towering presence in the red zone. Just throw it up, he\'ll go get it.',
      college: 'USC',
      homeTown: 'Los Angeles, CA',
    },
    role: 'player',
    position: 'WR',
    team: 'home',
    physical: {
      height: 1.98,
      weight: 102,
      bodyType: 'athletic',
      skinTone: SKIN_TONES.dark,
    },
    stats: {
      speed: 78,
      acceleration: 75,
      armStrength: 55,
      accuracy: 42,
      agility: 72,
      catching: 88,
      routeRunning: 75,
      stamina: 80,
    },
    gear: createDefaultGear(TEAM_COLORS.home.primary, TEAM_COLORS.home.secondary, 18, 'JACKSON', 'WR'),
    personality: {
      confidence: 80,
      intensity: 85,
      showmanship: 70,
      leadership: 60,
    },
    lodConfig: DEFAULT_NPC_LOD,
  },
  {
    identity: {
      id: 'receiver-slot',
      firstName: 'Alex',
      lastName: 'Rivera',
      nickname: 'Shifty',
      displayName: 'A. RIVERA',
      bio: 'The quickest feet in the slot. Makes defenders look silly on a weekly basis.',
      college: 'Florida',
      homeTown: 'Miami, FL',
    },
    role: 'player',
    position: 'WR',
    team: 'home',
    physical: {
      height: 1.75,
      weight: 79,
      bodyType: 'lean',
      skinTone: SKIN_TONES.lightMedium,
    },
    stats: {
      speed: 88,
      acceleration: 92,
      armStrength: 42,
      accuracy: 38,
      agility: 96,          // Elite agility
      catching: 85,
      routeRunning: 90,
      stamina: 82,
    },
    gear: createDefaultGear(TEAM_COLORS.home.primary, TEAM_COLORS.home.secondary, 3, 'RIVERA', 'WR'),
    personality: {
      confidence: 82,
      intensity: 75,
      showmanship: 82,
      leadership: 48,
    },
    lodConfig: DEFAULT_NPC_LOD,
  },
];

// ============================================
// TIGHT ENDS
// ============================================

export const TIGHT_ENDS: CharacterDefinition[] = [
  {
    identity: {
      id: 'tightend-primary',
      firstName: 'Bradley',
      lastName: 'Morrison',
      nickname: 'Big Mo',
      displayName: 'B. MORRISON',
      bio: 'A matchup nightmare who can block like a lineman and catch like a receiver.',
      college: 'Iowa',
      homeTown: 'Cedar Rapids, IA',
    },
    role: 'player',
    position: 'TE',
    team: 'home',
    physical: {
      height: 1.98,
      weight: 118,
      bodyType: 'athletic',
      skinTone: SKIN_TONES.light,
    },
    stats: {
      speed: 72,
      acceleration: 70,
      armStrength: 60,
      accuracy: 40,
      agility: 65,
      catching: 85,
      routeRunning: 78,
      stamina: 82,
    },
    gear: createDefaultGear(TEAM_COLORS.home.primary, TEAM_COLORS.home.secondary, 87, 'MORRISON', 'TE'),
    personality: {
      confidence: 70,
      intensity: 78,
      showmanship: 40,
      leadership: 72,
    },
    lodConfig: DEFAULT_NPC_LOD,
  },
];

// ============================================
// RUNNING BACKS
// ============================================

export const RUNNING_BACKS: CharacterDefinition[] = [
  {
    identity: {
      id: 'runningback-primary',
      firstName: 'Jaylen',
      lastName: 'Brooks',
      nickname: 'Jukebox',
      displayName: 'J. BROOKS',
      bio: 'An explosive playmaker who can change the game with a single touch.',
      college: 'Alabama',
      homeTown: 'Birmingham, AL',
    },
    role: 'player',
    position: 'RB',
    team: 'home',
    physical: {
      height: 1.78,
      weight: 98,
      bodyType: 'athletic',
      skinTone: SKIN_TONES.dark,
    },
    stats: {
      speed: 92,
      acceleration: 94,
      armStrength: 48,
      accuracy: 40,
      agility: 90,
      catching: 78,
      routeRunning: 65,
      stamina: 88,
    },
    gear: createDefaultGear(TEAM_COLORS.home.primary, TEAM_COLORS.home.secondary, 28, 'BROOKS', 'RB'),
    personality: {
      confidence: 88,
      intensity: 90,
      showmanship: 75,
      leadership: 58,
    },
    lodConfig: DEFAULT_NPC_LOD,
  },
];

// ============================================
// AWAY TEAM DEFENDERS (for challenge mode)
// ============================================

export const DEFENDERS: CharacterDefinition[] = [
  {
    identity: {
      id: 'defender-cb1',
      firstName: 'DeShawn',
      lastName: 'Williams',
      nickname: 'Lock',
      displayName: 'D. WILLIAMS',
      bio: 'A shutdown corner who lives for the big moment.',
      college: 'Ohio State',
      homeTown: 'Cleveland, OH',
    },
    role: 'player',
    position: 'CB',
    team: 'away',
    physical: {
      height: 1.83,
      weight: 88,
      bodyType: 'lean',
      skinTone: SKIN_TONES.dark,
    },
    stats: DEFAULT_STATS_BY_POSITION.CB,
    gear: createDefaultGear(TEAM_COLORS.away.primary, TEAM_COLORS.away.secondary, 21, 'WILLIAMS', 'CB'),
    personality: {
      confidence: 90,
      intensity: 85,
      showmanship: 80,
      leadership: 65,
    },
    lodConfig: DEFAULT_NPC_LOD,
  },
  {
    identity: {
      id: 'defender-s1',
      firstName: 'Marcus',
      lastName: 'Thompson',
      nickname: 'Hawk',
      displayName: 'M. THOMPSON',
      bio: 'Sees the field like no other. Always in the right place at the right time.',
      college: 'LSU',
      homeTown: 'Baton Rouge, LA',
    },
    role: 'player',
    position: 'S',
    team: 'away',
    physical: {
      height: 1.88,
      weight: 95,
      bodyType: 'athletic',
      skinTone: SKIN_TONES.mediumDark,
    },
    stats: DEFAULT_STATS_BY_POSITION.S,
    gear: createDefaultGear(TEAM_COLORS.away.primary, TEAM_COLORS.away.secondary, 23, 'THOMPSON', 'S'),
    personality: {
      confidence: 82,
      intensity: 78,
      showmanship: 55,
      leadership: 80,
    },
    lodConfig: DEFAULT_NPC_LOD,
  },
];

// ============================================
// LIBRARY AGGREGATION & EXPORTS
// ============================================

export const ALL_PLAYERS: CharacterDefinition[] = [
  CHAD_POWERS,
  ...RECEIVERS,
  ...TIGHT_ENDS,
  ...RUNNING_BACKS,
  ...DEFENDERS,
];

export const characterLibrary: CharacterLibrary = {
  quarterbacks: [CHAD_POWERS],
  receivers: RECEIVERS,
  allPlayers: ALL_PLAYERS,
  coaches: [],
  
  getCharacterById: (id: string): CharacterDefinition | undefined => {
    return ALL_PLAYERS.find((player) => player.identity.id === id);
  },
  
  getPlayersByPosition: (position: PlayerPosition): CharacterDefinition[] => {
    return ALL_PLAYERS.filter((player) => player.position === position);
  },
  
  getTeamRoster: (team: Team): CharacterDefinition[] => {
    return ALL_PLAYERS.filter((player) => player.team === team);
  },
};

// ============================================
// CHARACTER CREATION UTILITIES
// ============================================

export function createRandomReceiver(
  team: Team = 'home',
  index: number = 0
): CharacterDefinition {
  const firstNames = ['Marcus', 'DeAndre', 'Tyler', 'Brandon', 'Chris', 'Mike', 'Jaylen', 'Antonio'];
  const lastNames = ['Johnson', 'Williams', 'Brown', 'Smith', 'Davis', 'Miller', 'Wilson', 'Moore'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const jerseyNumber = 10 + index + Math.floor(Math.random() * 79);
  
  const teamColors = TEAM_COLORS[team];
  const skinToneKeys = Object.keys(SKIN_TONES) as (keyof typeof SKIN_TONES)[];
  const randomSkinTone = SKIN_TONES[skinToneKeys[Math.floor(Math.random() * skinToneKeys.length)]];
  
  return {
    identity: {
      id: `receiver-random-${Date.now()}-${index}`,
      firstName,
      lastName,
      displayName: `${firstName.charAt(0)}. ${lastName.toUpperCase()}`,
    },
    role: 'player',
    position: 'WR',
    team,
    physical: {
      ...DEFAULT_PHYSICAL_BY_POSITION.WR,
      skinTone: randomSkinTone,
    },
    stats: {
      ...DEFAULT_STATS_BY_POSITION.WR,
      speed: 75 + Math.floor(Math.random() * 20),
      catching: 70 + Math.floor(Math.random() * 25),
      routeRunning: 70 + Math.floor(Math.random() * 25),
    },
    gear: createDefaultGear(teamColors.primary, teamColors.secondary, jerseyNumber, lastName, 'WR'),
    personality: {
      ...DEFAULT_PERSONALITY,
      confidence: 50 + Math.floor(Math.random() * 45),
      showmanship: 40 + Math.floor(Math.random() * 50),
    },
    lodConfig: DEFAULT_NPC_LOD,
  };
}

// Default export
export default characterLibrary;
