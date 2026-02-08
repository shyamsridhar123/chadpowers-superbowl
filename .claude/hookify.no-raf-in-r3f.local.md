---
name: no-raf-in-r3f
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: components/game/.*\.tsx?$
  - field: new_text
    operator: regex_match
    pattern: requestAnimationFrame\(
action: block
---

**BLOCKED: `requestAnimationFrame` in game component**

This project uses React Three Fiber which manages its own render loop. Using `requestAnimationFrame` directly will conflict with R3F's internal loop and cause frame timing issues.

**Use instead:**
```typescript
import { useFrame } from "@react-three/fiber"

useFrame((state, delta) => {
  // Per-frame updates here
  meshRef.current.rotation.y += delta
})
```

**Why:**
- R3F's `useFrame` is synchronized with the Three.js render loop
- `requestAnimationFrame` creates a competing animation loop
- Multiple RAF loops cause jank and wasted GPU cycles
- `useFrame` automatically handles cleanup on unmount
