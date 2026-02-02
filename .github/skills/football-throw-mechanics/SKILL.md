---
name: football-throw-mechanics
description: Guide for implementing realistic football throw physics including impulse calculation, trajectory preview, and spin mechanics. Use this when working with ball throwing, trajectory calculation, pass physics, or spiral mechanics.
---

# Football Throw Mechanics

This skill provides guidance for implementing realistic football throw physics, including swipe-to-throw translation, trajectory calculation, spiral spin mechanics, and visual trajectory preview.

## Physics Parameters

### Regulation NFL Football

```typescript
const FOOTBALL_CONFIG = {
  // Physical dimensions
  radius: 0.143,              // meters (11.35" diameter)
  mass: 0.41,                 // kg (14.5 oz)
  
  // Material properties
  restitution: 0.35,          // Bounce coefficient
  friction: 0.7,              // Surface grip
  
  // Aerodynamic properties
  linearDamping: 0.12,        // Air resistance
  angularDamping: 0.18,       // Spiral decay rate
  
  // Simulation
  groundY: 0.143,             // Ball radius (ground level)
  releaseHeight: 1.8,         // QB release point (meters)
  
  // Limits
  maxThrowVelocity: 30,       // m/s (~67 mph, elite QB)
  minThrowVelocity: 10,       // m/s (~22 mph, soft pass)
};

const GRAVITY = -9.81; // m/s²
```

## Swipe-to-Throw Translation

Convert touch swipe input to physics impulse:

```typescript
interface SwipeData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;  // ms
}

interface ThrowImpulse {
  force: [number, number, number];  // World-space impulse
  spin: [number, number, number];   // Angular velocity
  power: number;                    // 0-100
  angle: number;                    // radians
}

function calculateThrowImpulse(swipe: SwipeData): ThrowImpulse {
  const dx = swipe.endX - swipe.startX;
  const dy = swipe.endY - swipe.startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Velocity in pixels per millisecond
  const velocity = distance / swipe.duration;
  
  // Map velocity to power (0-100)
  // Typical swipe: 0.5-3.0 px/ms
  const power = Math.min(velocity * 40, 100);
  
  // Calculate throw angle from swipe direction
  // Screen Y is inverted (down is positive)
  const angle = Math.atan2(-dy, dx);
  
  // Calculate world-space force components
  // Forward throw is negative Z in Three.js
  const throwVelocity = mapPowerToVelocity(power);
  
  // Horizontal component (left/right deviation)
  const horizontalAngle = angle - Math.PI / 2; // Adjust for forward being -Z
  const horizontalDeviation = Math.sin(horizontalAngle) * throwVelocity * 0.3;
  
  // Vertical arc - swipes upward create higher arc
  const verticalFactor = Math.max(0, -Math.sin(angle)) * 0.5 + 0.3;
  
  const force: [number, number, number] = [
    horizontalDeviation,                    // X: left/right
    throwVelocity * verticalFactor,         // Y: upward arc
    -throwVelocity * Math.cos(angle * 0.5)  // Z: forward (negative)
  ];
  
  // Calculate spin for spiral
  const spin = calculateSpiral(angle, velocity);
  
  return {
    force,
    spin,
    power,
    angle
  };
}

function mapPowerToVelocity(power: number): number {
  const { minThrowVelocity, maxThrowVelocity } = FOOTBALL_CONFIG;
  const normalizedPower = power / 100;
  
  // Quadratic mapping for more control at low power
  const t = normalizedPower * normalizedPower;
  return minThrowVelocity + t * (maxThrowVelocity - minThrowVelocity);
}
```

## Spiral Spin Mechanics

Generate realistic football spiral rotation:

```typescript
function calculateSpiral(
  angle: number, 
  swipeVelocity: number
): [number, number, number] {
  // Primary spin around the football's long axis (forward)
  // This creates the spiral effect
  const spiralSpeed = 15 + swipeVelocity * 5; // rad/s
  
  // Secondary rotation from throw angle
  const wobble = swipeVelocity * 0.3;
  
  return [
    angle * spiralSpeed * 0.1,  // X: pitch wobble based on angle
    0,                          // Y: yaw (minimal for good spiral)
    spiralSpeed                 // Z: main spiral rotation (around forward axis)
  ];
}
```

## Trajectory Physics

### Basic Projectile Motion

```typescript
function simulateTrajectory(
  initialPosition: [number, number, number],
  initialVelocity: [number, number, number],
  steps: number = 100,
  dt: number = 0.016 // 60fps timestep
): [number, number, number][] {
  const trajectory: [number, number, number][] = [];
  
  let pos: [number, number, number] = [...initialPosition];
  let vel: [number, number, number] = [...initialVelocity];
  
  for (let i = 0; i < steps; i++) {
    // Store current position
    trajectory.push([...pos]);
    
    // Apply gravity
    vel[1] += GRAVITY * dt;
    
    // Apply air resistance (simple linear drag)
    vel[0] *= 1 - FOOTBALL_CONFIG.linearDamping * dt;
    vel[1] *= 1 - FOOTBALL_CONFIG.linearDamping * dt * 0.5; // Less drag vertically
    vel[2] *= 1 - FOOTBALL_CONFIG.linearDamping * dt;
    
    // Update position
    pos[0] += vel[0] * dt;
    pos[1] += vel[1] * dt;
    pos[2] += vel[2] * dt;
    
    // Stop if ground hit
    if (pos[1] <= FOOTBALL_CONFIG.groundY) {
      pos[1] = FOOTBALL_CONFIG.groundY;
      trajectory.push([...pos]);
      break;
    }
  }
  
  return trajectory;
}
```

