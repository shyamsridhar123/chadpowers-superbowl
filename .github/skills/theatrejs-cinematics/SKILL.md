---
name: theatrejs-cinematics
description: Guide for implementing Theatre.js animation timeline and instant replay system. Use this when working with cutscenes, instant replays, cinematic camera animations, or timeline-based animations.
---

# Theatre.js Cinematics and Replay System

This skill provides guidance for implementing Theatre.js for cinematic animations, instant replays, and timeline-based camera movements in browser games.

## Technology Stack
- **Theatre.js @theatre/core** - Animation engine
- **Theatre.js @theatre/r3f** - React Three Fiber integration
- **Theatre.js @theatre/studio** - Visual editor (development only)

## Installation

```bash
npm install @theatre/core @theatre/r3f @theatre/studio
```

## Basic Setup

```typescript
import { getProject } from '@theatre/core';
import studio from '@theatre/studio';

// Initialize studio in development
if (process.env.NODE_ENV === 'development') {
  studio.initialize();
}

// Create a project and sheet
const project = getProject('ChadPowersGame');
const sheet = project.sheet('ThrowReplay');
```

## React Three Fiber Integration

```tsx
import { Canvas } from '@react-three/fiber';
import { SheetProvider, editable as e, PerspectiveCamera } from '@theatre/r3f';
import { getProject } from '@theatre/core';

const project = getProject('ChadPowersGame');
const sheet = project.sheet('Scene');

function App() {
  return (
    <Canvas>
      <SheetProvider sheet={sheet}>
        <PerspectiveCamera
          theatreKey="Camera"
          makeDefault
          position={[0, 5, 10]}
          fov={75}
        />
        <e.mesh theatreKey="Ball">
          <sphereGeometry args={[0.143, 32, 32]} />
          <meshStandardMaterial color="brown" />
        </e.mesh>
      </SheetProvider>
    </Canvas>
  );
}
```

## Cinematic Camera System

### Define Camera Animation Objects

```typescript
import { types } from '@theatre/core';

const project = getProject('ChadPowersReplays');
const sheet = project.sheet('ThrowReplay');

// Define animated camera properties
const cameraObj = sheet.object('Camera', {
  position: types.compound({
    x: types.number(0, { range: [-50, 50] }),
    y: types.number(5, { range: [0, 20] }),
    z: types.number(10, { range: [-50, 50] })
  }),
  lookAt: types.compound({
    x: types.number(0, { range: [-50, 50] }),
    y: types.number(1, { range: [0, 10] }),
    z: types.number(-20, { range: [-100, 0] })
  }),
  fov: types.number(75, { range: [30, 120] })
});

// Apply values to Three.js camera
cameraObj.onValuesChange((values) => {
  camera.position.set(values.position.x, values.position.y, values.position.z);
  camera.lookAt(values.lookAt.x, values.lookAt.y, values.lookAt.z);
  camera.fov = values.fov;
  camera.updateProjectionMatrix();
});
```

## Instant Replay System

### Recording Gameplay State

Record physics state at 20Hz during gameplay for replay:

```typescript
interface ReplayFrame {
  timestamp: number;
  ball: {
    position: [number, number, number];
    rotation: [number, number, number, number];
    velocity: [number, number, number];
  };
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
}

class ReplayRecorder {
  private frames: ReplayFrame[] = [];
  private maxDuration = 5000; // 5 seconds
  private recordInterval = 50; // 20Hz
  private lastRecordTime = 0;

  record(state: GameState, timestamp: number) {
    if (timestamp - this.lastRecordTime < this.recordInterval) return;
    
    this.frames.push({
      timestamp,
      ball: {
        position: [...state.ball.position],
        rotation: [...state.ball.rotation],
        velocity: [...state.ball.velocity]
      },
      camera: {
        position: [...state.camera.position],
        target: [...state.camera.target]
      }
    });

    // Keep only last 5 seconds
    const cutoff = timestamp - this.maxDuration;
    this.frames = this.frames.filter(f => f.timestamp > cutoff);
    
    this.lastRecordTime = timestamp;
  }

  getFrames(): ReplayFrame[] {
    return [...this.frames];
  }
}
```

### Playing Back Replays with Theatre.js

```typescript
async function playReplay(frames: ReplayFrame[], playbackSpeed: number = 0.25) {
  const project = getProject('ChadPowersReplays');
  const replaySheet = project.sheet('InstantReplay');
  
  // Create ball object for replay
  const ballObj = replaySheet.object('Ball', {
    position: types.compound({
      x: types.number(0),
      y: types.number(0),
      z: types.number(0)
    }),
    rotation: types.compound({
      x: types.number(0),
      y: types.number(0),
      z: types.number(0),
      w: types.number(1)
    })
  });

  // Create cinematic camera for replay
  const replayCameraObj = replaySheet.object('ReplayCamera', {
    position: types.compound({
      x: types.number(5),
      y: types.number(3),
      z: types.number(5)
    }),
    lookAt: types.compound({
      x: types.number(0),
      y: types.number(1),
      z: types.number(-10)
    })
  });

  // Apply values during playback
  ballObj.onValuesChange((values) => {
    ballMesh.position.set(values.position.x, values.position.y, values.position.z);
    ballMesh.quaternion.set(
      values.rotation.x,
      values.rotation.y,
      values.rotation.z,
      values.rotation.w
    );
  });

  // Play the sequence
  const sequence = replaySheet.sequence;
  await sequence.play({
    iterationCount: 1,
    range: [0, 3], // 3 second replay
    rate: playbackSpeed,
    direction: 'normal'
  });
}
```

