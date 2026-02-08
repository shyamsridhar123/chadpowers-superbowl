"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Easing functions
function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// Camera path keyframes mapped to the stadium coordinate system:
// Field: 53.3 wide (X), 100 long (Z), centered at [0, 0, -25]
// Field Z range: -75 (far end zone) to +25 (near end zone)
// Sidelines at X = +/- 27, walls at X = +/- 30
// Stadium lights at Y = 15
// Gameplay camera: [0, 8, 12] looking at [0, 1, -20]

const CAMERA_POSITIONS = [
  new THREE.Vector3(0, 80, -25),      // 1. High aerial above field center
  new THREE.Vector3(-15, 55, -5),     // Descent transition
  new THREE.Vector3(-35, 35, 10),     // 2. Flyover sweep from corner
  new THREE.Vector3(-10, 15, -10),    // Transition toward sideline
  new THREE.Vector3(25, 4, -20),      // 3. Low sideline tracking shot
  new THREE.Vector3(15, 8, -50),      // Transition toward end zone
  new THREE.Vector3(0, 10, -70),      // 4. End zone looking down field
  new THREE.Vector3(0, 9, -30),       // Transition settling in
  new THREE.Vector3(0, 8, 12),        // 5. Final gameplay camera position
];

const LOOKAT_POSITIONS = [
  new THREE.Vector3(0, 0, -25),       // Looking down at field
  new THREE.Vector3(0, 0, -25),       // Still at field
  new THREE.Vector3(0, 0, -30),       // Midfield
  new THREE.Vector3(0, 1, -25),       // Transition
  new THREE.Vector3(0, 1, -25),       // Across field from sideline
  new THREE.Vector3(0, 1, -15),       // Transition
  new THREE.Vector3(0, 1, 0),         // Down the full field
  new THREE.Vector3(0, 1, -15),       // Transition
  new THREE.Vector3(0, 1, -20),       // Gameplay lookAt
];

const TOTAL_DURATION = 8; // seconds - snappy but cinematic

interface IntroCutsceneProps {
  onComplete: () => void;
  skip: boolean;
}

export function IntroCutscene({ onComplete, skip }: IntroCutsceneProps) {
  const { camera } = useThree();
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);

  // Build smooth spline curves through keyframe positions
  const cameraPath = useMemo(
    () => new THREE.CatmullRomCurve3(CAMERA_POSITIONS, false, "catmullrom", 0.5),
    []
  );
  const lookAtPath = useMemo(
    () => new THREE.CatmullRomCurve3(LOOKAT_POSITIONS, false, "catmullrom", 0.5),
    []
  );

  // Reusable vectors to avoid GC during frame loop
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (completedRef.current) return;

    // Handle skip
    if (skip) {
      completedRef.current = true;
      const finalPos = CAMERA_POSITIONS[CAMERA_POSITIONS.length - 1];
      const finalLook = LOOKAT_POSITIONS[LOOKAT_POSITIONS.length - 1];
      camera.position.copy(finalPos);
      camera.lookAt(finalLook);
      if ("fov" in camera) {
        (camera as THREE.PerspectiveCamera).fov = 60;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      }
      onComplete();
      return;
    }

    elapsedRef.current += delta;
    const rawT = Math.min(elapsedRef.current / TOTAL_DURATION, 1);
    const t = easeInOutCubic(rawT);

    // Sample spline at eased time
    cameraPath.getPointAt(t, tempPos);
    lookAtPath.getPointAt(t, tempLook);

    camera.position.copy(tempPos);
    camera.lookAt(tempLook);

    // Animate FOV: start wide (75), end at gameplay (60)
    if ("fov" in camera) {
      const perspCam = camera as THREE.PerspectiveCamera;
      perspCam.fov = 75 - 15 * t; // 75 -> 60
      perspCam.updateProjectionMatrix();
    }

    if (rawT >= 1) {
      completedRef.current = true;
      onComplete();
    }
  });

  return null;
}
