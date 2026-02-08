# CLAUDE.md - Chad Powers Mobile Football Game

## Project Overview

Mobile-first 3D football game built with Next.js 16, React Three Fiber, Three.js, and Zustand. Targets 60fps on mid-range mobile devices with WebGPU/WebGL rendering and off-main-thread physics via Web Workers.

## Quick Start

```bash
pnpm dev        # Dev server at localhost:3000
pnpm build      # Production build (includes TypeScript checking)
pnpm lint       # ESLint check
pnpm start      # Production server
```

## Architecture

```
app/page.tsx              → Entry point (dynamic import, ssr: false)
components/game/
  Game.tsx                → Mode router (menu vs gameplay)
  GameController.tsx      → Core orchestrator (physics worker, input, state)
  GameScene.tsx           → Three.js Canvas with R3F components
  VirtualJoystick.tsx     → Left-zone movement (canvas-based, not DOM)
  ThrowZone.tsx           → Right-zone power meter with haptic feedback
  Stadium.tsx             → Field geometry with canvas texture
  Quarterback.tsx         → QB 3D model
  Football3D.tsx          → Ball with spiral rotation
  Receiver.tsx            → Receiver routes and catching
  Defender.tsx            → Defender AI logic
  Target.tsx              → Practice mode targets
  TrajectoryPreview.tsx   → Throw arc visualization
  GameHUD.tsx             → Score, stats, achievements overlay
  MainMenu.tsx            → Landing screen
  FootballPlayer.tsx      → Generic player model
lib/
  game-store.ts           → Zustand store (global game state)
  game-types.ts           → TypeScript interfaces
  physics-worker.ts       → Physics simulation reference
  utils.ts                → Utility functions (cn/clsx)
```

## Critical Rules

### MUST DO

- Use `"use client"` directive on ALL game components
- Dynamically import Three.js components with `ssr: false` (see app/page.tsx pattern)
- Use `useFrame` from R3F for per-frame updates, NEVER `requestAnimationFrame`
- Use `{ passive: false }` on ALL touch event listeners
- Call `preventDefault()` on touch events to prevent scroll/zoom
- Use `useCallback` and `useRef` for touch handlers to avoid re-renders
- Keep physics calculations in the Web Worker, not main thread
- Use tuple arrays `[x, y, z]` for positions, `[x, y, z, w]` for quaternions
- Use R3F primitives (`<mesh>`, `<group>`) over imperative Three.js

### MUST NOT

- Put high-frequency physics state in Zustand (keep local in GameController)
- Use DOM elements for touch feedback (use canvas rendering)
- Use `useEffect` for animation loops (use `useFrame`)
- Import Three.js at module level in SSR-capable files
- Use `requestAnimationFrame` directly (R3F manages the render loop)
- Manipulate DOM for visual feedback during gameplay

### State Management Pattern

```typescript
// Global state (Zustand) - infrequent updates
const { score, mode, recordThrow } = useGameStore()

// Local state (useState/useRef) - high-frequency updates
const [ballState, setBallState] = useState<PhysicsState["ball"]>()
const workerRef = useRef<Worker | null>(null)
```

### Physics Worker Communication

```typescript
// Send to worker
worker.postMessage({ type: 'THROW', force: [fx, fy, fz], spin: [sx, sy, sz] })
worker.postMessage({ type: 'STEP', deltaTime: 16.67 })
worker.postMessage({ type: 'RESET' })

// Receive from worker
worker.onmessage = (e) => {
  if (e.data.type === 'STATE_UPDATE') setBallState(e.data.ball)
}
```

### Touch Zone Layout

- **Left 50%**: Virtual joystick (120px radius) for QB movement
- **Right 50%**: Throw zone (hold-to-charge, swipe-to-throw)
- Haptic feedback via `navigator.vibrate([10])` on supported devices

## Game Modes

| Mode | Description |
|------|-------------|
| `menu` | Landing screen with mode selection |
| `practice` | Stationary targets at 10/20/30/40 yards |
| `challenge` | Timed sequences, receivers running routes, defender AI |
| `replay` | Instant replay (planned, not yet implemented) |

## Performance Targets

| Device Tier | Target FPS | Memory |
|-------------|------------|--------|
| Flagship | 60 fps | 80 MB |
| Mid-range | 45 fps | 80 MB |
| Budget | 30 fps | 100 MB |

Touch input latency must be < 16ms (single frame at 60fps).

## Physics Constants

```
Ball radius: 0.143m (regulation NFL)
Ball mass: 0.41kg
Gravity: -9.81 m/s²
Ball speed: 32 units/sec max
Air resistance: 0.08 (linear damping)
Angular damping: 0.15
Release height: 1.8m
Ground Y: 0.143 (ball radius)
```

## Import Patterns

```typescript
// Path aliases
import { useGameStore } from "@/lib/game-store"
import { GameState } from "@/lib/game-types"

// R3F imports
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Text } from "@react-three/drei"

// Dynamic imports for Three.js (SSR bypass)
const Game = dynamic(() => import("@/components/game/Game"), {
  ssr: false,
  loading: () => <LoadingScreen />
})
```

## Agent Routing

When working on domain-specific tasks, reference the appropriate skill guide:

| Domain | Skill Guide |
|--------|-------------|
| Physics/collisions/throws | `.github/skills/rapier-physics-worker/SKILL.md` + `.github/skills/football-throw-mechanics/SKILL.md` |
| Rendering/WebGPU/shaders | `.github/skills/threejs-webgpu-rendering/SKILL.md` |
| Touch/gestures/haptics | `.github/skills/mobile-touch-controls/SKILL.md` |
| Replays/cameras/animation | `.github/skills/theatrejs-cinematics/SKILL.md` |
| FPS/memory/battery | `.github/skills/game-performance-optimization/SKILL.md` |
| Testing/QA | `.github/skills/testing-strategy/SKILL.md` |
| Error handling | `.github/skills/error-handling/SKILL.md` |

## Known Gaps

- No testing framework installed (no Jest, Vitest, or Playwright)
- No error boundaries around Three.js components
- Replay mode UI exists but implementation is incomplete
- No persistent state (high scores not saved)
- No audio system
- Physics worker cleanup on unmount needs verification
