"use client";

import { useMemo } from "react";
import * as THREE from "three";

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
  visible,
}: TrajectoryPreviewProps) {
  const { points } = useMemo(() => {
    if (!visible || power < 0.05) {
      return { points: [] as THREE.Vector3[] };
    }

    const gravity = -9.81;
    const minForce = 8;
    const maxForce = 28;
    const force = minForce + power * (maxForce - minForce);

    // Match the throw mechanics from GameController
    // Swipe angle: 0 = right, PI/2 = up, PI = left, -PI/2 = down
    const horizontalAim = Math.cos(angle);
    const upwardSwipeComponent = Math.max(0, Math.sin(angle));
    
    // Calculate velocity components matching the actual throw
    const vx = horizontalAim * force * 0.4; // Horizontal aim
    const vy = force * 0.5; // Upward arc
    const vz = -force * (0.6 + upwardSwipeComponent * 0.4); // Forward (negative Z)

    const pointsList: THREE.Vector3[] = [];
    const dt = 0.05;
    const maxTime = 3;

    let x = startPosition[0];
    let y = startPosition[1];
    let z = startPosition[2];
    let currentVy = vy;

    for (let t = 0; t < maxTime; t += dt) {
      pointsList.push(new THREE.Vector3(x, y, z));

      x += vx * dt;
      currentVy += gravity * dt;
      y += currentVy * dt;
      z += vz * dt;

      if (y < 0) break;
    }

    return { points: pointsList };
  }, [startPosition, angle, power, visible]);

  if (!visible || points.length < 2) return null;

  const lastPoint = points[points.length - 1];
  const arcPoints = points.filter((_, i) => i % 5 === 0);

  return (
    <group>
      {/* Simplified trajectory - just show arc points */}
      {arcPoints.map((point, i) => (
        <mesh key={`arc-${i}`} position={[point.x, point.y, point.z]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial
            color="#ffd700"
            transparent
            opacity={0.4 + (i / arcPoints.length) * 0.5}
          />
        </mesh>
      ))}

      {/* Landing point indicator */}
      <mesh position={[lastPoint.x, 0.1, lastPoint.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
