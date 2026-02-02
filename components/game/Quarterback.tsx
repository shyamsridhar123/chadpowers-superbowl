"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface QuarterbackProps {
  position: [number, number, number];
  isThrowing?: boolean;
}

export function Quarterback({ position, isThrowing = false }: QuarterbackProps) {
  const groupRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
    }

    // Throwing animation
    if (armRef.current) {
      if (isThrowing) {
        armRef.current.rotation.x = THREE.MathUtils.lerp(
          armRef.current.rotation.x,
          -Math.PI / 2,
          0.3
        );
      } else {
        armRef.current.rotation.x = THREE.MathUtils.lerp(
          armRef.current.rotation.x,
          0,
          0.1
        );
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body/Torso */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
        <meshStandardMaterial color="#c41e3a" /> {/* Red jersey */}
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#d4a574" /> {/* Skin tone */}
      </mesh>

      {/* Helmet */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#c41e3a" />
      </mesh>

      {/* Face mask */}
      <mesh position={[0, 1.65, 0.15]}>
        <torusGeometry args={[0.08, 0.01, 8, 16]} />
        <meshStandardMaterial color="#808080" metalness={0.8} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.1, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
        <meshStandardMaterial color="#1a1a2e" /> {/* Dark pants */}
      </mesh>
      <mesh position={[0.1, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {/* Arms */}
      <group ref={armRef} position={[0.3, 1.2, 0]}>
        {/* Right arm (throwing arm) */}
        <mesh rotation={[0, 0, -Math.PI / 4]} castShadow>
          <capsuleGeometry args={[0.06, 0.35, 8, 16]} />
          <meshStandardMaterial color="#c41e3a" />
        </mesh>
      </group>

      {/* Left arm */}
      <mesh position={[-0.3, 1.1, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <capsuleGeometry args={[0.06, 0.35, 8, 16]} />
        <meshStandardMaterial color="#c41e3a" />
      </mesh>

      {/* Jersey number */}
      <mesh position={[0, 1.0, 0.26]}>
        <planeGeometry args={[0.2, 0.15]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Shadow under player */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
