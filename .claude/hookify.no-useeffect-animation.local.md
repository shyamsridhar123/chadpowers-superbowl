---
name: no-useeffect-animation
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: components/game/.*\.tsx?$
  - field: new_text
    operator: regex_match
    pattern: useEffect\([^)]*(?:requestAnimationFrame|setInterval|setTimeout.*loop|animate\(\))
action: block
---

**BLOCKED: Animation loop inside `useEffect` in game component**

Do not use `useEffect` with `requestAnimationFrame`, `setInterval`, or recursive animation functions in game components. React Three Fiber provides `useFrame` for this purpose.

**Use `useFrame` instead:**
```typescript
import { useFrame } from "@react-three/fiber"

// Correct: R3F-managed frame loop
useFrame((state, delta) => {
  ref.current.position.x += speed * delta
  ref.current.rotation.y += spin * delta
})
```

**Why:**
- `useEffect` animation loops compete with R3F's render cycle
- `useFrame` is synchronized with Three.js rendering
- `useFrame` automatically cleans up on unmount (no memory leaks)
- `useEffect` cleanup for RAF is error-prone (missed cancellation)
