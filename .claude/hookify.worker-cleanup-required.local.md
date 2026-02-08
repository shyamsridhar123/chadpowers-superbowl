---
name: worker-cleanup-required
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: components/game/.*\.tsx?$
  - field: new_text
    operator: regex_match
    pattern: new\s+Worker\(
action: warn
---

**Web Worker creation detected - ensure cleanup on unmount**

When creating a Web Worker in a React component, you MUST terminate it in the `useEffect` cleanup function to prevent memory leaks.

**Required pattern:**
```typescript
useEffect(() => {
  const worker = new Worker(
    URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' }))
  )
  workerRef.current = worker

  worker.onmessage = (e) => {
    if (e.data.type === 'STATE_UPDATE') {
      setBallState(e.data.ball)
    }
  }

  // CRITICAL: Cleanup on unmount
  return () => {
    worker.terminate()
    workerRef.current = null
  }
}, [])
```

**Why:**
- Unterminated workers continue running after component unmount
- Each re-mount creates a new worker without killing the old one
- Workers consume CPU and memory even when not visible
- PRD requires: "No memory leaks over 30-minute continuous play session"