## Cinematic Camera Paths

### Pre-defined Camera Angles

```typescript
const CAMERA_ANGLES = {
  behindQB: {
    position: { x: 0, y: 3, z: 5 },
    lookAt: { x: 0, y: 1, z: -20 },
    fov: 60
  },
  sideView: {
    position: { x: 15, y: 2, z: -10 },
    lookAt: { x: 0, y: 1, z: -20 },
    fov: 50
  },
  endZone: {
    position: { x: 0, y: 5, z: -45 },
    lookAt: { x: 0, y: 1, z: 0 },
    fov: 70
  },
  aerial: {
    position: { x: 0, y: 30, z: -20 },
    lookAt: { x: 0, y: 0, z: -20 },
    fov: 45
  }
};

function transitionToAngle(
  angleName: keyof typeof CAMERA_ANGLES, 
  duration: number = 1
) {
  const angle = CAMERA_ANGLES[angleName];
  
  // Use Theatre.js sequence for smooth transition
  const cameraSheet = project.sheet('CameraTransition');
  cameraSheet.sequence.play({
    iterationCount: 1,
    range: [0, duration]
  });
}
```

## Slow Motion Effects

```typescript
async function playSlowMotionReplay(
  startTime: number,
  endTime: number,
  speed: number = 0.25
) {
  const sheet = project.sheet('SlowMoReplay');
  
  await sheet.sequence.play({
    iterationCount: 1,
    range: [startTime, endTime],
    rate: speed, // 0.25 = quarter speed
    direction: 'normal'
  });
}

// Reverse slow motion
async function playReverseSlowMo(startTime: number, endTime: number) {
  const sheet = project.sheet('SlowMoReplay');
  
  await sheet.sequence.play({
    iterationCount: 1,
    range: [startTime, endTime],
    rate: 0.25,
    direction: 'reverse'
  });
}
```

## Sequence Control API

```typescript
const sequence = sheet.sequence;

// Play with options
await sequence.play({
  iterationCount: 1,        // Number of times to play
  range: [0, 3],           // Start and end time in seconds
  rate: 1,                  // Playback speed (0.5 = half speed)
  direction: 'normal'       // 'normal' | 'reverse' | 'alternate'
});

// Pause playback
sequence.pause();

// Jump to position
sequence.position = 1.5; // Jump to 1.5 seconds

// Check if playing
if (sequence.playing) {
  // Currently playing
}

// Get current position
const currentTime = sequence.position;
```

## Attaching Audio to Sequences

```typescript
// Attach audio for synchronized playback
await sheet.sequence.attachAudio({
  source: '/audio/crowd-cheer.mp3'
});

// With custom audio context
const audioContext = new AudioContext();
const audioBuffer = await loadAudioBuffer('/audio/commentary.mp3');

await sheet.sequence.attachAudio({
  source: audioBuffer,
  audioContext,
  destinationNode: audioContext.destination
});
```

## Studio Mode for Development

```typescript
// Only import studio in development
if (process.env.NODE_ENV === 'development') {
  import('@theatre/studio').then((studioModule) => {
    studioModule.default.initialize();
    
    // Optional: Add R3F extension for 3D editing
    import('@theatre/r3f/dist/extension').then((extensionModule) => {
      studioModule.default.extend(extensionModule.default);
    });
  });
}
```

## Exporting Animation State

```typescript
// Export the project state for production
const state = project.exportState();
localStorage.setItem('theatreState', JSON.stringify(state));

// Load saved state
const savedState = localStorage.getItem('theatreState');
if (savedState) {
  const project = getProject('ChadPowersGame', {
    state: JSON.parse(savedState)
  });
}
```

## Performance Tips

1. **Use RAF Drivers** for custom frame rates
2. **Batch value changes** to minimize updates
3. **Dispose sheets** when not needed
4. **Use static state** in production (no studio)

```typescript
import { createRafDriver } from '@theatre/core';

// Custom RAF driver for 30fps replays
const replayDriver = createRafDriver({ name: 'replayDriver' });

sequence.play({
  rafDriver: replayDriver
});
```

## References

- [Theatre.js Documentation](https://www.theatrejs.com/docs/)
- [Theatre.js GitHub](https://github.com/theatre-js/theatre)
- [@theatre/r3f Documentation](https://www.theatrejs.com/docs/latest/api/r3f)
