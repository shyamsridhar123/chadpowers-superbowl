"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const TRAIL_LENGTH = 20;

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
  showTrail = true,
}: Football3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Points>(null);
  const trailPositions = useRef<Float32Array>(new Float32Array(TRAIL_LENGTH * 3));
  const trailOpacities = useRef<Float32Array>(new Float32Array(TRAIL_LENGTH));
  const trailIndex = useRef(0);
  const lastPosition = useRef<[number, number, number]>([...position]);

  // Create trail geometry
  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(TRAIL_LENGTH * 3), 3)
    );
    geometry.setAttribute(
      "opacity",
      new THREE.BufferAttribute(new Float32Array(TRAIL_LENGTH), 1)
    );
    return geometry;
  }, []);

  // Create trail material with cyan glow
  const trailMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.15,
      color: new THREE.Color(0x00ffff),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...position);
      meshRef.current.quaternion.set(...rotation);
    }

    // Update trail when ball is active
    if (trailRef.current && isActive && showTrail) {
      // Check if position has changed
      const dx = position[0] - lastPosition.current[0];
      const dy = position[1] - lastPosition.current[1];
      const dz = position[2] - lastPosition.current[2];
      const moved = Math.sqrt(dx * dx + dy * dy + dz * dz) > 0.05;

      if (moved) {
        // Add new trail point
        const idx = trailIndex.current % TRAIL_LENGTH;
        trailPositions.current[idx * 3] = position[0];
        trailPositions.current[idx * 3 + 1] = position[1];
        trailPositions.current[idx * 3 + 2] = position[2];
        trailOpacities.current[idx] = 1.0;
        trailIndex.current++;
        lastPosition.current = [...position];
      }

      // Fade out trail points
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        trailOpacities.current[i] *= 0.92;
      }

      // Update geometry
      const posAttr = trailRef.current.geometry.attributes.position as THREE.BufferAttribute;
      posAttr.array.set(trailPositions.current);
      posAttr.needsUpdate = true;
    } else if (trailRef.current && !isActive) {
      // Clear trail when ball is not active
      trailPositions.current.fill(0);
      trailOpacities.current.fill(0);
      trailIndex.current = 0;
      const posAttr = trailRef.current.geometry.attributes.position as THREE.BufferAttribute;
      posAttr.array.set(trailPositions.current);
      posAttr.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Ball trail effect */}
      {showTrail && (
        <points ref={trailRef} geometry={trailGeometry} material={trailMaterial} />
      )}

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

        {/* Glow when active - enhanced */}
        {isActive && (
          <>
            <pointLight color="#ffd700" intensity={2} distance={3} />
            <pointLight color="#00ffff" intensity={1} distance={2} />
          </>
        )}
      </group>
    </>
  );
}
