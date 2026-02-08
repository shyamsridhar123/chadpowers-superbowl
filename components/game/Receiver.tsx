"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { ReceiverData, RouteWaypoint } from "@/lib/game-types";
import { FootballPlayer, PLAYER_PRESETS } from "./FootballPlayer";

interface ReceiverProps {
  receiver: ReceiverData;
  onPositionUpdate?: (id: string, position: [number, number, number]) => void;
  showRoute?: boolean;
  teamColor?: string;
}

// Interpolate position along route waypoints
function interpolateRoute(
  waypoints: RouteWaypoint[],
  progress: number
): [number, number, number] {
  if (waypoints.length === 0) return [0, 0, 0];
  if (waypoints.length === 1) return waypoints[0].position;

  let prevWaypoint = waypoints[0];
  let nextWaypoint = waypoints[waypoints.length - 1];

  for (let i = 0; i < waypoints.length - 1; i++) {
    if (progress >= waypoints[i].timing && progress <= waypoints[i + 1].timing) {
      prevWaypoint = waypoints[i];
      nextWaypoint = waypoints[i + 1];
      break;
    }
  }

  const segmentDuration = nextWaypoint.timing - prevWaypoint.timing;
  const localProgress =
    segmentDuration > 0
      ? (progress - prevWaypoint.timing) / segmentDuration
      : 0;

  const smoothProgress = localProgress * localProgress * (3 - 2 * localProgress);

  return [
    prevWaypoint.position[0] +
      (nextWaypoint.position[0] - prevWaypoint.position[0]) * smoothProgress,
    prevWaypoint.position[1] +
      (nextWaypoint.position[1] - prevWaypoint.position[1]) * smoothProgress,
    prevWaypoint.position[2] +
      (nextWaypoint.position[2] - prevWaypoint.position[2]) * smoothProgress,
  ];
}

// Calculate facing direction from movement
function calculateRotation(
  currentPos: [number, number, number],
  prevPos: [number, number, number]
): number {
  const dx = currentPos[0] - prevPos[0];
  const dz = currentPos[2] - prevPos[2];
  if (Math.abs(dx) < 0.001 && Math.abs(dz) < 0.001) return 0;
  return Math.atan2(dx, -dz);
}

// Map receiver state to FootballPlayer animation state
function getAnimationState(state: ReceiverData['state']): 'idle' | 'running' | 'catching' | 'celebrating' {
  switch (state) {
    case 'catching': return 'catching';
    case 'celebrating': return 'celebrating';
    case 'running': return 'running';
    default: return 'idle';
  }
}

export function Receiver({
  receiver,
  onPositionUpdate,
  showRoute = true,
  teamColor = "#00ff88",
}: ReceiverProps) {
  const groupRef = useRef<THREE.Group>(null);
  const prevPositionRef = useRef<[number, number, number]>(receiver.startPosition);
  const currentRotation = useRef(0);
  const currentPositionRef = useRef<[number, number, number]>(receiver.startPosition);

  const receiverRef = useRef(receiver);
  receiverRef.current = receiver;

  const onPositionUpdateRef = useRef(onPositionUpdate);
  onPositionUpdateRef.current = onPositionUpdate;

  // Create route points for Line component
  const routePoints = useMemo(() => {
    return receiver.route.waypoints.map(
      (wp) => [wp.position[0], 0.1, wp.position[2]] as [number, number, number]
    );
  }, [receiver.route.waypoints]);

  // Animation and position update
  useFrame(() => {
    if (!groupRef.current) return;

    const currentReceiver = receiverRef.current;

    const position = interpolateRoute(currentReceiver.route.waypoints, currentReceiver.progress);

    const targetRotation = calculateRotation(position, prevPositionRef.current);
    currentRotation.current = THREE.MathUtils.lerp(
      currentRotation.current,
      targetRotation,
      0.1
    );

    // Update group position and rotation
    groupRef.current.position.set(position[0], position[1], position[2]);
    groupRef.current.rotation.y = currentRotation.current;

    currentPositionRef.current = position;
    prevPositionRef.current = position;

    const updateCallback = onPositionUpdateRef.current;
    if (updateCallback) {
      updateCallback(currentReceiver.id, position);
    }
  });

  const animState = getAnimationState(receiver.state);
  const isMoving = receiver.state === 'running';

  return (
    <group>
      {/* Route visualization */}
      {showRoute && receiver.state === "running" && routePoints.length >= 2 && (
        <Line
          points={routePoints}
          color={teamColor}
          lineWidth={2}
          opacity={0.4}
          transparent
          dashed
          dashSize={0.5}
          gapSize={0.3}
        />
      )}

      {/* Receiver player model */}
      <group ref={groupRef}>
        <FootballPlayer
          {...PLAYER_PRESETS.receiver}
          animationState={animState}
          isAnimating={isMoving}
        />

        {/* Catch radius indicator (visible when ball is active) */}
        {receiver.state === "running" && (
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[receiver.catchRadius - 0.1, receiver.catchRadius, 32]} />
            <meshBasicMaterial
              color={teamColor}
              transparent
              opacity={0.15}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}

// Component for showing multiple receivers with their routes
interface ReceiversProps {
  receivers: ReceiverData[];
  onPositionUpdate?: (id: string, position: [number, number, number]) => void;
  showRoutes?: boolean;
}

export function Receivers({
  receivers,
  onPositionUpdate,
  showRoutes = true,
}: ReceiversProps) {
  return (
    <group>
      {receivers.map((receiver) => (
        <Receiver
          key={receiver.id}
          receiver={receiver}
          onPositionUpdate={onPositionUpdate}
          showRoute={showRoutes}
        />
      ))}
    </group>
  );
}
