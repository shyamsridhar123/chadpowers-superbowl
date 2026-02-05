"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CharacterDefinition } from "@/lib/characters";

// ============================================
// STYLIZED FOOTBALL PLAYER - Proper Human Proportions
// Inspired by Fortnite/NCAA style - low poly but recognizable
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
}

// Reusable materials for performance
const createMaterials = (colors: {
  jersey: string;
  pants: string;
  helmet: string;
  skin: string;
  facemask: string;
}) => ({
  jersey: new THREE.MeshStandardMaterial({
    color: colors.jersey,
    roughness: 0.8,
    metalness: 0.1,
  }),
  pants: new THREE.MeshStandardMaterial({
    color: colors.pants,
    roughness: 0.9,
    metalness: 0.05,
  }),
  helmet: new THREE.MeshStandardMaterial({
    color: colors.helmet,
    roughness: 0.3,
    metalness: 0.6,
  }),
  skin: new THREE.MeshStandardMaterial({
    color: colors.skin,
    roughness: 0.8,
    metalness: 0.0,
  }),
  facemask: new THREE.MeshStandardMaterial({
    color: colors.facemask,
    roughness: 0.4,
    metalness: 0.9,
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
});

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
}: FootballPlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  
  // Animation time
  const animTime = useRef(0);

  // Create materials once
  const materials = useMemo(() => createMaterials({
    jersey: jerseyColor,
    pants: pantsColor,
    helmet: helmetColor,
    skin: skinTone,
    facemask: '#808080',
  }), [jerseyColor, pantsColor, helmetColor, skinTone]);

  // Animation loop
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    animTime.current += delta;
    const t = animTime.current;
    
    // Running animation
    if (animationState === 'running' && isAnimating) {
      const runSpeed = 8;
      const legSwing = Math.sin(t * runSpeed) * 0.6;
      const armSwing = Math.sin(t * runSpeed) * 0.4;
      
      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = armSwing;
      
      // Slight body bob
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.abs(Math.sin(t * runSpeed * 2)) * 0.05;
      }
    }
    
    // Idle animation - subtle breathing/sway
    if (animationState === 'idle') {
      const breathSpeed = 2;
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(t * breathSpeed) * 0.02;
      }
    }
    
    // Throwing animation
    if (animationState === 'throwing') {
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x,
          -Math.PI * 0.7,
          0.15
        );
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z,
          -Math.PI * 0.2,
          0.15
        );
      }
    }
    
    // Celebrating animation
    if (animationState === 'celebrating') {
      const celebSpeed = 4;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -Math.PI * 0.8;
        leftArmRef.current.rotation.z = Math.sin(t * celebSpeed) * 0.3;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -Math.PI * 0.8;
        rightArmRef.current.rotation.z = -Math.sin(t * celebSpeed) * 0.3;
      }
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={position} 
      rotation={[0, rotation, 0]}
      scale={scale}
    >
      {/* Main body container with bob animation */}
      <group ref={bodyRef}>
        
        {/* ====== HELMET ====== */}
        <group position={[0, 1.75, 0]}>
          {/* Main helmet shell */}
          <mesh castShadow={castShadow}>
            <sphereGeometry args={[0.16, 24, 24]} />
            <primitive object={materials.helmet} />
          </mesh>
          
          {/* Helmet front extension */}
          <mesh position={[0, -0.02, 0.08]} castShadow={castShadow}>
            <boxGeometry args={[0.28, 0.22, 0.08]} />
            <primitive object={materials.helmet} />
          </mesh>
          
          {/* Face mask - grid pattern */}
          <group position={[0, -0.04, 0.14]}>
            {/* Horizontal bars */}
            {[-0.05, 0, 0.05].map((y, i) => (
              <mesh key={`h-${i}`} position={[0, y, 0]}>
                <boxGeometry args={[0.16, 0.012, 0.012]} />
                <primitive object={materials.facemask} />
              </mesh>
            ))}
            {/* Vertical bars */}
            {[-0.06, -0.02, 0.02, 0.06].map((x, i) => (
              <mesh key={`v-${i}`} position={[x, 0, 0]}>
                <boxGeometry args={[0.012, 0.12, 0.012]} />
                <primitive object={materials.facemask} />
              </mesh>
            ))}
          </group>
          
          {/* Helmet stripe */}
          <mesh position={[0, 0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.32, 0.03, 0.02]} />
            <primitive object={materials.white} />
          </mesh>
          
          {/* Ear holes */}
          <mesh position={[0.15, -0.02, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
            <primitive object={materials.black} />
          </mesh>
          <mesh position={[-0.15, -0.02, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
            <primitive object={materials.black} />
          </mesh>
        </group>

        {/* ====== FACE (visible through facemask) ====== */}
        <mesh position={[0, 1.7, 0.08]} castShadow={castShadow}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <primitive object={materials.skin} />
        </mesh>

        {/* ====== NECK ====== */}
        <mesh position={[0, 1.55, 0]} castShadow={castShadow}>
          <cylinderGeometry args={[0.06, 0.08, 0.1, 12]} />
          <primitive object={materials.skin} />
        </mesh>

        {/* ====== SHOULDER PADS ====== */}
        <group position={[0, 1.4, 0]}>
          {/* Main pad body */}
          <mesh castShadow={castShadow}>
            <boxGeometry args={[0.55, 0.15, 0.25]} />
            <primitive object={materials.jersey} />
          </mesh>
          
          {/* Shoulder caps - rounded */}
          <mesh position={[0.28, 0, 0]} castShadow={castShadow}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <primitive object={materials.jersey} />
          </mesh>
          <mesh position={[-0.28, 0, 0]} castShadow={castShadow}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <primitive object={materials.jersey} />
          </mesh>
          
          {/* Neck roll */}
          <mesh position={[0, 0.08, -0.08]} castShadow={castShadow}>
            <capsuleGeometry args={[0.05, 0.25, 8, 12]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>

        {/* ====== TORSO / JERSEY ====== */}
        <mesh position={[0, 1.15, 0]} castShadow={castShadow}>
          <boxGeometry args={[0.4, 0.35, 0.22]} />
          <primitive object={materials.jersey} />
        </mesh>
        
        {/* Lower torso - tapered */}
        <mesh position={[0, 0.9, 0]} castShadow={castShadow}>
          <boxGeometry args={[0.35, 0.2, 0.18]} />
          <primitive object={materials.jersey} />
        </mesh>
        
        {/* Jersey number - front */}
        <mesh position={[0, 1.15, 0.115]}>
          <planeGeometry args={[0.15, 0.12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* ====== ARMS ====== */}
        {/* Left arm */}
        <group ref={leftArmRef} position={[-0.28, 1.35, 0]}>
          {/* Upper arm */}
          <mesh position={[0, -0.12, 0]} rotation={[0, 0, 0.15]} castShadow={castShadow}>
            <capsuleGeometry args={[0.055, 0.18, 8, 12]} />
            <primitive object={materials.jersey} />
          </mesh>
          {/* Elbow */}
          <mesh position={[-0.02, -0.24, 0]} castShadow={castShadow}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <primitive object={materials.skin} />
          </mesh>
          {/* Forearm */}
          <mesh position={[-0.02, -0.35, 0.02]} rotation={[0.3, 0, 0.1]} castShadow={castShadow}>
            <capsuleGeometry args={[0.04, 0.15, 8, 12]} />
            <primitive object={materials.skin} />
          </mesh>
          {/* Hand/Glove */}
          <mesh position={[-0.02, -0.48, 0.04]} castShadow={castShadow}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <primitive object={materials.white} />
          </mesh>
        </group>

        {/* Right arm (throwing arm) */}
        <group ref={rightArmRef} position={[0.28, 1.35, 0]}>
          {/* Upper arm */}
          <mesh position={[0, -0.12, 0]} rotation={[0, 0, -0.15]} castShadow={castShadow}>
            <capsuleGeometry args={[0.055, 0.18, 8, 12]} />
            <primitive object={materials.jersey} />
          </mesh>
          {/* Elbow */}
          <mesh position={[0.02, -0.24, 0]} castShadow={castShadow}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <primitive object={materials.skin} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0.02, -0.35, 0.02]} rotation={[0.3, 0, -0.1]} castShadow={castShadow}>
            <capsuleGeometry args={[0.04, 0.15, 8, 12]} />
            <primitive object={materials.skin} />
          </mesh>
          {/* Hand/Glove */}
          <mesh position={[0.02, -0.48, 0.04]} castShadow={castShadow}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <primitive object={materials.white} />
          </mesh>
        </group>

        {/* ====== HIPS / BELT ====== */}
        <mesh position={[0, 0.75, 0]} castShadow={castShadow}>
          <boxGeometry args={[0.32, 0.08, 0.16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>

        {/* ====== LEGS ====== */}
        {/* Left leg */}
        <group ref={leftLegRef} position={[-0.1, 0.65, 0]}>
          {/* Thigh */}
          <mesh position={[0, -0.18, 0]} castShadow={castShadow}>
            <capsuleGeometry args={[0.065, 0.22, 8, 12]} />
            <primitive object={materials.pants} />
          </mesh>
          {/* Knee pad */}
          <mesh position={[0, -0.35, 0.03]} castShadow={castShadow}>
            <boxGeometry args={[0.08, 0.06, 0.04]} />
            <primitive object={materials.pants} />
          </mesh>
          {/* Lower leg */}
          <mesh position={[0, -0.5, 0]} castShadow={castShadow}>
            <capsuleGeometry args={[0.05, 0.2, 8, 12]} />
            <primitive object={materials.pants} />
          </mesh>
          {/* Cleat */}
          <mesh position={[0, -0.68, 0.02]} castShadow={castShadow}>
            <boxGeometry args={[0.08, 0.06, 0.14]} />
            <primitive object={materials.black} />
          </mesh>
        </group>

        {/* Right leg */}
        <group ref={rightLegRef} position={[0.1, 0.65, 0]}>
          {/* Thigh */}
          <mesh position={[0, -0.18, 0]} castShadow={castShadow}>
            <capsuleGeometry args={[0.065, 0.22, 8, 12]} />
            <primitive object={materials.pants} />
          </mesh>
          {/* Knee pad */}
          <mesh position={[0, -0.35, 0.03]} castShadow={castShadow}>
            <boxGeometry args={[0.08, 0.06, 0.04]} />
            <primitive object={materials.pants} />
          </mesh>
          {/* Lower leg */}
          <mesh position={[0, -0.5, 0]} castShadow={castShadow}>
            <capsuleGeometry args={[0.05, 0.2, 8, 12]} />
            <primitive object={materials.pants} />
          </mesh>
          {/* Cleat */}
          <mesh position={[0, -0.68, 0.02]} castShadow={castShadow}>
            <boxGeometry args={[0.08, 0.06, 0.14]} />
            <primitive object={materials.black} />
          </mesh>
        </group>
      </group>

      {/* Shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.6, 1]}>
        <circleGeometry args={[0.25, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
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
  },
  receiver: {
    jerseyColor: '#00cc66',
    pantsColor: '#1a1a2e',
    helmetColor: '#00cc66',
    skinTone: '#8d5524',
    scale: 0.95,
  },
  defender: {
    jerseyColor: '#1e3a5f',
    pantsColor: '#ffffff',
    helmetColor: '#1e3a5f',
    skinTone: '#a67c52',
    scale: 1.0,
  },
} as const;
