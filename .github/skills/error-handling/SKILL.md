# Error Handling Skill

## Overview

This skill guide covers implementing robust error handling for the Chad Powers mobile football game. The game currently has no error boundaries, fallback UI, or crash recovery - this guide establishes defensive patterns for a 3D browser game.

## Key Risk Areas

| Area | Failure Mode | Impact |
|------|-------------|--------|
| Three.js initialization | WebGPU/WebGL unavailable | Black screen |
| Physics Worker | Worker crash or message failure | Frozen gameplay |
| Asset loading | Model/texture 404 or timeout | Missing visuals |
| Touch events | Gesture recognition failure | Unresponsive controls |
| Memory | Leak over long sessions | Browser tab crash |

## React Error Boundaries

### Game-Level Error Boundary

```typescript
// components/game/GameErrorBoundary.tsx
"use client"

import { Component, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[GameError]", error.message, errorInfo.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white gap-4">
          <h2 className="text-2xl font-bold">Game Error</h2>
          <p className="text-gray-400 text-center max-w-md">
            {this.state.error?.message || "Something went wrong loading the game."}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-6 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Three.js Canvas Error Boundary

```typescript
// components/game/CanvasErrorBoundary.tsx
"use client"

import { Component, ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  isWebGLSupported: boolean
}

export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      isWebGLSupported: typeof window !== 'undefined' ? this.checkWebGL() : true,
    }
  }

  checkWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas')
      return !!(
        canvas.getContext('webgl2') || canvas.getContext('webgl')
      )
    } catch {
      return false
    }
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  render() {
    if (!this.state.isWebGLSupported) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
          <h2 className="text-xl font-bold">3D Not Supported</h2>
          <p className="text-gray-400 mt-2">
            Your browser or device doesn't support WebGL.
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Try Chrome, Safari, or Firefox on a newer device.
          </p>
        </div>
      )
    }

    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
          <h2 className="text-xl font-bold">Rendering Error</h2>
          <p className="text-gray-400 mt-2">
            The 3D engine encountered an error.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 bg-blue-600 rounded-lg"
          >
            Reload Game
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Usage in app/page.tsx

```typescript
import dynamic from "next/dynamic"
import { GameErrorBoundary } from "@/components/game/GameErrorBoundary"

const Game = dynamic(() => import("@/components/game/Game"), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

export default function Home() {
  return (
    <GameErrorBoundary>
      <Game />
    </GameErrorBoundary>
  )
}
```

## Physics Worker Error Handling

### Worker Communication Guard

```typescript
// In GameController.tsx
function createPhysicsWorker(): Worker {
  const worker = new Worker(
    URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' }))
  )

  // Handle worker errors
  worker.onerror = (event) => {
    console.error("[PhysicsWorker] Error:", event.message)
    // Attempt recovery: recreate worker
    workerRef.current?.terminate()
    workerRef.current = createPhysicsWorker()
  }

  // Handle unresponsive worker (watchdog)
  let lastResponse = Date.now()
  const watchdog = setInterval(() => {
    if (Date.now() - lastResponse > 5000) {
      console.warn("[PhysicsWorker] Unresponsive, restarting...")
      worker.terminate()
      workerRef.current = createPhysicsWorker()
      clearInterval(watchdog)
    }
  }, 2000)

  worker.onmessage = (e) => {
    lastResponse = Date.now()
    if (e.data.type === 'STATE_UPDATE') {
      setBallState(e.data.ball)
    }
  }

  // Cleanup watchdog on terminate
  const originalTerminate = worker.terminate.bind(worker)
  worker.terminate = () => {
    clearInterval(watchdog)
    originalTerminate()
  }

  return worker
}
```

### Worker-Side Error Handling

```typescript
// Inside physics worker code
self.onerror = (event) => {
  self.postMessage({
    type: 'ERROR',
    message: event.message || 'Unknown physics error',
  })
}

self.onmessage = (event) => {
  try {
    const { type, ...data } = event.data

    switch (type) {
      case 'STEP':
        stepPhysics(data.deltaTime)
        break
      case 'THROW':
        applyThrow(data.force, data.spin)
        break
      case 'RESET':
        resetPhysics()
        break
      default:
        console.warn(`[PhysicsWorker] Unknown message type: ${type}`)
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      message: error instanceof Error ? error.message : 'Physics step failed',
    })
  }
}
```

## Asset Loading Error Handling

### Graceful Degradation for Missing Assets

```typescript
// components/game/Stadium.tsx
import { useTexture } from "@react-three/drei"
import { Suspense } from "react"

function StadiumWithTextures() {
  // useTexture throws on load failure - caught by Suspense/ErrorBoundary
  const [grassTexture] = useTexture(['/textures/grass.jpg'])
  return <mesh><planeGeometry /><meshStandardMaterial map={grassTexture} /></mesh>
}

function StadiumFallback() {
  // Simple green field without textures
  return <mesh><planeGeometry args={[100, 160]} /><meshStandardMaterial color="#2d5016" /></mesh>
}

export function Stadium() {
  return (
    <Suspense fallback={<StadiumFallback />}>
      <StadiumWithTextures />
    </Suspense>
  )
}
```

## Touch Event Error Handling

### Safe Touch Handler

```typescript
function createSafeTouchHandler(
  handler: (e: TouchEvent) => void
): (e: TouchEvent) => void {
  return (e: TouchEvent) => {
    try {
      e.preventDefault()
      handler(e)
    } catch (error) {
      console.error("[TouchHandler] Error:", error)
      // Don't crash the game on touch handler errors
    }
  }
}

// Usage
const onTouchStart = createSafeTouchHandler((e) => {
  const touch = e.touches[0]
  setTouchStart({ x: touch.clientX, y: touch.clientY })
})

element.addEventListener('touchstart', onTouchStart, { passive: false })
```

## Memory Leak Prevention

### Cleanup Checklist for Game Components

```typescript
useEffect(() => {
  // 1. Create resources
  const worker = new Worker(...)
  const geometry = new THREE.BufferGeometry()
  const material = new THREE.MeshStandardMaterial()
  const texture = new THREE.TextureLoader().load(...)

  // 2. Event listeners
  const handler = (e: TouchEvent) => { ... }
  element.addEventListener('touchstart', handler, { passive: false })

  // 3. Timers
  const intervalId = setInterval(() => { ... }, 1000)

  // CLEANUP: Dispose everything
  return () => {
    worker.terminate()
    geometry.dispose()
    material.dispose()
    texture.dispose()
    element.removeEventListener('touchstart', handler)
    clearInterval(intervalId)
  }
}, [])
```

## Implementation Priority

1. **GameErrorBoundary** - Wrap the entire game, prevents white screen crashes
2. **CanvasErrorBoundary** - WebGL detection and Three.js crash recovery
3. **Worker error/watchdog** - Physics worker crash recovery
4. **Asset fallbacks** - Suspense boundaries around texture/model loads
5. **Touch handler safety** - Prevent input handler crashes from freezing game
