"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

export function Stadium() {
  const [fieldTexture, setFieldTexture] = useState<THREE.CanvasTexture | null>(null);

  // Create field texture on mount
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Green field
    ctx.fillStyle = "#2d5a27";
    ctx.fillRect(0, 0, 512, 1024);

    // Yard lines
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    for (let i = 0; i <= 10; i++) {
      const y = i * 102.4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      // Yard numbers
      if (i > 0 && i < 10) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        const yardNum = i <= 5 ? i * 10 : (10 - i) * 10;
        ctx.fillText(yardNum.toString(), 50, y + 30);
        ctx.fillText(yardNum.toString(), 462, y + 30);
      }
    }

    // Hash marks
    ctx.lineWidth = 1;
    for (let i = 0; i < 100; i++) {
      const y = i * 10.24;
      ctx.beginPath();
      ctx.moveTo(170, y);
      ctx.lineTo(180, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(332, y);
      ctx.lineTo(342, y);
      ctx.stroke();
    }

    // End zones
    ctx.fillStyle = "#1a3d1a";
    ctx.fillRect(0, 0, 512, 50);
    ctx.fillRect(0, 974, 512, 50);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    setFieldTexture(texture);

    return () => {
      texture.dispose();
    };
  }, []);

  return (
    <group>
      {/* Main field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, -25]}>
        <planeGeometry args={[53.3, 100]} />
        <meshStandardMaterial 
          color={fieldTexture ? undefined : "#2d5a27"} 
          map={fieldTexture ?? undefined} 
        />
      </mesh>

      {/* Field boundaries - sidelines */}
      <mesh position={[-27, 0.01, -25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 100]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[27, 0.01, -25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 100]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* End zone text area */}
      <mesh position={[0, 0.02, 22]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 8]} />
        <meshStandardMaterial color="#0a3d62" />
      </mesh>

      {/* Stadium walls */}
      <mesh position={[-30, 3, -25]}>
        <boxGeometry args={[2, 6, 110]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[30, 3, -25]}>
        <boxGeometry args={[2, 6, 110]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0, 3, -80]}>
        <boxGeometry args={[62, 6, 2]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {/* Stadium lights */}
      {[
        [-25, 15, -50],
        [25, 15, -50],
        [-25, 15, 0],
        [25, 15, 0],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh>
            <boxGeometry args={[3, 1, 3]} />
            <meshStandardMaterial
              color="#ffff00"
              emissive="#ffff00"
              emissiveIntensity={0.5}
            />
          </mesh>
          <pointLight
            color="#fffaf0"
            intensity={100}
            distance={80}
            castShadow
          />
        </group>
      ))}

      {/* Ambient crowd (simple representation) */}
      <mesh position={[-32, 5, -25]}>
        <boxGeometry args={[4, 8, 90]} />
        <meshStandardMaterial color="#2d2d44" />
      </mesh>
      <mesh position={[32, 5, -25]}>
        <boxGeometry args={[4, 8, 90]} />
        <meshStandardMaterial color="#2d2d44" />
      </mesh>
    </group>
  );
}
