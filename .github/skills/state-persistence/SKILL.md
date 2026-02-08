# State Persistence Skill

## Overview

This skill guide covers implementing persistent game state for the Chad Powers mobile football game. Currently, all state is lost on page reload - this guide adds high score saving, settings persistence, and offline capability.

## Storage Strategy

| Data | Storage | Why |
|------|---------|-----|
| High scores | localStorage | Small, synchronous, no expiry |
| Player settings | localStorage | Quick read on startup |
| Game replays | IndexedDB | Large binary data (positions over time) |
| Offline assets | Service Worker Cache | PWA support, instant reload |

## LocalStorage for Scores & Settings

### Persistent Store Hook

```typescript
// lib/use-persisted-state.ts
import { useEffect, useState } from "react"

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // Storage full or unavailable - fail silently
    }
  }, [key, state])

  return [state, setState]
}
```

### Zustand Persist Middleware

```typescript
// lib/game-store.ts (enhanced with persistence)
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface PersistedState {
  highScore: number
  totalThrows: number
  totalCompletions: number
  bestStreak: number
  achievements: string[]
  settings: {
    hapticEnabled: boolean
    soundEnabled: boolean
    qualityTier: 'auto' | 'high' | 'medium' | 'low'
    showTrajectory: boolean
  }
}

interface GameState extends PersistedState {
  // Transient state (not persisted)
  mode: 'menu' | 'practice' | 'challenge' | 'replay'
  score: number
  throws: number
  completions: number
  // ... rest of game state
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Persisted defaults
      highScore: 0,
      totalThrows: 0,
      totalCompletions: 0,
      bestStreak: 0,
      achievements: [],
      settings: {
        hapticEnabled: true,
        soundEnabled: true,
        qualityTier: 'auto',
        showTrajectory: true,
      },

      // Transient defaults
      mode: 'menu',
      score: 0,
      throws: 0,
      completions: 0,

      // Actions
      recordThrow: (hit: boolean, points: number) => {
        const state = get()
        const newScore = state.score + points
        const newThrows = state.throws + 1
        const newCompletions = state.completions + (hit ? 1 : 0)

        set({
          score: newScore,
          throws: newThrows,
          completions: newCompletions,
          totalThrows: state.totalThrows + 1,
          totalCompletions: state.totalCompletions + (hit ? 1 : 0),
          highScore: Math.max(state.highScore, newScore),
        })
      },

      updateSettings: (partial: Partial<GameState['settings']>) => {
        set((state) => ({
          settings: { ...state.settings, ...partial },
        }))
      },
    }),
    {
      name: 'chad-powers-game',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        highScore: state.highScore,
        totalThrows: state.totalThrows,
        totalCompletions: state.totalCompletions,
        bestStreak: state.bestStreak,
        achievements: state.achievements,
        settings: state.settings,
      }),
    }
  )
)
```

## IndexedDB for Replay Data

### Replay Storage

```typescript
// lib/replay-store.ts

interface ReplayFrame {
  timestamp: number
  ballPosition: [number, number, number]
  ballRotation: [number, number, number, number]
  playerPosition: [number, number, number]
  receiverPositions: Map<string, [number, number, number]>
}

interface ReplayData {
  id: string
  date: number
  mode: string
  score: number
  frames: ReplayFrame[]
  duration: number
}

const DB_NAME = 'chad-powers-replays'
const STORE_NAME = 'replays'
const DB_VERSION = 1
const MAX_REPLAYS = 20

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('date', 'date', { unique: false })
        store.createIndex('score', 'score', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveReplay(replay: ReplayData): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  store.put(replay)

  // Evict oldest replays beyond MAX_REPLAYS
  const countReq = store.count()
  countReq.onsuccess = () => {
    if (countReq.result > MAX_REPLAYS) {
      const dateIndex = store.index('date')
      const cursor = dateIndex.openCursor()
      let toDelete = countReq.result - MAX_REPLAYS

      cursor.onsuccess = () => {
        if (cursor.result && toDelete > 0) {
          cursor.result.delete()
          toDelete--
          cursor.result.continue()
        }
      }
    }
  }
}

export async function getReplay(id: string): Promise<ReplayData | null> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)

  return new Promise((resolve) => {
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => resolve(null)
  })
}

export async function listReplays(): Promise<ReplayData[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const index = store.index('date')

  return new Promise((resolve) => {
    const request = index.getAll()
    request.onsuccess = () => resolve(request.result.reverse())
    request.onerror = () => resolve([])
  })
}
```

## Service Worker for Offline Support

### next.config.mjs Update

For PWA support with `next-pwa`:

```bash
pnpm add next-pwa
```

```javascript
// next.config.mjs
import withPWA from 'next-pwa'

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})({
  images: { unoptimized: true },
})

export default config
```

### PWA Manifest (public/manifest.json)

```json
{
  "name": "Chad Powers Football",
  "short_name": "Chad Powers",
  "description": "Mobile 3D football game",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "portrait",
  "theme_color": "#000000",
  "background_color": "#000000",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## Implementation Priority

1. **Zustand persist middleware** - High scores and settings survive reload
2. **High score display** - Show personal best on main menu
3. **Settings persistence** - Remember quality tier, haptic preference
4. **Replay storage** - Save best plays for later viewing
5. **Service Worker** - Full offline PWA support
