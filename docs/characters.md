# Chad Powers Character Library

## Overview

This document describes the character system for the Chad Powers mobile football game. The character library provides a complete framework for defining, creating, and managing game characters with support for different positions, stats, appearance customization, and LOD (Level of Detail) for mobile performance.

## Quick Start

```typescript
import {
  CHAD_POWERS,
  RECEIVERS,
  useCharacterLibrary,
  useChadPowers,
  useCharacterColors,
  createCharacter,
} from '@/lib/characters';

// Get the main character
const chad = useChadPowers();

// Access the full library
const { receivers, getByPosition } = useCharacterLibrary();

// Get colors for rendering
const colors = useCharacterColors(chad);
```

## Character Library Structure

```
lib/characters/
├── index.ts              # Main exports
├── character-types.ts    # TypeScript interfaces
├── character-defaults.ts # Default values & presets
├── character-library.ts  # Predefined characters
├── character-builder.ts  # Character creation utilities
└── character-hooks.ts    # React hooks for components
```

---

## Predefined Characters

### Chad Powers (Hero QB)

The main playable character with elite stats:

| Attribute | Value | Rating |
|-----------|-------|--------|
| Jersey # | 7 | - |
| Arm Strength | 95 | S |
| Accuracy | 88 | A |
| Speed | 78 | B+ |
| Confidence | 95 | Elite |

### Wide Receivers

| Player | # | Archetype | Top Skill |
|--------|---|-----------|-----------|
| Marcus Swift | 11 | Speed | 98 Speed |
| Devon Chambers | 84 | Possession | 95 Catching |
| Tyrone Jackson | 18 | Red Zone | 1.98m height |
| Alex Rivera | 3 | Slot | 96 Agility |

### Tight Ends

| Player | # | Top Skills |
|--------|---|------------|
| Bradley Morrison | 87 | 85 Catching, Blocking |

### Running Backs

| Player | # | Top Skills |
|--------|---|------------|
| Jaylen Brooks | 28 | 92 Speed, 94 Acceleration |

---

## Character Anatomy

### Identity
```typescript
interface CharacterIdentity {
  id: string;           // Unique identifier
  firstName: string;
  lastName: string;
  nickname?: string;    // e.g., "The Powerhouse"
  displayName: string;  // UI display: "CHAD POWERS"
  bio?: string;         // Character backstory
  college?: string;
  homeTown?: string;
}
```

### Physical Attributes
```typescript
interface PhysicalAttributes {
  height: number;       // Game units (1 = 1 meter)
  weight: number;       // kg, affects physics
  bodyType: 'lean' | 'athletic' | 'heavy';
  skinTone: string;     // Hex color
}
```

### Athlete Stats (1-100 scale)
```typescript
interface AthleteStats {
  speed: number;        // Max running speed
  acceleration: number; // Time to top speed
  armStrength: number;  // QB throw power
  accuracy: number;     // QB throw accuracy
  agility: number;      // Direction change ability
  catching: number;     // Ball catching ability
  routeRunning: number; // Route precision
  stamina: number;      // Fatigue resistance
}
```

### Gear Configuration
```typescript
interface GearConfig {
  jersey: JerseyConfig;   // Colors, number, name
  helmet: HelmetConfig;   // Color, facemask
  pantsColor: string;
  socksColor: string;
  cleatsColor: string;
  hasGloves: boolean;
  hasEyeBlack: boolean;
  hasSleeves: boolean;
  hasArmBands: boolean;
  hasTowel: boolean;
}
```

---

## Creating Custom Characters

### Using CharacterBuilder

```typescript
import { createCharacter, TEAM_COLORS } from '@/lib/characters';

const customReceiver = createCharacter()
  .setName('John', 'Smith', 'Quick Hands')
  .setPosition('WR')
  .setTeam('home')
  .setStats({
    speed: 88,
    catching: 92,
    routeRunning: 85,
  })
  .setPersonality({
    confidence: 80,
    showmanship: 70,
  })
  .setAsNPC()
  .build();
```

### Quick Factories

```typescript
import { createQuickReceiver, createQuickQB } from '@/lib/characters';

// Quick receiver with defaults
const wr = createQuickReceiver('Mike', 'Johnson', 82, 'home');

// Quick QB with hero LOD
const qb = createQuickQB('Tom', 'Wilson', 12, 'home');
```

### Random Character Generation

```typescript
import { createRandomReceiver } from '@/lib/characters';

// Generate random receivers for practice mode
const randomReceivers = Array.from({ length: 5 }, (_, i) =>
  createRandomReceiver('home', i)
);
```

---

## React Hooks

### useCharacterLibrary
Access the full character library:

```typescript
const {
  library,
  getCharacter,      // (id) => CharacterDefinition
  getByPosition,     // (position) => CharacterDefinition[]
  getTeamPlayers,    // (team) => CharacterDefinition[]
  chadPowers,
  receivers,
  defenders,
} = useCharacterLibrary();
```

