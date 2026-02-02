"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { ReceiverData, RouteWaypoint } from "@/lib/game-types";

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

  // Find the two waypoints we're between
  let prevWaypoint = waypoints[0];
  let nextWaypoint = waypoints[waypoints.length - 1];

  for (let i = 0; i < waypoints.length - 1; i++) {
    if (progress >= waypoints[i].timing && progress <= waypoints[i + 1].timing) {
      prevWaypoint = waypoints[i];
      nextWaypoint = waypoints[i + 1];
      break;
    }
  }

  // Calculate local progress between these two waypoints
  const segmentDuration = nextWaypoint.timing - prevWaypoint.timing;
  const localProgress =
    segmentDuration > 0
      ? (progress - prevWaypoint.timing) / segmentDuration
      : 0;

  // Smooth interpolation using smoothstep
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

export function Receiver({
  receiver,
  onPositionUpdate,
  showRoute = true,
  teamColor = "#00ff88",
}: ReceiverProps) {
  const meshRef = useRef<THREE.Group>(null);
  const prevPositionRef = useRef<[number, number, number]>(receiver.startPosition);
  const currentRotation = useRef(0);
  
  // Store current receiver data in ref for useFrame access
  // This ensures useFrame always has the latest props
  const receiverRef = useRef(receiver);
  receiverRef.current = receiver;
  
  // Store callback in ref to avoid stale closure
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
    if (!meshRef.current) return;
    
    // Read from ref to get latest receiver data
    const currentReceiver = receiverRef.current;

    // Get interpolated position along route
    const position = interpolateRoute(currentReceiver.route.waypoints, currentReceiver.progress);

    // Calculate rotation based on movement direction
    const targetRotation = calculateRotation(position, prevPositionRef.current);
    currentRotation.current = THREE.MathUtils.lerp(
      currentRotation.current,
      targetRotation,
      0.1
    );

    // Update mesh position and rotation
    meshRef.current.position.set(position[0], position[1], position[2]);
    meshRef.current.rotation.y = currentRotation.current;

    // Store for next frame
    prevPositionRef.current = position;

    // Callback for physics/collision
    const updateCallback = onPositionUpdateRef.current;
    if (updateCallback) {
      updateCallback(currentReceiver.id, position);
    }
  });

  // Determine color based on state
  const stateColor = useMemo(() => {
    switch (receiver.state) {
      case "catching":
        return "#ffff00";
      case "celebrating":
        return "#00ffff";
      case "incomplete":
        return "#ff4444";
      default:
        return teamColor;
    }
  }, [receiver.state, teamColor]);

  // Animation scale based on state
  const animationScale = useMemo(() => {
    switch (receiver.state) {
      case "catching":
        return 1.1;
      case "celebrating":
        return 1.15;
      default:
        return 1.0;
    }
  }, [receiver.state]);

  return (
    <group>
      {/* Route visualization - subtle dashed line */}
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

      {/* Receiver body */}
      <group ref={meshRef} scale={animationScale}>
        {/* Body - capsule shape */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.8, 8, 16]} />
          <meshStandardMaterial
            color={stateColor}
            emissive={stateColor}
            emissiveIntensity={receiver.state === "running" ? 0.2 : 0.4}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.55, 0]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial
            color="#ffcc88"
            metalness={0.1}
            roughness={0.8}
          />
        </mesh>

        {/* Helmet */}
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial
            color={teamColor}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>

        {/* Jersey number indicator - glowing ring at feet */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial
            color={stateColor}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>

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
