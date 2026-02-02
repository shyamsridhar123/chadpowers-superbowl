"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { GameScene } from "./GameScene";
import { VirtualJoystick } from "./VirtualJoystick";
import { ThrowZone } from "./ThrowZone";
import { GameHUD } from "./GameHUD";
import { useGameStore } from "@/lib/game-store";
import type { PhysicsState, ThrowData } from "@/lib/game-types";

export function GameController() {
  const workerRef = useRef<Worker | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [ballState, setBallState] = useState<PhysicsState["ball"]>({
    position: [0, 1.8, 0],
    velocity: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    angularVelocity: [0, 0, 0],
    isActive: false,
  });
  const [throwAngle, setThrowAngle] = useState(0);
  const [throwPower, setThrowPower] = useState(0);
  const [isThrowing, setIsThrowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    mode,
    targets,
    recordThrow,
    recordCompletion,
    updateScore,
    resetTargets,
  } = useGameStore();

  // Initialize physics worker
  useEffect(() => {
    // Create worker from inline code
    const workerCode = `
      const GRAVITY = -9.81;
      const AIR_RESISTANCE = 0.12;
      const ANGULAR_DAMPING = 0.18;
      const GROUND_Y = 0.143;
      const FIXED_TIMESTEP = 1000 / 60;

      let state = {
        ball: {
          position: [0, 1.8, 0],
          velocity: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          angularVelocity: [0, 0, 0],
          isActive: false,
        },
        player: { position: [0, 0, 0] },
      };

      let accumulator = 0;

      function stepPhysics(dt) {
        if (!state.ball.isActive) return;
        const dtSeconds = dt / 1000;
        
        state.ball.velocity[1] += GRAVITY * dtSeconds;
        state.ball.velocity[0] *= 1 - AIR_RESISTANCE * dtSeconds;
        state.ball.velocity[1] *= 1 - AIR_RESISTANCE * dtSeconds * 0.5;
        state.ball.velocity[2] *= 1 - AIR_RESISTANCE * dtSeconds;
        
        state.ball.position[0] += state.ball.velocity[0] * dtSeconds;
        state.ball.position[1] += state.ball.velocity[1] * dtSeconds;
        state.ball.position[2] += state.ball.velocity[2] * dtSeconds;
        
        state.ball.angularVelocity[0] *= 1 - ANGULAR_DAMPING * dtSeconds;
        state.ball.angularVelocity[1] *= 1 - ANGULAR_DAMPING * dtSeconds;
        state.ball.angularVelocity[2] *= 1 - ANGULAR_DAMPING * dtSeconds;
        
        const ax = state.ball.angularVelocity[0] * dtSeconds;
        const ay = state.ball.angularVelocity[1] * dtSeconds;
        const az = state.ball.angularVelocity[2] * dtSeconds;
        const [qx, qy, qz, qw] = state.ball.rotation;
        state.ball.rotation = [
          qx + 0.5 * (qw * ax - qz * ay + qy * az),
          qy + 0.5 * (qz * ax + qw * ay - qx * az),
          qz + 0.5 * (-qy * ax + qx * ay + qw * az),
          qw + 0.5 * (-qx * ax - qy * ay - qz * az),
        ];
        
        const mag = Math.sqrt(
          state.ball.rotation[0] ** 2 + state.ball.rotation[1] ** 2 +
          state.ball.rotation[2] ** 2 + state.ball.rotation[3] ** 2
        );
        state.ball.rotation = state.ball.rotation.map(v => v / mag);
        
        if (state.ball.position[1] <= GROUND_Y) {
          state.ball.position[1] = GROUND_Y;
          state.ball.velocity = [0, 0, 0];
          state.ball.angularVelocity = [0, 0, 0];
          state.ball.isActive = false;
        }
      }

      self.onmessage = (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'STEP':
            accumulator += data.delta;
            while (accumulator >= FIXED_TIMESTEP) {
              stepPhysics(FIXED_TIMESTEP);
              accumulator -= FIXED_TIMESTEP;
            }
            self.postMessage({ type: 'STATE_UPDATE', state: { ball: { ...state.ball }, player: { ...state.player } } });
            break;
          case 'THROW':
            state.ball.position = [state.player.position[0], 1.8, state.player.position[2]];
            state.ball.velocity = [...data.force];
            state.ball.angularVelocity = [...data.spin];
            state.ball.isActive = true;
            break;
          case 'RESET_BALL':
            state.ball = {
              position: [state.player.position[0], 1.8, state.player.position[2]],
              velocity: [0, 0, 0],
              rotation: [0, 0, 0, 1],
              angularVelocity: [0, 0, 0],
              isActive: false,
            };
            break;
          case 'MOVE_PLAYER':
            state.player.position[0] = Math.max(-5, Math.min(5, data.x));
            state.player.position[2] = Math.max(-3, Math.min(3, data.z));
            break;
          case 'INIT':
            state = {
              ball: { position: [0, 1.8, 0], velocity: [0, 0, 0], rotation: [0, 0, 0, 1], angularVelocity: [0, 0, 0], isActive: false },
              player: { position: [0, 0, 0] },
            };
            break;
        }
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (event) => {
      if (event.data.type === "STATE_UPDATE") {
        setBallState(event.data.state.ball);
        setPlayerPosition(event.data.state.player.position);
      }
    };

    workerRef.current.postMessage({ type: "INIT" });
    setIsLoading(false);

    // Game loop
    const gameLoop = (time: number) => {
      const delta = lastTimeRef.current ? time - lastTimeRef.current : 16.67;
      lastTimeRef.current = time;

      workerRef.current?.postMessage({ type: "STEP", data: { delta } });
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  // Check for target hits
  useEffect(() => {
    if (!ballState.isActive) return;

    const ballPos = ballState.position;

    targets.forEach((target) => {
      if (target.hit) return;

      const dx = ballPos[0] - target.position[0];
      const dy = ballPos[1] - target.position[1];
      const dz = ballPos[2] - target.position[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < target.radius + 0.2) {
        recordCompletion(target.id);
        updateScore(target.points);

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([50, 30, 100]);
        }
      }
    });
  }, [ballState.position, ballState.isActive, targets, recordCompletion, updateScore]);

  // Handle joystick movement
  const handleJoystickMove = useCallback(
    (x: number, y: number) => {
      const speed = 5;
      const newX = playerPosition[0] + x * speed * 0.016;
      const newZ = playerPosition[2] + y * speed * 0.016;

      workerRef.current?.postMessage({
        type: "MOVE_PLAYER",
        data: { x: newX, z: newZ },
      });
    },
    [playerPosition]
  );

  const handleJoystickEnd = useCallback(() => {
    // Player stops
  }, []);

  // Handle throw
  const handleThrowStart = useCallback(() => {
    setIsThrowing(true);
  }, []);

  const handleThrowUpdate = useCallback((angle: number, power: number) => {
    setThrowAngle(angle);
    setThrowPower(power);
  }, []);

  const handleThrowEnd = useCallback(
    (throwData: ThrowData) => {
      setIsThrowing(false);

      // velocity now holds the power value (0-1) from the charge meter
      const power = throwData.velocity;
      
      if (power < 0.05) {
        setThrowAngle(0);
        setThrowPower(0);
        return;
      }

      // Calculate throw force based on power meter
      const minForce = 8;
      const maxForce = 28;
      const force = minForce + power * (maxForce - minForce);

      // Throw straight forward with nice arc
      const forwardForce = -force; // Forward (negative Z)
      const upForce = force * 0.5; // Nice arc upward

      const throwForce: [number, number, number] = [0, upForce, forwardForce];
      const spin: [number, number, number] = [5, 0, 0];

      workerRef.current?.postMessage({
        type: "THROW",
        data: { force: throwForce, spin },
      });

      recordThrow();
      setThrowAngle(0);
      setThrowPower(0);
    },
    [recordThrow]
  );

  // Reset ball
  const handleResetBall = useCallback(() => {
    workerRef.current?.postMessage({ type: "RESET_BALL" });
  }, []);

  // Reset all targets
  const handleResetTargets = useCallback(() => {
    resetTargets();
    workerRef.current?.postMessage({ type: "RESET_BALL" });
  }, [resetTargets]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#0a1628] flex items-center justify-center">
        <div className="text-white text-xl font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a1628]">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <GameScene
          playerPosition={playerPosition}
          ballState={ballState}
          throwAngle={throwAngle}
          throwPower={throwPower}
          isThrowing={isThrowing}
        />
      </div>

      {/* HUD */}
      <GameHUD
        onResetBall={handleResetBall}
        onResetTargets={handleResetTargets}
        ballIsActive={ballState.isActive}
      />

      {/* Left control zone - Joystick */}
      <div className="absolute bottom-8 left-8 z-10">
        <VirtualJoystick
          onMove={handleJoystickMove}
          onEnd={handleJoystickEnd}
          size={120}
        />
      </div>

      {/* Right control zone - Throw */}
      <div className="absolute top-0 right-0 bottom-0 w-1/2 z-10">
        <ThrowZone
          onThrowStart={handleThrowStart}
          onThrowEnd={handleThrowEnd}
          onThrowUpdate={handleThrowUpdate}
          disabled={ballState.isActive}
        />
      </div>
    </div>
  );
}
