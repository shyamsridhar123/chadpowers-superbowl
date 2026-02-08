"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { DefenderData } from "@/lib/game-types";
import { FootballPlayer, PLAYER_PRESETS } from "./FootballPlayer";

interface DefenderProps {
  defender: DefenderData;
  receiverPosition?: [number, number, number];
}

// Single defender component
function Defender({ defender, receiverPosition }: DefenderProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);
  const prevPositionRef = useRef<[number, number, number]>(defender.startPosition);

  const defenderRef = useRef(defender);
  defenderRef.current = defender;

  const receiverPosRef = useRef(receiverPosition);
  receiverPosRef.current = receiverPosition;

  // Determine if defender is moving
  const isMoving = useRef(false);

  useFrame(() => {
    if (!groupRef.current) return;

    const currentDefender = defenderRef.current;
    const targetPos = receiverPosRef.current;

    // Update group position
    groupRef.current.position.set(
      currentDefender.position[0],
      0,
      currentDefender.position[2]
    );

    // Calculate rotation based on movement or target
    let targetRotation = currentRotation.current;

    if (targetPos) {
      const dx = targetPos[0] - currentDefender.position[0];
      const dz = targetPos[2] - currentDefender.position[2];
      if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
        targetRotation = Math.atan2(dx, -dz);
      }
    } else {
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

    // Check if moving
    const dx = currentDefender.position[0] - prevPositionRef.current[0];
    const dz = currentDefender.position[2] - prevPositionRef.current[2];
    isMoving.current = Math.abs(dx) > 0.005 || Math.abs(dz) > 0.005;

    // Apply rotation on the group (ref updates don't cause re-renders)
    groupRef.current.rotation.y = currentRotation.current;

    prevPositionRef.current = [...currentDefender.position];
  });

  return (
    <group ref={groupRef}>
      <FootballPlayer
        {...PLAYER_PRESETS.defender}
        animationState={isMoving.current ? 'running' : 'idle'}
        isAnimating={isMoving.current}
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