### useCharacterStats
Get computed stats and grades:

```typescript
const {
  overall,         // Number 1-100
  overallGrade,    // 'A+', 'B', etc.
  grades,          // { speed: 'A', catching: 'B+', ... }
  topStats,        // Top 3 stats
  weakStats,       // Bottom 3 stats
} = useCharacterStats(character);
```

### useCharacterColors
Extract colors for rendering:

```typescript
const colors = useCharacterColors(character);
// colors.jersey.primary, colors.skin, colors.helmet.main, etc.
```

### useCharacterLOD
Get LOD config for current quality:

```typescript
const lod = useCharacterLOD(character, 'medium');
// lod.polyCount, lod.textureSize, lod.shouldShowSecondaryMotion
```

### useReceiverPool
Get receivers for gameplay:

```typescript
const {
  receivers,
  getReceiverBySpeed,
  getReceiverByCatching,
} = useReceiverPool(3, 'home');
```

---

## Mobile Performance (LOD)

### LOD Tiers

| Tier | Poly Count | Texture | Bones | Secondary Motion |
|------|------------|---------|-------|------------------|
| High | 35K | 2048px | 65 | Yes |
| Medium | 15K | 1024px | 35 | Yes |
| Low | 5K | 512px | 22 | No |

### NPCs use reduced defaults:

| Tier | Poly Count | Texture | Bones |
|------|------------|---------|-------|
| High | 15K | 1024px | 35 |
| Medium | 8K | 512px | 25 |
| Low | 2.5K | 256px | 16 |

---

## Team Colors

```typescript
const TEAM_COLORS = {
  home: {
    primary: '#c41e3a',    // Cardinal Red
    secondary: '#1a1a2e',  // Dark Navy
    accent: '#ffd700',     // Gold
  },
  away: {
    primary: '#1e3a5f',    // Deep Blue
    secondary: '#ffffff',  // White
    accent: '#c0c0c0',     // Silver
  },
};
```

---

## Skin Tone Presets

```typescript
const SKIN_TONES = {
  light: '#f5d0c5',
  lightMedium: '#e8beac',
  medium: '#d4a574',
  mediumDark: '#a67c52',
  dark: '#8d5524',
  veryDark: '#5c3d2e',
};
```

---

## Future Integration

### Game Scene Usage

```typescript
// In GameScene.tsx
import { useChadPowers, useCharacterColors } from '@/lib/characters';

function QuarterbackModel() {
  const chad = useChadPowers();
  const colors = useCharacterColors(chad);
  
  return (
    <mesh>
      <meshStandardMaterial color={colors.jersey.primary} />
    </mesh>
  );
}
```

### Receiver Component Enhancement

```typescript
// In Receiver.tsx
import { useReceiverPool, useCharacterStats } from '@/lib/characters';

function ReceiverSystem() {
  const { receivers } = useReceiverPool(3);
  
  return receivers.map((r) => (
    <Receiver
      key={r.identity.id}
      character={r}
      stats={r.stats}
    />
  ));
}
```

---

## Stat Utilities

### Overall Rating Calculation
Weighted by position relevance:

```typescript
import { calculateOverallRating, getStatGrade } from '@/lib/characters';

const overall = calculateOverallRating(player.stats, 'WR');
const grade = getStatGrade(overall); // 'A+', 'B', etc.
```

### Character Comparison

```typescript
import { compareCharacters, getMatchupAdvantage } from '@/lib/characters';

const { winner, difference } = compareCharacters(wr1, wr2, 'speed');
const matchup = getMatchupAdvantage(receiver, cornerback);
// { advantage: 'receiver', reason: 'Speed and route-running advantage' }
```

---

## Asset Creation Pipeline

For creating 3D character assets to integrate with this library:

### Recommended Tools
- **Blender** / **ZBrush** for modeling and sculpting
- **Tripo AI** for AI-generated base models
- **Mixamo** for auto-rigging and animations
- **Ready Player Me** for avatar customization
- **Substance 3D Painter** for texturing

### Export Settings for Three.js
- Format: **glTF/GLB** with embedded animations
- Hero characters: ~20-40k tris, 2K textures
- NPC characters: ~8-15k tris, 1K textures
- Bone count: 35-65 for hero, 16-35 for NPCs

### Animation Requirements
- Idle, dropback, scramble, throw, follow-through (QB)
- Idle, stance, running, cutting, catching, celebrating (WR)
- All animations should support cross-fading

---

## Development Roadmap

1. **Phase 1** - Character types and library (Complete)
2. **Phase 2** - GLTF model integration
3. **Phase 3** - Animation system with Mixamo
4. **Phase 4** - Ready Player Me avatar support
5. **Phase 5** - Dynamic gear customization
