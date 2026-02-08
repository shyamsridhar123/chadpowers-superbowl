# Testing Strategy Skill

## Overview

This skill guide covers setting up and implementing a testing strategy for the Chad Powers mobile football game. The game has zero test coverage currently - this guide establishes the foundation.

## Recommended Stack

| Tool | Purpose | Why |
|------|---------|-----|
| **Vitest** | Unit & integration tests | Fast, native ESM, works with Next.js |
| **React Testing Library** | Component tests | Tests behavior not implementation |
| **Playwright** | E2E / mobile simulation | Real browser testing, mobile viewports |
| **@testing-library/react-three** | R3F component tests | Three.js component testing |

## Installation

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
```

## Configuration

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**', 'components/game/**'],
      exclude: ['**/*.d.ts', '**/node_modules/**'],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

### tests/setup.ts

```typescript
import '@testing-library/jest-dom'

// Mock Web Worker
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  postMessage(data: unknown) {
    // Simulate worker response
    if (data && typeof data === 'object' && 'type' in data) {
      const msg = data as { type: string }
      if (msg.type === 'STEP') {
        setTimeout(() => {
          this.onmessage?.({
            data: { type: 'STATE_UPDATE', ball: { position: [0, 1, 0], velocity: [0, 0, 0] } }
          } as MessageEvent)
        }, 0)
      }
    }
  }
  terminate() {}
}

// @ts-expect-error Mock Worker
global.Worker = MockWorker

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock')
global.URL.revokeObjectURL = vi.fn()

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(() => true),
  writable: true,
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
```

## Test Organization

```
tests/
  setup.ts                    → Global test setup and mocks
  unit/
    game-store.test.ts        → Zustand store logic
    physics-worker.test.ts    → Physics calculations (pure functions)
    throw-mechanics.test.ts   → Impulse/trajectory math
  integration/
    game-controller.test.tsx  → GameController with mocked worker
    game-flow.test.tsx        → Menu → Practice → Score flow
  e2e/
    mobile-gameplay.spec.ts   → Playwright mobile viewport tests
    touch-controls.spec.ts    → Touch event simulation
    performance.spec.ts       → FPS and memory benchmarks
```

## Unit Test Examples

### Testing the Zustand Store

```typescript
// tests/unit/game-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '@/lib/game-store'

describe('GameStore', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState())
  })

  it('starts in menu mode', () => {
    expect(useGameStore.getState().mode).toBe('menu')
  })

  it('tracks score on successful throw', () => {
    const store = useGameStore.getState()
    store.startGame()
    store.recordThrow(true, 200)

    const state = useGameStore.getState()
    expect(state.score).toBe(200)
    expect(state.throws).toBe(1)
    expect(state.completions).toBe(1)
  })

  it('increments throws on miss without adding score', () => {
    const store = useGameStore.getState()
    store.startGame()
    store.recordThrow(false, 0)

    const state = useGameStore.getState()
    expect(state.score).toBe(0)
    expect(state.throws).toBe(1)
    expect(state.completions).toBe(0)
  })

  it('switches modes correctly', () => {
    useGameStore.getState().setMode('practice')
    expect(useGameStore.getState().mode).toBe('practice')

    useGameStore.getState().setMode('challenge')
    expect(useGameStore.getState().mode).toBe('challenge')
  })
})
```

### Testing Physics Calculations

```typescript
// tests/unit/throw-mechanics.test.ts
import { describe, it, expect } from 'vitest'

// Extract pure functions from physics worker for testing
function calculateThrowImpulse(
  swipeAngle: number,
  swipePower: number
): { force: [number, number, number]; spin: [number, number, number] } {
  const BALL_SPEED = 32
  const power = Math.min(swipePower, 1) * BALL_SPEED

  const force: [number, number, number] = [
    Math.sin(swipeAngle) * power,
    power * 0.4 + 5, // arc + minimum height
    -Math.cos(swipeAngle) * power,
  ]

  const spin: [number, number, number] = [
    swipeAngle * 15,
    0,
    swipePower * 10,
  ]

  return { force, spin }
}

describe('Throw Mechanics', () => {
  it('produces forward force for straight throw', () => {
    const { force } = calculateThrowImpulse(0, 0.5)
    expect(force[2]).toBeLessThan(0) // Negative Z = forward
    expect(Math.abs(force[0])).toBeLessThan(0.001) // Minimal lateral
  })

  it('clamps power to maximum', () => {
    const { force: normal } = calculateThrowImpulse(0, 1.0)
    const { force: over } = calculateThrowImpulse(0, 2.0)
    expect(force_magnitude(normal)).toBeCloseTo(force_magnitude(over), 1)
  })

  it('applies vertical arc component', () => {
    const { force } = calculateThrowImpulse(0, 0.5)
    expect(force[1]).toBeGreaterThan(0) // Upward
  })

  it('adds spin proportional to power', () => {
    const low = calculateThrowImpulse(0, 0.2)
    const high = calculateThrowImpulse(0, 0.8)
    expect(Math.abs(high.spin[2])).toBeGreaterThan(Math.abs(low.spin[2]))
  })
})

function force_magnitude(f: [number, number, number]): number {
  return Math.sqrt(f[0] ** 2 + f[1] ** 2 + f[2] ** 2)
}
```

## E2E Test Examples

### Playwright Mobile Gameplay

```typescript
// tests/e2e/mobile-gameplay.spec.ts
import { test, expect } from '@playwright/test'

test.use({
  viewport: { width: 390, height: 844 }, // iPhone 14
  hasTouch: true,
  isMobile: true,
})

test('game loads and shows main menu', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('CHAD POWERS')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('PRACTICE')).toBeVisible()
  await expect(page.getByText('CHALLENGE')).toBeVisible()
})

test('practice mode loads with targets', async ({ page }) => {
  await page.goto('/')
  await page.getByText('PRACTICE').click()

  // Wait for 3D scene to initialize
  await page.waitForTimeout(2000)

  // Canvas should be present
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
})

test('no console errors during gameplay', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await page.goto('/')
  await page.getByText('PRACTICE').click()
  await page.waitForTimeout(5000)

  expect(errors).toHaveLength(0)
})
```

### Performance Benchmarks

```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test'

test('maintains 30+ FPS on practice mode', async ({ page }) => {
  await page.goto('/')
  await page.getByText('PRACTICE').click()
  await page.waitForTimeout(2000)

  const fps = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let frames = 0
      const start = performance.now()

      function count() {
        frames++
        if (performance.now() - start < 3000) {
          requestAnimationFrame(count)
        } else {
          resolve(frames / 3)
        }
      }
      requestAnimationFrame(count)
    })
  })

  expect(fps).toBeGreaterThanOrEqual(30)
})

test('memory stays under 150MB', async ({ page }) => {
  await page.goto('/')
  await page.getByText('PRACTICE').click()
  await page.waitForTimeout(5000)

  const memory = await page.evaluate(() => {
    // @ts-expect-error Chrome-specific API
    return performance.memory?.usedJSHeapSize / (1024 * 1024)
  })

  if (memory !== undefined) {
    expect(memory).toBeLessThan(150)
  }
})
```

## Package.json Scripts Addition

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

## Priority Order

1. **Zustand store tests** - Pure logic, easy to test, high value
2. **Physics calculation tests** - Critical game mechanics, determinism validation
3. **E2E game load tests** - Verify the game actually works in a browser
4. **Touch control integration tests** - Core gameplay input validation
5. **Performance benchmarks** - Regression prevention for FPS/memory
