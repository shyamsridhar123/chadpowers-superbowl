"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TargetProps {
  position: [number, number, number];
  radius: number;
  hit: boolean;
  points: number;
  distance: number;
}

export function Target({ position, radius, hit, points, distance }: TargetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current && !hit) {
      // Gentle hover animation
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }

    // Rotating ring
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.02;
    }
  });

  const color = hit ? "#22c55e" : "#ef4444";
  const emissiveIntensity = hit ? 0.3 : 0.5;

  return (
    <group ref={groupRef} position={position}>
      {/* Main target disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, 0.1, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={hit ? 0.5 : 0.9}
        />
      </mesh>

      {/* Inner rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[radius * 0.3, radius * 0.5, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <circleGeometry args={[radius * 0.2, 32]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Rotating outer ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <torusGeometry args={[radius * 1.1, 0.03, 8, 32]} />
        <meshStandardMaterial
          color={hit ? "#22c55e" : "#ffd700"}
          emissive={hit ? "#22c55e" : "#ffd700"}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Distance marker pole */}
      <mesh position={[0, -position[1] / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, position[1], 8]} />
        <meshStandardMaterial color="#ffd700" />
      </mesh>

      {/* Points indicator (floating text placeholder) */}
      <mesh position={[0, radius + 0.5, 0]}>
        <planeGeometry args={[1, 0.4]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.7} />
      </mesh>

      {/* Glow effect */}
      {!hit && (
        <pointLight
          color={color}
          intensity={5}
          distance={5}
        />
      )}
    </group>
  );
}
