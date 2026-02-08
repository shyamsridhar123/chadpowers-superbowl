"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles, Float, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import confetti from "canvas-confetti";
import { getDeviceProfile, type DeviceProfile } from "@/lib/performance";
import type { CelebrationData } from "@/lib/game-types";

// 2D confetti cannon overlay
function fireCelebrationConfetti(reason: CelebrationData["reason"]) {
  const duration = reason === "touchdown" ? 4000 : 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#ffd700", "#ff6b00", "#00ffff", "#ffffff"],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#ffd700", "#ff6b00", "#00ffff", "#ffffff"],
      disableForReducedMotion: true,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

// 3D confetti falling particles using instanced mesh
function ConfettiParticles({ count = 60 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const colors = ["#ffd700", "#ff6b00", "#00ffff", "#ff4444", "#00ff00", "#ffffff"];
    return Array.from({ length: count }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        10 + Math.random() * 20,
        -15 + (Math.random() - 0.5) * 30
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        -(1 + Math.random() * 3),
        (Math.random() - 0.5) * 2
      ),
      rot: new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      ),
      rotSpd: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      ),
      scl: 0.15 + Math.random() * 0.25,
      color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
    }));
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Set initial colors
  useEffect(() => {
    if (!meshRef.current) return;
    particles.forEach((p, i) => {
      meshRef.current!.setColorAt(i, p.color);
    });
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [particles]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    particles.forEach((p, i) => {
      p.pos.addScaledVector(p.vel, delta);
      p.rot.x += p.rotSpd.x * delta;
      p.rot.y += p.rotSpd.y * delta;
      p.rot.z += p.rotSpd.z * delta;
      p.vel.y -= 2 * delta;

      if (p.pos.y < -5) {
        p.pos.set(
          (Math.random() - 0.5) * 30,
          10 + Math.random() * 10,
          -15 + (Math.random() - 0.5) * 30
        );
        p.vel.set(
          (Math.random() - 0.5) * 2,
          -(1 + Math.random() * 3),
          (Math.random() - 0.5) * 2
        );
      }

      dummy.position.copy(p.pos);
      dummy.rotation.copy(p.rot);
      dummy.scale.setScalar(p.scl);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.9}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

// Floating golden trophy
function CelebrationTrophy({ reason }: { reason: CelebrationData["reason"] }) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(0);

  const isTouchdown = reason === "touchdown";

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Animate scale in
    scaleRef.current = Math.min(1, scaleRef.current + delta * 1.5);
    const s = scaleRef.current;
    // Overshoot spring effect
    const spring = s < 1 ? s * (2 - s) * 1.1 : 1;
    groupRef.current.scale.setScalar(spring);
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
  });

  return (
    <group ref={groupRef} position={[0, 4, -15]} scale={0}>
      <Float speed={2} floatIntensity={1} rotationIntensity={0.3}>
        <group>
          {/* Ball shape */}
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.8, 16, 12]} />
            <meshStandardMaterial
              color={isTouchdown ? "#ffd700" : "#c0c0c0"}
              metalness={0.8}
              roughness={0.2}
              emissive={isTouchdown ? "#ff8c00" : "#808080"}
              emissiveIntensity={0.3}
            />
          </mesh>
          {/* Pedestal */}
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.6, 0.8, 0.6, 16]} />
            <meshStandardMaterial
              color={isTouchdown ? "#ffd700" : "#c0c0c0"}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Glow light */}
          <pointLight
            position={[0, 1, 0]}
            color={isTouchdown ? "#ffd700" : "#00ffff"}
            intensity={5}
            distance={10}
          />
        </group>
      </Float>
    </group>
  );
}

// Orbiting camera
function CelebrationCamera() {
  const { camera } = useThree();
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta * 0.3;

    const radius = 18;
    const height = 6 + Math.sin(timeRef.current * 0.5) * 2;
    const x = Math.sin(timeRef.current) * radius;
    const z = -15 + Math.cos(timeRef.current) * radius;

    camera.position.lerp(new THREE.Vector3(x, height, z), 0.02);
    camera.lookAt(new THREE.Vector3(0, 3, -15));
  });

  return null;
}

// 3D scene content
function CelebrationContent({
  celebrationData,
  profile,
}: {
  celebrationData: CelebrationData;
  profile: DeviceProfile;
}) {
  const isTouchdown = celebrationData.reason === "touchdown";
  const sparkleCount =
    profile.tier === "high" ? 200 : profile.tier === "medium" ? 100 : 40;
  const confettiCount =
    profile.tier === "high" ? 60 : profile.tier === "medium" ? 30 : 0;

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 20, 5]} intensity={1.2} />
      <pointLight
        position={[0, 10, -15]}
        color={isTouchdown ? "#ffd700" : "#00ffff"}
        intensity={3}
        distance={40}
      />

      <CelebrationCamera />
      <CelebrationTrophy reason={celebrationData.reason} />

      <Sparkles
        count={sparkleCount}
        speed={2}
        opacity={0.8}
        color={isTouchdown ? "#ffd700" : "#00ffff"}
        size={4}
        scale={[30, 20, 30]}
        position={[0, 5, -15]}
        noise={2}
      />
      <Sparkles
        count={Math.floor(sparkleCount * 0.5)}
        speed={1.5}
        opacity={0.6}
        color="#ffffff"
        size={2}
        scale={[25, 15, 25]}
        position={[0, 8, -15]}
        noise={1.5}
      />

      {confettiCount > 0 && <ConfettiParticles count={confettiCount} />}

      {/* Sky */}
      <mesh>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial color="#0a0e1a" side={THREE.BackSide} />
      </mesh>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -15]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0a2e0a" roughness={0.9} />
      </mesh>

      <fog attach="fog" args={["#0a0e1a", 30, 80]} />
    </>
  );
}

