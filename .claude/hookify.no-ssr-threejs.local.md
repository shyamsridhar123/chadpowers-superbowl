---
name: no-ssr-threejs
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: app/.*\.(tsx?|jsx?)$
  - field: new_text
    operator: regex_match
    pattern: import\s+.*from\s+['"`](three|@react-three/fiber|@react-three/drei)['"`]
action: block
---

**BLOCKED: Direct Three.js import in app/ directory**

Three.js and React Three Fiber cannot be imported directly in Next.js app/ files because they use browser APIs (`window`, `document`, `WebGL`) that don't exist during server-side rendering.

**Use dynamic import with `ssr: false`:**
```typescript
import dynamic from "next/dynamic"

const Game = dynamic(() => import("@/components/game/Game"), {
  ssr: false,
  loading: () => <div>Loading...</div>
})
```

**Why:**
- Three.js accesses `window` and `document` at import time
- Next.js pre-renders pages on the server where these don't exist
- `ssr: false` skips server rendering for the component
- All Three.js code must live in `components/game/` with `"use client"`
