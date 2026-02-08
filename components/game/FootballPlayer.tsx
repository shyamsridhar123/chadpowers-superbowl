"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CharacterDefinition } from "@/lib/characters";

// ============================================
// STYLIZED FOOTBALL PLAYER - Proper Human Proportions
// Fortnite/NCAA style - low poly but clearly a football player
// ============================================

interface FootballPlayerProps {
  position?: [number, number, number];
  rotation?: number;
  jerseyColor: string;
  pantsColor: string;
  helmetColor: string;
  skinTone: string;
  jerseyNumber?: number;
  isAnimating?: boolean;
  animationState?: 'idle' | 'running' | 'throwing' | 'catching' | 'celebrating';
  scale?: number;
  castShadow?: boolean;
  character?: CharacterDefinition;
  bodyType?: 'lean' | 'athletic' | 'heavy';
  glovesColor?: string;
  hasGloves?: boolean;
  hasEyeBlack?: boolean;
  hasTowel?: boolean;
  facemaskColor?: string;
  secondaryColor?: string;
}

const createMaterials = (colors: {
  jersey: string;
  pants: string;
  helmet: string;
  skin: string;
  facemask: string;
  gloves: string;
  secondary: string;
}) => ({
  jersey: new THREE.MeshStandardMaterial({
    color: colors.jersey,
    roughness: 0.7,
    metalness: 0.05,
  }),
  pants: new THREE.MeshStandardMaterial({
    color: colors.pants,
    roughness: 0.85,
    metalness: 0.05,
  }),
  helmet: new THREE.MeshStandardMaterial({
    color: colors.helmet,
    roughness: 0.2,
    metalness: 0.7,
  }),
  skin: new THREE.MeshStandardMaterial({
    color: colors.skin,
    roughness: 0.85,
    metalness: 0.0,
  }),
  facemask: new THREE.MeshStandardMaterial({
    color: colors.facemask,
    roughness: 0.3,
    metalness: 0.95,
  }),
  gloves: new THREE.MeshStandardMaterial({
    color: colors.gloves,
    roughness: 0.6,
    metalness: 0.1,
  }),
  secondary: new THREE.MeshStandardMaterial({
    color: colors.secondary,
    roughness: 0.5,
    metalness: 0.1,
  }),
  white: new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.5,
    metalness: 0.1,
  }),
  black: new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 0.9,
    metalness: 0.0,
  }),
  darkGray: new THREE.MeshStandardMaterial({
    color: '#333333',
    roughness: 0.8,
    metalness: 0.05,
  }),
  eyeBlack: new THREE.MeshStandardMaterial({
    color: '#0a0a0a',
    roughness: 1.0,
    metalness: 0.0,
  }),
  sock: new THREE.MeshStandardMaterial({
    color: colors.jersey,
    roughness: 0.9,
    metalness: 0.0,
  }),
});

// Body type scale multipliers
const BODY_SCALES = {
  lean: { torso: 0.9, shoulder: 0.9, arm: 0.9, leg: 0.95 },
  athletic: { torso: 1.0, shoulder: 1.0, arm: 1.0, leg: 1.0 },
  heavy: { torso: 1.15, shoulder: 1.1, arm: 1.05, leg: 1.1 },
};

