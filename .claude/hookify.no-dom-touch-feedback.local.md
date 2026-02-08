---
name: no-dom-touch-feedback
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: components/game/(VirtualJoystick|ThrowZone|GameController)\.tsx$
  - field: new_text
    operator: regex_match
    pattern: document\.createElement|\.style\.|\.classList\.|\.appendChild|\.innerHTML|document\.getElementById
action: block
---

**BLOCKED: DOM manipulation in touch control component**

Touch feedback in game components must use canvas-based rendering, NOT DOM manipulation. DOM operations trigger layout reflow and add latency to touch input.

**Use canvas rendering instead:**
```typescript
// Canvas-based touch feedback (zero-latency)
const ctx = canvasRef.current.getContext('2d')
ctx.clearRect(0, 0, width, height)
ctx.beginPath()
ctx.arc(touchX, touchY, radius, 0, Math.PI * 2)
ctx.fill()
```

**Why:**
- DOM manipulation triggers layout reflow (adds 2-8ms latency)
- Touch input latency target is < 16ms (single frame at 60fps)
- Canvas drawing is GPU-accelerated and bypasses DOM entirely
- Existing VirtualJoystick.tsx uses this pattern correctly
