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
  const { points, positions } = useMemo(() => {
    if (!visible || power < 0.05) {
      return { points: [] as THREE.Vector3[], positions: new Float32Array(0) };
    }

    const gravity = -9.81;
    const maxPower = 25;
    const velocity = power * maxPower;

    const vx = Math.cos(angle) * velocity * 0.5;
    const vy = Math.sin(Math.PI / 4) * velocity;
    const vz = -Math.abs(Math.sin(angle) * velocity);

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

    const posArray = new Float32Array(pointsList.length * 3);
    pointsList.forEach((p, i) => {
      posArray[i * 3] = p.x;
      posArray[i * 3 + 1] = p.y;
      posArray[i * 3 + 2] = p.z;
    });

    return { points: pointsList, positions: posArray };
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
