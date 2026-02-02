"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { DefenderData } from "@/lib/game-types";

interface DefenderProps {
  defender: DefenderData;
  receiverPosition?: [number, number, number];
}

// Single defender component
function Defender({ defender, receiverPosition }: DefenderProps) {
  const meshRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);
  const prevPositionRef = useRef<[number, number, number]>(defender.startPosition);
  
  // Store current data in refs for useFrame access
  const defenderRef = useRef(defender);
  defenderRef.current = defender;
  
  const receiverPosRef = useRef(receiverPosition);
  receiverPosRef.current = receiverPosition;

  useFrame(() => {
    if (!meshRef.current) return;
    
    const currentDefender = defenderRef.current;
    const targetPos = receiverPosRef.current;
    
    // Update mesh position from defender state
    meshRef.current.position.set(
      currentDefender.position[0],
      0.8, // Height of capsule center
      currentDefender.position[2]
    );
    
    // Calculate rotation based on movement or target
    let targetRotation = currentRotation.current;
    
    if (targetPos) {
      // Face toward the receiver being covered
      const dx = targetPos[0] - currentDefender.position[0];
      const dz = targetPos[2] - currentDefender.position[2];
      if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
        targetRotation = Math.atan2(dx, -dz);
      }
    } else {
      // Face based on movement direction
      const dx = currentDefender.position[0] - prevPositionRef.current[0];
      const dz = currentDefender.position[2] - prevPositionRef.current[2];
      if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
        targetRotation = Math.atan2(dx, -dz);
      }
    }
    
    // Smooth rotation
    const rotDiff = targetRotation - currentRotation.current;
    const normalizedDiff = Math.atan2(Math.sin(rotDiff), Math.cos(rotDiff));
    currentRotation.current += normalizedDiff * 0.1;
    meshRef.current.rotation.y = currentRotation.current;
    
    // Store for next frame
    prevPositionRef.current = [...currentDefender.position];
  });

  return (
    <group ref={meshRef}>
      {/* Body - Capsule shape */}
      <mesh castShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
        <meshStandardMaterial
          color="#ff4444"
          emissive="#ff2200"
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color="#ff6644"
          emissive="#ff3300"
          emissiveIntensity={0.2}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>

      {/* Number on back - visual distinction */}
      <mesh position={[0, 0.2, 0.25]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>

      {/* Defense indicator glow */}
      <pointLight
        position={[0, 0.5, 0]}
        color="#ff4400"
        intensity={0.5}
        distance={3}
        decay={2}
      />
    </group>
  );
}

// Container component for all defenders
interface DefendersProps {
  defenders: DefenderData[];
  receiverPositions: Map<string, [number, number, number]>;
}

export function Defenders({ defenders, receiverPositions }: DefendersProps) {
  return (
    <group>
      {defenders.map((defender) => {
        // Get the position of the receiver this defender is covering (for man coverage)
        const receiverPos = defender.assignedReceiverId
          ? receiverPositions.get(defender.assignedReceiverId)
          : undefined;
        
        return (
          <Defender
            key={defender.id}
            defender={defender}
            receiverPosition={receiverPos}
          />
        );
      })}
    </group>
  );
}

export { Defender };