// Stat item
function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className="text-xs text-white/60 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-display), sans-serif", color }}
      >
        {value}
      </div>
    </div>
  );
}

// Star rating
function RatingDisplay({ score }: { score: number }) {
  const rating =
    score >= 2800
      ? { label: "HALL OF FAME", color: "#ffd700", stars: 5 }
      : score >= 2100
        ? { label: "PRO BOWL", color: "#c0c0c0", stars: 4 }
        : score >= 1400
          ? { label: "ALL-PRO", color: "#cd7f32", stars: 3 }
          : score >= 700
            ? { label: "STARTER", color: "#00ffff", stars: 2 }
            : { label: "ROOKIE", color: "#ffffff", stars: 1 };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={i < rating.stars ? rating.color : "none"}
            stroke={i < rating.stars ? rating.color : "#555"}
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
      <span
        className="text-sm font-bold tracking-widest"
        style={{
          fontFamily: "var(--font-display), sans-serif",
          color: rating.color,
          textShadow: `0 0 10px ${rating.color}`,
        }}
      >
        {rating.label}
      </span>
    </div>
  );
}

// Main exported component
interface CelebrationSceneProps {
  celebrationData: CelebrationData;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function CelebrationScene({
  celebrationData,
  onPlayAgain,
  onMainMenu,
}: CelebrationSceneProps) {
  const [profile] = useState(() => getDeviceProfile());
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fireCelebrationConfetti(celebrationData.reason);
    const timer = setTimeout(() => setShowStats(true), 1500);
    return () => clearTimeout(timer);
  }, [celebrationData.reason]);

  const isTouchdown = celebrationData.reason === "touchdown";

  return (
    <div className="fixed inset-0 bg-[#0a0e1a]">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          shadows={false}
          gl={{
            antialias: profile.antialias,
            powerPreference: "high-performance",
            alpha: false,
          }}
          dpr={[1, profile.maxPixelRatio]}
        >
          <PerspectiveCamera
            makeDefault
            position={[0, 6, 5]}
            fov={65}
            near={0.1}
            far={500}
          />
          <CelebrationContent
            celebrationData={celebrationData}
            profile={profile}
          />
        </Canvas>
      </div>

      {/* 2D Stats Overlay */}
      {showStats && (
        <div className="absolute inset-0 z-20 flex items-end justify-center pb-12 pointer-events-none">
          <div
            className="bg-black/80 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 max-w-md w-full mx-4 pointer-events-auto animate-in slide-in-from-bottom-8 duration-500"
            style={{
              boxShadow: isTouchdown
                ? "0 0 40px rgba(255, 215, 0, 0.3)"
                : "0 0 40px rgba(0, 255, 255, 0.3)",
            }}
          >
            {/* Title */}
            <div
              className="text-3xl font-bold mb-2"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                color: isTouchdown ? "#ffd700" : "#00ffff",
                textShadow: isTouchdown
                  ? "0 0 20px rgba(255, 215, 0, 0.5)"
                  : "0 0 20px rgba(0, 255, 255, 0.5)",
              }}
            >
              {isTouchdown ? "TOUCHDOWN!" : "GAME OVER"}
            </div>

            {/* Score */}
            <div
              className="text-5xl font-bold mb-4"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                color: "#ffffff",
              }}
            >
              {celebrationData.finalScore.toLocaleString()}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatItem
                label="Throws"
                value={celebrationData.finalThrows.toString()}
                color="#ffffff"
              />
              <StatItem
                label={
                  celebrationData.mode === "practice" ? "Hits" : "Catches"
                }
                value={celebrationData.finalCompletions.toString()}
                color="#00ff00"
              />
              <StatItem
                label="Accuracy"
                value={`${celebrationData.finalAccuracy}%`}
                color="#00ffff"
              />
            </div>

            {/* Rating */}
            <div className="mb-6">
              <RatingDisplay score={celebrationData.finalScore} />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={onPlayAgain}
                className="px-6 py-3 rounded-lg font-bold text-lg transition-all active:scale-95"
                style={{
                  fontFamily: "var(--font-display), sans-serif",
                  background: isTouchdown ? "#ffd700" : "#00ffff",
                  color: "#000000",
                }}
              >
                Play Again
              </button>
              <button
                onClick={onMainMenu}
                className="px-6 py-3 bg-white/10 border border-white/30 text-white rounded-lg font-bold text-lg transition-all active:scale-95 hover:bg-white/20"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
