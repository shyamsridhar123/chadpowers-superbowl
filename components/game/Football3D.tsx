"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

interface Football3DProps {
  position: [number, number, number];
  rotation: [number, number, number, number];
  isActive: boolean;
  showTrail?: boolean;
}

export function Football3D({
  position,
  rotation,
  isActive,
}: Football3DProps) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...position);
      meshRef.current.quaternion.set(...rotation);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main football body - ellipsoid shape */}
      <mesh castShadow scale={[1, 0.6, 0.6]}>
        <sphereGeometry args={[0.143, 16, 12]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* White stripes */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.07, 0.008, 8, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.07, 0.008, 8, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Glow when active */}
      {isActive && (
        <pointLight color="#ffd700" intensity={2} distance={3} />
      )}
    </group>
  );
}
