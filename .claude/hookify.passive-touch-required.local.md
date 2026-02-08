---
name: passive-touch-required
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: components/game/.*\.tsx?$
  - field: new_text
    operator: regex_match
    pattern: addEventListener\(\s*['"`](touchstart|touchmove|touchend)['"`]
action: warn
---

**Touch event listener must use `{ passive: false }`**

You're adding a touch event listener in a game component. ALL touch event listeners in this project MUST include `{ passive: false }` to allow `preventDefault()` and prevent scroll/zoom interference.

**Correct pattern:**
```typescript
element.addEventListener('touchstart', handler, { passive: false })
element.addEventListener('touchmove', handler, { passive: false })
element.addEventListener('touchend', handler, { passive: false })
```

**Also ensure `preventDefault()` is called:**
```typescript
const handler = (e: TouchEvent) => {
  e.preventDefault()  // Prevent scroll/zoom
  // ... handle touch
}
```

**Why:**
- Without `passive: false`, `preventDefault()` is ignored in modern browsers
- Default touch behavior causes page scrolling/zooming during gameplay
- Mobile browsers default to `passive: true` for performance
- This breaks gameplay on iOS Safari and Chrome Android