### Advanced Trajectory with Magnus Effect

```typescript
interface AdvancedTrajectoryParams {
  position: [number, number, number];
  velocity: [number, number, number];
  angularVelocity: [number, number, number];
  dt: number;
}

function advancedStep(params: AdvancedTrajectoryParams): AdvancedTrajectoryParams {
  const { position, velocity, angularVelocity, dt } = params;
  
  const pos = [...position] as [number, number, number];
  const vel = [...velocity] as [number, number, number];
  const angVel = [...angularVelocity] as [number, number, number];
  
  // Gravity
  vel[1] += GRAVITY * dt;
  
  // Air resistance (quadratic drag for more realism)
  const speed = Math.sqrt(vel[0]**2 + vel[1]**2 + vel[2]**2);
  const dragCoeff = 0.002; // Simplified drag coefficient
  if (speed > 0) {
    const dragForce = dragCoeff * speed * speed;
    vel[0] -= (vel[0] / speed) * dragForce * dt;
    vel[1] -= (vel[1] / speed) * dragForce * dt;
    vel[2] -= (vel[2] / speed) * dragForce * dt;
  }
  
  // Magnus effect (spin causes curved flight)
  // F_magnus = C * (ω × v)
  const magnusCoeff = 0.0001;
  vel[0] += magnusCoeff * (angVel[1] * vel[2] - angVel[2] * vel[1]) * dt;
  vel[1] += magnusCoeff * (angVel[2] * vel[0] - angVel[0] * vel[2]) * dt;
  vel[2] += magnusCoeff * (angVel[0] * vel[1] - angVel[1] * vel[0]) * dt;
  
  // Angular damping
  angVel[0] *= 1 - FOOTBALL_CONFIG.angularDamping * dt;
  angVel[1] *= 1 - FOOTBALL_CONFIG.angularDamping * dt;
  angVel[2] *= 1 - FOOTBALL_CONFIG.angularDamping * dt;
  
  // Update position
  pos[0] += vel[0] * dt;
  pos[1] += vel[1] * dt;
  pos[2] += vel[2] * dt;
  
  return {
    position: pos,
    velocity: vel,
    angularVelocity: angVel,
    dt
  };
}
```

## Trajectory Preview Visualization

Render a dashed line showing predicted ball path:

```typescript
import * as THREE from 'three';

class TrajectoryPreview {
  private line: THREE.Line;
  private points: THREE.Vector3[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.LineDashedMaterial;
  private maxPoints = 100;

  constructor(scene: THREE.Scene) {
    // Pre-allocate points
    for (let i = 0; i < this.maxPoints; i++) {
      this.points.push(new THREE.Vector3());
    }
    
    this.geometry = new THREE.BufferGeometry().setFromPoints(this.points);
    
    this.material = new THREE.LineDashedMaterial({
      color: 0xffff00,
      dashSize: 0.3,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.7
    });
    
    this.line = new THREE.Line(this.geometry, this.material);
    this.line.computeLineDistances();
    this.line.visible = false;
    
    scene.add(this.line);
  }

  update(
    startPosition: [number, number, number],
    velocity: [number, number, number]
  ) {
    const trajectory = simulateTrajectory(startPosition, velocity, this.maxPoints);
    
    // Update geometry
    const positions = this.geometry.attributes.position as THREE.BufferAttribute;
    
    for (let i = 0; i < this.maxPoints; i++) {
      if (i < trajectory.length) {
        positions.setXYZ(i, trajectory[i][0], trajectory[i][1], trajectory[i][2]);
      } else {
        // Hide unused points by placing at last valid position
        const last = trajectory[trajectory.length - 1];
        positions.setXYZ(i, last[0], last[1], last[2]);
      }
    }
    
    positions.needsUpdate = true;
    this.geometry.computeBoundingSphere();
    this.line.computeLineDistances();
  }

  show() {
    this.line.visible = true;
  }

  hide() {
    this.line.visible = false;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
```

## React Component for Trajectory Preview

