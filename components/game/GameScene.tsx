"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

import { Stadium } from "./Stadium";
import { Football3D } from "./Football3D";
import { Quarterback } from "./Quarterback";
import { Target } from "./Target";
import { TrajectoryPreview } from "./TrajectoryPreview";
import { Receivers } from "./Receiver";
import { Defenders } from "./Defender";
import { useGameStore } from "@/lib/game-store";
import type { PhysicsState, ReceiverData, DefenderData } from "@/lib/game-types";

interface GameSceneContentProps {
  playerPosition: [number, number, number];
  ballState: PhysicsState["ball"];
  throwAngle: number;
  throwPower: number;
  isThrowing: boolean;
  receivers: ReceiverData[];
  defenders: DefenderData[];
  receiverPositions: Map<string, [number, number, number]>;
  onReceiverPositionUpdate?: (id: string, position: [number, number, number]) => void;
}

function GameSceneContent({
  playerPosition,
  ballState,
  throwAngle,
  throwPower,
  isThrowing,
  receivers,
  defenders,
  receiverPositions,
  onReceiverPositionUpdate,
}: GameSceneContentProps) {
  const { camera } = useThree();
  const targets = useGameStore((state) => state.targets);
  const showTrajectory = useGameStore((state) => state.showTrajectory);
  const mode = useGameStore((state) => state.mode);

  // Camera follow player
  useFrame(() => {
    const targetCameraPos = new THREE.Vector3(
      playerPosition[0],
      8,
      playerPosition[2] + 12
    );

    camera.position.lerp(targetCameraPos, 0.05);
    camera.lookAt(
      new THREE.Vector3(playerPosition[0], 1, playerPosition[2] - 20)
    );
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Stadium */}
      <Stadium />

      {/* Quarterback */}
      <Quarterback position={playerPosition} isThrowing={isThrowing} />

      {/* Football */}
      <Football3D
        position={ballState.position}
        rotation={ballState.rotation}
        isActive={ballState.isActive}
        showTrail={true}
      />

      {/* Targets (practice mode only) */}
      {mode === 'practice' && targets.map((target) => (
        <Target
          key={target.id}
          position={target.position}
          radius={target.radius}
          hit={target.hit}
          points={target.points}
          distance={target.distance}
        />
      ))}

      {/* Receivers (challenge mode) */}
      {mode === 'challenge' && receivers.length > 0 && (
        <Receivers
          receivers={receivers}
          onPositionUpdate={onReceiverPositionUpdate}
          showRoutes={!ballState.isActive}
        />
      )}

      {/* Defenders (challenge mode) */}
      {mode === 'challenge' && defenders.length > 0 && (
        <Defenders
          defenders={defenders}
          receiverPositions={receiverPositions}
        />
      )}

      {/* Trajectory preview */}
      {showTrajectory && !ballState.isActive && (
        <TrajectoryPreview
          startPosition={[playerPosition[0], 1.8, playerPosition[2]]}
          angle={throwAngle}
          power={throwPower}
          visible={throwPower > 0.05}
        />
      )}

      {/* Sky */}
      <mesh>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial color="#0a1628" side={THREE.BackSide} />
      </mesh>

      {/* Fog for depth */}
      <fog attach="fog" args={["#0a1628", 50, 150]} />
    </>
  );
}

interface GameSceneProps {
  playerPosition: [number, number, number];
  ballState: PhysicsState["ball"];
  throwAngle: number;
  throwPower: number;
  isThrowing: boolean;
  receivers: ReceiverData[];
  defenders: DefenderData[];
  receiverPositions: Map<string, [number, number, number]>;
  onReceiverPositionUpdate?: (id: string, position: [number, number, number]) => void;
}

export function GameScene({
  playerPosition,
  ballState,
  throwAngle,
  throwPower,
  isThrowing,
  receivers,
  defenders,
  receiverPositions,
  onReceiverPositionUpdate,
}: GameSceneProps) {
  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
      }}
      style={{ background: "#0a1628" }}
    >
      <PerspectiveCamera
        makeDefault
        position={[0, 8, 12]}
        fov={60}
        near={0.1}
        far={500}
      />

      <GameSceneContent
        playerPosition={playerPosition}
        ballState={ballState}
        throwAngle={throwAngle}
        throwPower={throwPower}
        isThrowing={isThrowing}
        receivers={receivers}
        defenders={defenders}
        receiverPositions={receiverPositions}
        onReceiverPositionUpdate={onReceiverPositionUpdate}
      />
    </Canvas>
  );
}