export function FootballPlayer({
  position = [0, 0, 0],
  rotation = 0,
  jerseyColor,
  pantsColor,
  helmetColor,
  skinTone,
  jerseyNumber = 1,
  isAnimating = false,
  animationState = 'idle',
  scale = 1,
  castShadow = true,
  character,
  bodyType = 'athletic',
  glovesColor,
  hasGloves = false,
  hasEyeBlack = false,
  hasTowel = false,
  facemaskColor = '#808080',
  secondaryColor = '#ffffff',
}: FootballPlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const animTime = useRef(0);

  // Extract character definition overrides
  const jColor = character?.gear.jersey.primaryColor ?? jerseyColor;
  const pColor = character?.gear.pantsColor ?? pantsColor;
  const hColor = character?.gear.helmet.color ?? helmetColor;
  const sColor = character?.physical.skinTone ?? skinTone;
  const fmColor = character?.gear.helmet.facemaskColor ?? facemaskColor;
  const glColor = character?.gear.glovesColor ?? glovesColor ?? jColor;
  const secColor = character?.gear.jersey.secondaryColor ?? secondaryColor;
  const bType = character?.physical.bodyType ?? bodyType;
  const showGloves = character?.gear.hasGloves ?? hasGloves;
  const showEyeBlack = character?.gear.hasEyeBlack ?? hasEyeBlack;
  const showTowel = character?.gear.hasTowel ?? hasTowel;

  const bs = BODY_SCALES[bType];

  const materials = useMemo(() => createMaterials({
    jersey: jColor,
    pants: pColor,
    helmet: hColor,
    skin: sColor,
    facemask: fmColor,
    gloves: glColor,
    secondary: secColor,
  }), [jColor, pColor, hColor, sColor, fmColor, glColor, secColor]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    animTime.current += delta;
    const t = animTime.current;

    // Reset arm rotations each frame before applying animation
    if (leftArmRef.current) { leftArmRef.current.rotation.x = 0; leftArmRef.current.rotation.z = 0; }
    if (rightArmRef.current) { rightArmRef.current.rotation.x = 0; rightArmRef.current.rotation.z = 0; }
    if (leftLegRef.current) { leftLegRef.current.rotation.x = 0; }
    if (rightLegRef.current) { rightLegRef.current.rotation.x = 0; }

    if (animationState === 'running' && isAnimating) {
      const runSpeed = 8;
      const legSwing = Math.sin(t * runSpeed) * 0.6;
      const armSwing = Math.sin(t * runSpeed) * 0.4;

      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = armSwing;

      if (bodyRef.current) {
        bodyRef.current.position.y = Math.abs(Math.sin(t * runSpeed * 2)) * 0.05;
      }
    } else if (animationState === 'throwing') {
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x, -Math.PI * 0.7, 0.15
        );
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z, -Math.PI * 0.2, 0.15
        );
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.3;
      }
      if (bodyRef.current) {
        bodyRef.current.position.y = 0;
      }
    } else if (animationState === 'catching') {
      // Both arms raised forward to catch
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -Math.PI * 0.5 + Math.sin(t * 3) * 0.05;
        leftArmRef.current.rotation.z = 0.3;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -Math.PI * 0.5 + Math.sin(t * 3 + 0.5) * 0.05;
        rightArmRef.current.rotation.z = -0.3;
      }
      if (bodyRef.current) {
        bodyRef.current.position.y = 0;
      }
    } else if (animationState === 'celebrating') {
      const celebSpeed = 4;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -Math.PI * 0.8;
        leftArmRef.current.rotation.z = Math.sin(t * celebSpeed) * 0.3;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -Math.PI * 0.8;
        rightArmRef.current.rotation.z = -Math.sin(t * celebSpeed) * 0.3;
      }
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.abs(Math.sin(t * celebSpeed)) * 0.08;
      }
    } else {
      // Idle - subtle breathing
      const breathSpeed = 2;
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(t * breathSpeed) * 0.02;
      }
      // Arms slightly out at sides
      if (leftArmRef.current) leftArmRef.current.rotation.z = 0.08;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -0.08;
    }
  });

  const handMat = showGloves ? materials.gloves : materials.skin;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotation, 0]}
      scale={scale}
    >
      <group ref={bodyRef}>

        {/* ====== HELMET ====== */}
        <group position={[0, 1.75, 0]}>
          {/* Main helmet shell - elongated front-to-back */}
          <mesh castShadow={castShadow} scale={[1, 1, 1.15]}>
            <sphereGeometry args={[0.17, 24, 24]} />
            <primitive object={materials.helmet} />
          </mesh>

          {/* Helmet brim/visor ridge */}
          <mesh position={[0, -0.02, 0.1]} castShadow={castShadow}>
            <boxGeometry args={[0.3, 0.06, 0.06]} />
            <primitive object={materials.helmet} />
          </mesh>

          {/* Face mask - cage style */}
          <group position={[0, -0.04, 0.16]}>
            {/* Horizontal bars */}
            {[-0.06, -0.02, 0.02, 0.06].map((y, i) => (
              <mesh key={`fh-${i}`} position={[0, y, 0]}>
                <cylinderGeometry args={[0.006, 0.006, 0.2, 6]} />
                <primitive object={materials.facemask} />
              </mesh>
            ))}
            {/* Vertical bars */}
            {[-0.07, -0.03, 0.03, 0.07].map((x, i) => (
              <mesh key={`fv-${i}`} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.006, 0.006, 0.14, 6]} />
                <primitive object={materials.facemask} />
              </mesh>
            ))}
            {/* Curved chin bar */}
            <mesh position={[0, -0.07, -0.02]} rotation={[0.3, 0, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.16, 6]} />
              <primitive object={materials.facemask} />
            </mesh>
          </group>

          {/* Helmet center stripe */}
          <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.15, 1]}>
            <cylinderGeometry args={[0.17, 0.17, 0.025, 24, 1, true, -0.25, 0.5]} />
            <primitive object={materials.white} />
          </mesh>

          {/* Ear holes with guard plates */}
          {[0.16, -0.16].map((x, i) => (
            <group key={`ear-${i}`} position={[x, -0.02, 0.02]}>
              <mesh>
                <cylinderGeometry args={[0.035, 0.035, 0.025, 12]} />
                <primitive object={materials.darkGray} />
              </mesh>
              {/* Earhole vent circles */}
              <mesh position={[x > 0 ? 0.01 : -0.01, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <ringGeometry args={[0.01, 0.025, 8]} />
                <primitive object={materials.black} />
              </mesh>
            </group>
          ))}

          {/* Back helmet lip */}
          <mesh position={[0, -0.08, -0.12]} castShadow={castShadow}>
            <boxGeometry args={[0.24, 0.06, 0.04]} />
            <primitive object={materials.helmet} />
          </mesh>
        </group>

        {/* ====== FACE ====== */}
        <group position={[0, 1.7, 0.08]}>
          <mesh castShadow={castShadow}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <primitive object={materials.skin} />
          </mesh>
          {/* Eye black marks */}
          {showEyeBlack && (
            <>
              <mesh position={[-0.035, 0.01, 0.08]} rotation={[0, 0, -0.2]}>
                <boxGeometry args={[0.04, 0.015, 0.005]} />
                <primitive object={materials.eyeBlack} />
              </mesh>
              <mesh position={[0.035, 0.01, 0.08]} rotation={[0, 0, 0.2]}>
                <boxGeometry args={[0.04, 0.015, 0.005]} />
                <primitive object={materials.eyeBlack} />
              </mesh>
            </>
          )}
        </group>

        {/* ====== NECK ====== */}
        <mesh position={[0, 1.57, 0]} castShadow={castShadow}>
          <cylinderGeometry args={[0.06, 0.08, 0.12, 12]} />
          <primitive object={materials.skin} />
        </mesh>

        {/* ====== SHOULDER PADS ====== */}
        <group position={[0, 1.42, 0]} scale={[bs.shoulder, 1, 1]}>
          {/* Main pad body */}
          <mesh castShadow={castShadow}>
            <boxGeometry args={[0.56, 0.14, 0.28]} />
            <primitive object={materials.jersey} />
          </mesh>

          {/* Rounded shoulder caps */}
          {[0.29, -0.29].map((x, i) => (
            <group key={`sc-${i}`} position={[x, 0, 0]}>
              <mesh castShadow={castShadow}>
                <sphereGeometry args={[0.1, 12, 12]} />
                <primitive object={materials.jersey} />
              </mesh>
              {/* Pad stitching detail */}
              <mesh position={[x > 0 ? 0.02 : -0.02, 0, 0.06]}>
                <boxGeometry args={[0.005, 0.08, 0.005]} />
                <primitive object={materials.secondary} />
              </mesh>
            </group>
          ))}

          {/* Neck roll */}
          <mesh position={[0, 0.08, -0.1]} castShadow={castShadow}>
            <capsuleGeometry args={[0.05, 0.28, 8, 12]} />
            <primitive object={materials.darkGray} />
          </mesh>

          {/* Collar opening */}
          <mesh position={[0, 0.07, 0.06]}>
            <boxGeometry args={[0.18, 0.02, 0.1]} />
            <primitive object={materials.secondary} />
          </mesh>
        </group>

        {/* ====== TORSO / JERSEY ====== */}
        <group scale={[bs.torso, 1, bs.torso]}>
          {/* Upper torso */}
          <mesh position={[0, 1.18, 0]} castShadow={castShadow}>
            <boxGeometry args={[0.4, 0.32, 0.22]} />
            <primitive object={materials.jersey} />
          </mesh>

          {/* Lower torso - tapered */}
          <mesh position={[0, 0.92, 0]} castShadow={castShadow}>
            <boxGeometry args={[0.36, 0.2, 0.18]} />
            <primitive object={materials.jersey} />
          </mesh>

          {/* Jersey side stripes */}
          {[0.205, -0.205].map((x, i) => (
            <mesh key={`js-${i}`} position={[x, 1.08, 0]}>
              <boxGeometry args={[0.01, 0.42, 0.22]} />
              <primitive object={materials.secondary} />
            </mesh>
          ))}

          {/* Jersey number - front white background patch */}
          <mesh position={[0, 1.18, 0.115]}>
            <planeGeometry args={[0.2, 0.16]} />
            <primitive object={materials.white} />
          </mesh>

          {/* Jersey number - back white background patch */}
          <mesh position={[0, 1.18, -0.115]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.2, 0.16]} />
            <primitive object={materials.white} />
          </mesh>
        </group>

        {/* ====== ARMS ====== */}
        {/* Left arm */}
        <group ref={leftArmRef} position={[-0.3 * bs.shoulder, 1.38, 0]}>
          {/* Upper arm (jersey sleeve) */}
          <mesh position={[0, -0.12, 0]} rotation={[0, 0, 0.15]} castShadow={castShadow}>
            <capsuleGeometry args={[0.06 * bs.arm, 0.18, 8, 12]} />
            <primitive object={materials.jersey} />
          </mesh>
          {/* Sleeve stripe */}
          <mesh position={[-0.02, -0.06, 0]} rotation={[0, 0, 0.15]}>
            <cylinderGeometry args={[0.063 * bs.arm, 0.063 * bs.arm, 0.02, 8]} />
            <primitive object={materials.secondary} />
          </mesh>
          {/* Elbow */}
          <mesh position={[-0.02, -0.25, 0]} castShadow={castShadow}>
            <sphereGeometry args={[0.048 * bs.arm, 12, 12]} />
            <primitive object={materials.skin} />
          </mesh>
          {/* Forearm */}
          <mesh position={[-0.02, -0.37, 0.02]} rotation={[0.25, 0, 0.1]} castShadow={castShadow}>
            <capsuleGeometry args={[0.042 * bs.arm, 0.16, 8, 12]} />
            <primitive object={materials.skin} />
          </mesh>
          {/* Wrist band */}
          <mesh position={[-0.02, -0.45, 0.03]}>
            <cylinderGeometry args={[0.044 * bs.arm, 0.044 * bs.arm, 0.02, 8]} />
            <primitive object={materials.white} />
          </mesh>
          {/* Hand/Glove */}
          <mesh position={[-0.02, -0.5, 0.04]} castShadow={castShadow}>
            <sphereGeometry args={[0.042, 12, 12]} />
            <primitive object={handMat} />
          </mesh>
        </group>

        {/* Right arm (throwing arm) */}
        <group ref={rightArmRef} position={[0.3 * bs.shoulder, 1.38, 0]}>
          {/* Upper arm (jersey sleeve) */}
          <mesh position={[0, -0.12, 0]} rotation={[0, 0, -0.15]} castShadow={castShadow}>
            <capsuleGeometry args={[0.06 * bs.arm, 0.18, 8, 12]} />
            <primitive object={materials.jersey} />
          </mesh>
          {/* Sleeve stripe */}
          <mesh position={[0.02, -0.06, 0]} rotation={[0, 0, -0.15]}>
            <cylinderGeometry args={[0.063 * bs.arm, 0.063 * bs.arm, 0.02, 8]} />
            <primitive object={materials.secondary} />
          </mesh>
          {/* Elbow */}
          <mesh position={[0.02, -0.25, 0]} castShadow={castShadow}>
            <sphereGeometry args={[0.048 * bs.arm, 12, 12]} />
            <primitive object={materials.skin} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0.02, -0.37, 0.02]} rotation={[0.25, 0, -0.1]} castShadow={castShadow}>
            <capsuleGeometry args={[0.042 * bs.arm, 0.16, 8, 12]} />
            <primitive object={materials.skin} />
          </mesh>
          {/* Wrist band */}
          <mesh position={[0.02, -0.45, 0.03]}>
            <cylinderGeometry args={[0.044 * bs.arm, 0.044 * bs.arm, 0.02, 8]} />
            <primitive object={materials.white} />
          </mesh>
          {/* Hand/Glove */}
          <mesh position={[0.02, -0.5, 0.04]} castShadow={castShadow}>
            <sphereGeometry args={[0.042, 12, 12]} />
            <primitive object={handMat} />
          </mesh>
        </group>

        {/* ====== HIPS / BELT ====== */}
        <mesh position={[0, 0.77, 0]} castShadow={castShadow}>
          <boxGeometry args={[0.34, 0.08, 0.17]} />
          <primitive object={materials.black} />
        </mesh>
        {/* Belt buckle */}
        <mesh position={[0, 0.77, 0.088]}>
          <boxGeometry args={[0.04, 0.04, 0.005]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* ====== TOWEL (QB accessory) ====== */}
        {showTowel && (
          <mesh position={[0.12, 0.6, 0.09]} castShadow={castShadow}>
            <boxGeometry args={[0.08, 0.2, 0.015]} />
            <primitive object={materials.white} />
          </mesh>
        )}

        {/* ====== LEGS ====== */}
        {/* Left leg */}
        <group ref={leftLegRef} position={[-0.1, 0.67, 0]}>
          {/* Thigh with thigh pad */}
          <mesh position={[0, -0.15, 0]} castShadow={castShadow}>
            <capsuleGeometry args={[0.068 * bs.leg, 0.2, 8, 12]} />
            <primitive object={materials.pants} />
          </mesh>
          {/* Thigh pad */}
          <mesh position={[0, -0.1, 0.05]}>
            <boxGeometry args={[0.07, 0.1, 0.02]} />
            <primitive object={materials.pants} />
          </mesh>
          {/* Knee pad */}
          <mesh position={[0, -0.33, 0.04]} castShadow={castShadow}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <primitive object={materials.pants} />
          </mesh>
          {/* Lower leg / sock */}
          <mesh position={[0, -0.48, 0]} castShadow={castShadow}>
            <capsuleGeometry args={[0.05, 0.18, 8, 12]} />
            <primitive object={materials.sock} />
          </mesh>
          {/* Sock stripe */}
          <mesh position={[0, -0.42, 0]}>
            <cylinderGeometry args={[0.053, 0.053, 0.015, 8]} />
            <primitive object={materials.secondary} />
          </mesh>
          {/* Cleat */}
          <group position={[0, -0.66, 0.02]}>
            <mesh castShadow={castShadow}>
              <boxGeometry args={[0.08, 0.05, 0.14]} />
              <primitive object={materials.black} />
            </mesh>
            {/* Cleat studs */}
            <mesh position={[0, -0.03, 0]}>
              <boxGeometry args={[0.06, 0.015, 0.1]} />
              <primitive object={materials.white} />
            </mesh>
          </group>
        </group>

        {/* Right leg */}
        <group ref={rightLegRef} position={[0.1, 0.67, 0]}>
          {/* Thigh with thigh pad */}
          <mesh position={[0, -0.15, 0]} castShadow={castShadow}>
            <capsuleGeometry args={[0.068 * bs.leg, 0.2, 8, 12]} />
            <primitive object={materials.pants} />
          </mesh>
          {/* Thigh pad */}
          <mesh position={[0, -0.1, 0.05]}>
            <boxGeometry args={[0.07, 0.1, 0.02]} />
            <primitive object={materials.pants} />
          </mesh>
          {/* Knee pad */}
          <mesh position={[0, -0.33, 0.04]} castShadow={castShadow}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <primitive object={materials.pants} />
          </mesh>
          {/* Lower leg / sock */}
          <mesh position={[0, -0.48, 0]} castShadow={castShadow}>
            <capsuleGeometry args={[0.05, 0.18, 8, 12]} />
            <primitive object={materials.sock} />
          </mesh>
          {/* Sock stripe */}
          <mesh position={[0, -0.42, 0]}>
            <cylinderGeometry args={[0.053, 0.053, 0.015, 8]} />
            <primitive object={materials.secondary} />
          </mesh>
          {/* Cleat */}
          <group position={[0, -0.66, 0.02]}>
            <mesh castShadow={castShadow}>
              <boxGeometry args={[0.08, 0.05, 0.14]} />
              <primitive object={materials.black} />
            </mesh>
            {/* Cleat studs */}
            <mesh position={[0, -0.03, 0]}>
              <boxGeometry args={[0.06, 0.015, 0.1]} />
              <primitive object={materials.white} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Ground shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.6, 1]}>
        <circleGeometry args={[0.28, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ============================================
// Preset configurations for different player types
// ============================================

export const PLAYER_PRESETS = {
  quarterback: {
    jerseyColor: '#c41e3a',
    pantsColor: '#1a1a2e',
    helmetColor: '#c41e3a',
    skinTone: '#d4a574',
    scale: 1.0,
    bodyType: 'athletic' as const,
    hasEyeBlack: true,
    hasTowel: true,
    secondaryColor: '#ffd700',
  },
  receiver: {
    jerseyColor: '#c41e3a',
    pantsColor: '#1a1a2e',
    helmetColor: '#c41e3a',
    skinTone: '#8d5524',
    scale: 0.95,
    bodyType: 'lean' as const,
    hasGloves: true,
    glovesColor: '#c41e3a',
    secondaryColor: '#ffd700',
  },
  defender: {
    jerseyColor: '#1e3a5f',
    pantsColor: '#ffffff',
    helmetColor: '#1e3a5f',
    skinTone: '#a67c52',
    scale: 1.0,
    bodyType: 'athletic' as const,
    hasGloves: true,
    glovesColor: '#1e3a5f',
    secondaryColor: '#c0c0c0',
  },
} as const;
