---
name: no-physics-in-zustand
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: lib/game-store\.ts$
  - field: new_text
    operator: regex_match
    pattern: ballPosition|ballVelocity|ballRotation|ballState|physicsState|angularVelocity|linearVelocity
action: warn
---

**High-frequency physics state should NOT go in Zustand**

You're adding physics-related state (`ballPosition`, `ballVelocity`, `ballRotation`, etc.) to the Zustand store. Physics state updates at 60Hz and will cause excessive React re-renders across all subscribed components.

**Keep physics state local in GameController:**
```typescript
// In GameController.tsx (local state)
const [ballState, setBallState] = useState<PhysicsState["ball"]>()
const workerRef = useRef<Worker | null>(null)
```

**Zustand is for infrequent global state only:**
- `score`, `mode`, `throws`, `completions`
- `targets`, `receivers`, `defenders`
- `playStatus`, `multipliers`

**Why:**
- Physics updates 60x/sec - Zustand re-renders all subscribers each time
- Local state in GameController only re-renders the game subtree
- useRef for values that don't need re-renders at all
