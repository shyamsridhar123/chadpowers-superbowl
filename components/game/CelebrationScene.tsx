"use client";

import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles, Float, Text, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, DepthOfField } from "@react-three/postprocessing";
import { animated, useSpring, useSprings, config } from "@react-spring/three";
import * as THREE from "three";
import confetti from "canvas-confetti";
import { getDeviceProfile, type DeviceProfile } from "@/lib/performance";
import type { CelebrationData } from "@/lib/game-types";

// Confetti cannon for 2D overlay
function fireCelebrationConfetti(reason: CelebrationData["reason"]) {
  const duration = reason === "touchdown" ? 4000 : 3000;
  const end = Date.now() + duration;

  const footballShape = confetti.shapeFromText({ text: "\u{1F3C8}", scalar: 2 });

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#ffd700", "#ff6b00", "#00ffff", "#ffffff"],
      shapes: ["circle", "square", footballShape],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#ffd700", "#ff6b00", "#00ffff", "#ffffff"],
      shapes: ["circle", "square", footballShape],
      disableForReducedMotion: true,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

// 3D Confetti particle system
function ConfettiParticles({ count = 80 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particles = useMemo(() => {
    const temp: {
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      rotation: THREE.Euler;
      rotSpeed: THREE.Vector3;
      scale: number;
      color: THREE.Color;
    }[] = [];
    const colors = ["#ffd700", "#ff6b00", "#00ffff", "#ff4444", "#00ff00", "#ffffff"];

    for (let i = 0; i < count; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 30,
          15 + Math.random() * 20,
          (Math.random() - 0.5) * 30
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          -(1 + Math.random() * 3),
          (Math.random() - 0.5) * 2
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4
        ),
        scale: 0.15 + Math.random() * 0.25,
        color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
      });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorArray = useMemo(() => {
    const arr = new Float32Array(count * 3);
    particles.forEach((p, i) => {
      arr[i * 3] = p.color.r;
      arr[i * 3 + 1] = p.color.g;
      arr[i * 3 + 2] = p.color.b;
    });
    return arr;
  }, [count, particles]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    particles.forEach((p, i) => {
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.rotation.x += p.rotSpeed.x * delta;
      p.rotation.y += p.rotSpeed.y * delta;
      p.rotation.z += p.rotSpeed.z * delta;
      p.velocity.y -= 2 * delta; // gravity

      // Reset when too low
      if (p.position.y < -5) {
        p.position.set(
          (Math.random() - 0.5) * 30,
          15 + Math.random() * 10,
          (Math.random() - 0.5) * 30
        );
        p.velocity.set(
          (Math.random() - 0.5) * 2,
          -(1 + Math.random() * 3),
          (Math.random() - 0.5) * 2
        );
      }

      dummy.position.copy(p.position);
      dummy.rotation.copy(p.rotation);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial transparent opacity={0.9} side={THREE.DoubleSide}>
        <instancedBufferAttribute
          attach="geometry-attributes-color"
          args={[colorArray, 3]}
        />
      </meshBasicMaterial>
    </instancedMesh>
  );
}

// Celebration trophy floating in the center
function CelebrationTrophy({ reason }: { reason: CelebrationData["reason"] }) {
  const groupRef = useRef<THREE.Group>(null);

  const { scale } = useSpring({
    from: { scale: 0 },
    to: { scale: 1 },
    config: { tension: 200, friction: 12 },
    delay: 500,
  });

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
  });

  const isTouchdown = reason === "touchdown";

  return (
    <animated.group ref={groupRef} position={[0, 4, -15]} scale={scale}>
      <Float speed={2} floatIntensity={1} rotationIntensity={0.3}>
        {/* Football trophy */}
        <group>
          {/* Ball */}
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
          {/* Glow */}
          <pointLight
            position={[0, 1, 0]}
            color={isTouchdown ? "#ffd700" : "#00ffff"}
            intensity={5}
            distance={10}
          />
        </group>
      </Float>
    </animated.group>
  );
}

// Orbiting camera for celebration scene
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

// Main celebration 3D content
function CelebrationContent({
  celebrationData,
  profile,
}: {
  celebrationData: CelebrationData;
  profile: DeviceProfile;
}) {
  const isTouchdown = celebrationData.reason === "touchdown";
  const sparkleCount = profile.tier === "high" ? 300 : profile.tier === "medium" ? 150 : 50;
  const confettiCount = profile.tier === "high" ? 80 : profile.tier === "medium" ? 40 : 0;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 20, 5]} intensity={1.2} />
      <pointLight
        position={[0, 10, -15]}
        color={isTouchdown ? "#ffd700" : "#00ffff"}
        intensity={3}
        distance={40}
      />

      {/* Celebration camera orbit */}
      <CelebrationCamera />

      {/* Trophy */}
      <CelebrationTrophy reason={celebrationData.reason} />

      {/* 3D Sparkles */}
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

      {/* More sparkles in a different color */}
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

      {/* 3D Confetti (high/medium tier only) */}
      {confettiCount > 0 && <ConfettiParticles count={confettiCount} />}

      {/* 3D Title Text */}
      <Float speed={1.5} floatIntensity={0.5} position={[0, 9, -15]}>
        <Text
          fontSize={2}
          color={isTouchdown ? "#ffd700" : "#00ffff"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
          font="/fonts/inter-bold.woff"
        >
          {isTouchdown ? "TOUCHDOWN!" : "GAME OVER"}
        </Text>
      </Float>

      {/* Score display */}
      <Float speed={1} floatIntensity={0.3} position={[0, 6.5, -15]}>
        <Text
          fontSize={1.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
          font="/fonts/inter-bold.woff"
        >
          {celebrationData.finalScore.toLocaleString()} PTS
        </Text>
      </Float>

      {/* Post-processing (high tier only) */}
      {profile.tier === "high" && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.4}
            luminanceSmoothing={0.5}
            intensity={1.2}
          />
          <Vignette offset={0.3} darkness={0.7} />
          <DepthOfField
            focusDistance={0.02}
            focalLength={0.04}
            bokehScale={2}
          />
        </EffectComposer>
      )}

      {/* Sky sphere */}
      <mesh>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial color="#0a0e1a" side={THREE.BackSide} />
      </mesh>

      {/* Ground plane for reference */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -15]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0a2e0a" roughness={0.9} />
      </mesh>

      <fog attach="fog" args={["#0a0e1a", 30, 80]} />
    </>
  );
}

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

  // Fire 2D confetti on mount
  useEffect(() => {
    fireCelebrationConfetti(celebrationData.reason);
    // Delay stats reveal for dramatic effect
    const timer = setTimeout(() => setShowStats(true), 1500);
    return () => clearTimeout(timer);
  }, [celebrationData.reason]);

  const isTouchdown = celebrationData.reason === "touchdown";

  return (
    <div className="fixed inset-0 bg-[#0a0e1a]">
      {/* 3D Celebration Canvas */}
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
            className="bg-black/80 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 max-w-md w-full mx-4 pointer-events-auto"
            style={{
              animation: "slideUp 0.6s ease-out forwards",
              boxShadow: isTouchdown
                ? "0 0 40px rgba(255, 215, 0, 0.3)"
                : "0 0 40px rgba(0, 255, 255, 0.3)",
            }}
          >
            {/* Score */}
            <div
              className="text-5xl font-bold mb-4"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                color: isTouchdown ? "#ffd700" : "#00ffff",
                textShadow: isTouchdown
                  ? "0 0 20px rgba(255, 215, 0, 0.5)"
                  : "0 0 20px rgba(0, 255, 255, 0.5)",
              }}
            >
              {celebrationData.finalScore.toLocaleString()}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatItem
                label="Throws"
                value={celebrationData.finalThrows.toString()}
                color="#ffffff"
              />
              <StatItem
                label={celebrationData.mode === "practice" ? "Hits" : "Catches"}
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

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Stat item component
function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-white/60 uppercase tracking-wider mb-1">{label}</div>
      <div
        className="text-2xl font-bold"
        style={{
          fontFamily: "var(--font-display), sans-serif",
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// Rating display based on score
function RatingDisplay({ score }: { score: number }) {
  const rating = score >= 2800
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
