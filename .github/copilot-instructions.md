# Chad Powers Mobile Football Game - Copilot Instructions

## Project Overview

A mobile-first 3D football game built with Next.js, React Three Fiber, and Zustand. Targets 60fps on mid-range mobile devices with WebGPU/WebGL rendering and off-main-thread physics.

## Architecture

```
app/page.tsx              → Entry point (dynamic import for SSR bypass)
components/game/
  Game.tsx                → Mode router (menu vs gameplay)
  GameController.tsx      → Core orchestrator (physics worker, input, state)
  GameScene.tsx           → Three.js Canvas with R3F components
  VirtualJoystick.tsx     → Left-zone movement (canvas-based, not DOM)
  ThrowZone.tsx           → Right-zone power meter with haptic feedback
lib/
  game-store.ts           → Zustand store for global game state
  game-types.ts           → TypeScript interfaces (PhysicsState, ThrowData, etc.)
  physics-worker.ts       → Reference implementation (inline in GameController)
```

**Critical Pattern**: Physics runs in a Web Worker created inline in `GameController.tsx`. Messages use `STEP`, `THROW`, `RESET` types. State updates at 60Hz fixed timestep.

## Developer Commands

```bash
pnpm dev        # Start dev server (localhost:3000)
pnpm build      # Production build
pnpm lint       # ESLint check
```

## Key Conventions

### Component Patterns
- All game components use `"use client"` directive
- Three.js components must be dynamically imported with `ssr: false` (see `app/page.tsx`)
- Use `useFrame` hook from R3F for per-frame updates, not `requestAnimationFrame`
- Touch handlers must use `{ passive: false }` to prevent scroll interference

### State Management
- Global game state via Zustand in `lib/game-store.ts`
- Physics state kept local in `GameController` (not in Zustand - too frequent)
- Use tuple arrays `[x, y, z]` for positions, `[x, y, z, w]` for quaternions

### Physics Worker Communication
```typescript
// Send to worker
worker.postMessage({ type: 'THROW', force: [fx, fy, fz], spin: [sx, sy, sz] });

// Receive from worker
worker.onmessage = (e) => { 
  if (e.data.type === 'STATE_UPDATE') setBallState(e.data.ball);
};
```

### Mobile Touch Zones
- **Left 50%**: Virtual joystick (120px) for QB movement
- **Right 50%**: Throw zone (hold-to-charge, release-to-throw)
- Haptic feedback via `navigator.vibrate([10])` on supported devices

### 3D Scene Structure
Scene hierarchy in `GameScene.tsx`:
- `Stadium` → Field geometry, yard lines, end zones
- `Quarterback` → Player model at `playerPosition`
- `Football3D` → Ball with quaternion rotation and glow when active
- `Target` → Hit detection circles at 10/20/30/40 yards
- `TrajectoryPreview` → Dashed arc showing throw path

## Performance Targets (from PRD)
| Device Tier | Target FPS | Memory |
|-------------|------------|--------|
| Flagship    | 60 fps     | 80 MB  |
| Mid-range   | 45 fps     | 80 MB  |
| Budget      | 30 fps     | 100 MB |

## Agent Orchestration (REQUIRED)

**This project uses specialized agents. Route tasks to the correct agent based on domain.**

### Agent Routing Table

| Domain Keywords | Agent | Files Owned |
|-----------------|-------|-------------|
| physics, rapier, collision, ball, throw, impulse, trajectory | `PhysicsEngineer` | `lib/physics-worker.ts`, `GameController.tsx` physics logic |
| render, webgpu, three.js, fps, graphics, shader, LOD, shadows | `GraphicsEngineer` | `GameScene.tsx`, `Stadium.tsx`, `Football3D.tsx` |
| touch, swipe, joystick, gesture, controls, haptic, mobile | `UXEngineer` | `VirtualJoystick.tsx`, `ThrowZone.tsx` |
| replay, camera, cinematic, animation, cutscene, theatre.js | `CinematicsEngineer` | Future replay system |
| fps, memory, battery, thermal, adaptive quality, profiling | `PerformanceMonitor` | Performance monitoring, quality tiers |
| keyboard, mouse, aria, screen reader, colorblind, accessibility | `AccessibilityEngineer` | Inclusive design, alt controls |
| test, bug, qa, playwright, benchmark, validate | `QAEngineer` | Test files, performance validation |
| full feature, multi-system, unclear domain | `GameDeveloper` | Cross-cutting implementation |

### Orchestration Rules

1. **Always use `@ChadPowersDirector`** for complex multi-system features - it coordinates specialists
2. **Match keywords to agents** - If user mentions "physics" or "throw mechanics", invoke `PhysicsEngineer`
3. **Use skills before implementing** - Each agent has skills in `.github/skills/` with implementation guides
4. **Hand off cross-domain work** - Agents can hand off to each other (e.g., UX → Physics for swipe-to-impulse)

### Invoking Agents

```
@PhysicsEngineer implement ball spin mechanics
@UXEngineer fix joystick dead zone
@GraphicsEngineer optimize shadow rendering for mobile
@ChadPowersDirector add instant replay feature (multi-system)
```

### Skills Reference

Load skills from `.github/skills/` before implementing:
- `rapier-physics-worker` - Web Worker physics setup
- `football-throw-mechanics` - Impulse calculation, trajectory
- `mobile-touch-controls` - Joystick, swipe detection
- `threejs-webgpu-rendering` - Renderer config, LOD
- `game-performance-optimization` - FPS monitoring, adaptive quality
- `theatrejs-cinematics` - Replay timeline, camera animation
- `testing-strategy` - Vitest + Playwright test setup
- `error-handling` - Error boundaries, worker recovery
- `state-persistence` - localStorage, IndexedDB, PWA

## Do's and Don'ts

✅ **Do**:
- Use R3F primitives (`<mesh>`, `<group>`) over imperative Three.js
- Keep physics calculations in the worker, not main thread
- Use `useCallback` and `useRef` for touch handlers to avoid re-renders
- Reference `docs/PRD_TRD.md` for physics formulas and specs

❌ **Don't**:
- Manipulate DOM for touch feedback (use canvas)
- Put high-frequency physics state in Zustand
- Use `useEffect` for animation loops (use `useFrame`)
- Forget `preventDefault()` on touch events (causes scroll/zoom)