```tsx
"use client";

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

interface TrajectoryPreviewProps {
  startPosition: [number, number, number];
  angle: number;
  power: number;
  visible: boolean;
}

export function TrajectoryPreview({
  startPosition,
  angle,
  power,
  visible
}: TrajectoryPreviewProps) {
  const lineRef = useRef<THREE.Line>(null);
  const pointsRef = useRef<THREE.Vector3[]>([]);
  
  useEffect(() => {
    // Initialize points
    pointsRef.current = Array(100).fill(null).map(() => new THREE.Vector3());
  }, []);

  useFrame(() => {
    if (!visible || !lineRef.current) return;
    
    // Calculate velocity from angle and power
    const throwVelocity = 10 + (power / 100) * 20;
    const velocity: [number, number, number] = [
      Math.sin(angle) * throwVelocity * 0.3,
      throwVelocity * 0.4,
      -throwVelocity * Math.cos(angle * 0.5)
    ];
    
    // Simulate trajectory
    const trajectory = simulateTrajectory(startPosition, velocity);
    
    // Update line geometry
    const positions = lineRef.current.geometry.attributes.position as THREE.BufferAttribute;
    trajectory.forEach((pos, i) => {
      positions.setXYZ(i, pos[0], pos[1], pos[2]);
    });
    positions.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={100}
          array={new Float32Array(300)}
          itemSize={3}
        />
      </bufferGeometry>
      <lineDashedMaterial
        color="#ffff00"
        dashSize={0.3}
        gapSize={0.15}
        transparent
        opacity={0.7}
      />
    </line>
  );
}
```

## Target Hit Detection

```typescript
interface Target {
  id: string;
  position: [number, number, number];
  radius: number;
}

function checkTargetHit(
  ballPosition: [number, number, number],
  targets: Target[]
): Target | null {
  for (const target of targets) {
    const dx = ballPosition[0] - target.position[0];
    const dy = ballPosition[1] - target.position[1];
    const dz = ballPosition[2] - target.position[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance <= target.radius + FOOTBALL_CONFIG.radius) {
      return target;
    }
  }
  return null;
}
```

## Scoring System

```typescript
interface ThrowScore {
  accuracy: number;      // 0-100 based on how centered
  power: number;         // Bonus for optimal power
  spiral: number;        // Bonus for clean spiral
  distance: number;      // Bonus for longer throws
  total: number;
}

function calculateThrowScore(
  throwData: ThrowImpulse,
  targetHit: Target | null,
  impactPosition: [number, number, number]
): ThrowScore {
  let accuracy = 0;
  let power = 0;
  let spiral = 0;
  let distance = 0;
  
  if (targetHit) {
    // Calculate accuracy based on center hit
    const dx = impactPosition[0] - targetHit.position[0];
    const dy = impactPosition[1] - targetHit.position[1];
    const dz = impactPosition[2] - targetHit.position[2];
    const distFromCenter = Math.sqrt(dx * dx + dy * dy + dz * dz);
    accuracy = Math.max(0, 100 * (1 - distFromCenter / targetHit.radius));
    
    // Distance bonus
    distance = Math.min(50, targetHit.position[2] * -1); // 1 point per yard
    
    // Power bonus (optimal range 50-80)
    const optimalPower = throwData.power >= 50 && throwData.power <= 80;
    power = optimalPower ? 20 : 10;
    
    // Spiral quality (higher Z spin = better spiral)
    const spiralQuality = Math.abs(throwData.spin[2]) / 20;
    spiral = Math.min(30, spiralQuality * 30);
  }
  
  return {
    accuracy,
    power,
    spiral,
    distance,
    total: Math.round(accuracy + power + spiral + distance)
  };
}
```

## Complete Throw Handler

```typescript
function handleThrow(
  swipeData: SwipeData,
  playerPosition: [number, number, number],
  targets: Target[],
  onComplete: (result: { hit: boolean; target?: Target; score: ThrowScore }) => void
) {
  // Calculate impulse from swipe
  const impulse = calculateThrowImpulse(swipeData);
  
  // Starting position is player position + release height
  const startPos: [number, number, number] = [
    playerPosition[0],
    FOOTBALL_CONFIG.releaseHeight,
    playerPosition[2]
  ];
  
  // Send to physics worker
  physicsWorker.postMessage({
    type: 'THROW',
    data: {
      position: startPos,
      force: impulse.force,
      spin: impulse.spin
    }
  });
  
  // Monitor for hit/ground
  const checkInterval = setInterval(() => {
    const ballPos = getCurrentBallPosition();
    
    // Check target hit
    const hitTarget = checkTargetHit(ballPos, targets);
    if (hitTarget) {
      clearInterval(checkInterval);
      const score = calculateThrowScore(impulse, hitTarget, ballPos);
      onComplete({ hit: true, target: hitTarget, score });
      return;
    }
    
    // Check if ball stopped (ground hit)
    if (ballPos[1] <= FOOTBALL_CONFIG.groundY + 0.1 && !isBallActive()) {
      clearInterval(checkInterval);
      const score = calculateThrowScore(impulse, null, ballPos);
      onComplete({ hit: false, score });
    }
  }, 16);
}
```

## References

- [Projectile Motion Physics](https://en.wikipedia.org/wiki/Projectile_motion)
- [Magnus Effect](https://en.wikipedia.org/wiki/Magnus_effect)
- [Game Physics Engine Development - Ian Millington](https://www.routledge.com/Game-Physics-Engine-Development/Millington/p/book/9780123819765)
- [NFL Football Specifications](https://operations.nfl.com/the-rules/nfl-video-rulebook/ball-specifications/)
