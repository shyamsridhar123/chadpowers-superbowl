"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { GameScene } from "./GameScene";
import { VirtualJoystick } from "./VirtualJoystick";
import { ThrowZone } from "./ThrowZone";
import { GameHUD } from "./GameHUD";
import { useGameStore } from "@/lib/game-store";
import type { PhysicsState, ThrowData } from "@/lib/game-types";

// Tron-style haptic feedback patterns
const triggerHaptic = (type: "light" | "medium" | "heavy" | "success" | "error") => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    switch (type) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(25);
        break;
      case "heavy":
        navigator.vibrate([50, 30, 50]);
        break;
      case "success":
        navigator.vibrate([30, 50, 30, 50, 100]);
        break;
      case "error":
        navigator.vibrate([100, 30, 100]);
        break;
    }
  }
};

export function GameController() {
  const workerRef = useRef<Worker | null>(null);

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

  // Intro cutscene state
  const [introPlaying, setIntroPlaying] = useState(true);
  const [introSkip, setIntroSkip] = useState(false);

  const handleIntroComplete = useCallback(() => {
    setIntroPlaying(false);
  }, []);

  const handleIntroSkip = useCallback(() => {
    setIntroSkip(true);
  }, []);
  
  // Track receiver positions for collision detection
  const receiverPositionsRef = useRef<Map<string, [number, number, number]>>(new Map());

  const {
    mode,
    targets,
    receivers,
    defenders,
    recordThrow,
    recordCompletion,
    updateScore,
    resetTargets,
    startPlay,
    updateReceiverProgress,
    setReceiverState,
    resetReceivers,
    updateDefenderPositions,
    nextPlay,
  } = useGameStore();

  // Initialize physics worker
  useEffect(() => {
    // Create worker from inline code
    const workerCode = `
      // Tron-style physics constants
      const BALL_SPEED = 32;           // Ball velocity units/sec
      const GRAVITY = -9.81;
      const AIR_RESISTANCE = 0.08;     // Reduced for smoother flight
      const ANGULAR_DAMPING = 0.15;    // Slower spiral decay
      const GROUND_Y = 0.143;
      const FIXED_TIMESTEP = 1000 / 60;
      const RELEASE_HEIGHT = 1.8;

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
        state.ball.velocity[1] *= 1 - AIR_RESISTANCE * dtSeconds * 0.3;
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

    return () => {
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  // Track previous ball active state for detecting when ball lands
  const prevBallActiveRef = useRef(ballState.isActive);
  const hitTargetThisThrowRef = useRef(false);
  const autoResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-reset ball after it lands
  useEffect(() => {
    if (!ballState.isActive && prevBallActiveRef.current) {
      // Ball just landed — auto-reset after a brief delay
      autoResetTimerRef.current = setTimeout(() => {
        workerRef.current?.postMessage({ type: "RESET_BALL" });
      }, 1200);
    }
    if (ballState.isActive && autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = null;
    }
    return () => {
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
    };
  }, [ballState.isActive]);

  // Check for target hits (practice) and receiver catches (challenge)
  useEffect(() => {
    if (!ballState.isActive) {
      // Ball just landed - check if it was a miss
      if (prevBallActiveRef.current && !hitTargetThisThrowRef.current) {
        // Ball landed without hitting any target
        triggerHaptic("error");
      }
      
      // Reset receivers to idle when ball JUST landed (challenge mode)
      if (prevBallActiveRef.current && mode === 'challenge') {
        resetReceivers();
      }
      
      prevBallActiveRef.current = false;
      return;
    }

    // Ball just became active (new throw)
    if (!prevBallActiveRef.current) {
      hitTargetThisThrowRef.current = false;
      triggerHaptic("medium"); // Throw feedback
    }
    prevBallActiveRef.current = true;

    const ballPos = ballState.position;

    // Practice mode: Check targets
    if (mode === 'practice') {
      targets.forEach((target) => {
        if (target.hit) return;

        const dx = ballPos[0] - target.position[0];
        const dy = ballPos[1] - target.position[1];
        const dz = ballPos[2] - target.position[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Forgiving catch radius: base radius + generous distance bonus
        const distanceBonus = target.distance > 25 ? 2.5 : target.distance > 15 ? 2.0 : 1.5;
        const catchRadius = target.radius + distanceBonus;

        if (distance < catchRadius) {
          recordCompletion(target.id);
          updateScore(target.points);
          hitTargetThisThrowRef.current = true;
          triggerHaptic("success");
        }
      });
    }
    
    // Challenge mode: Check receiver catches
    if (mode === 'challenge') {
      receivers.forEach((receiver) => {
        if (receiver.state !== 'running') return;
        
        const receiverPos = receiverPositionsRef.current.get(receiver.id);
        if (!receiverPos) return;
        
        // Ball height check (receiver can catch between ground and overhead)
        if (ballPos[1] < 0.2 || ballPos[1] > 3.5) return;
        
        const dx = ballPos[0] - receiverPos[0];
        const dz = ballPos[2] - receiverPos[2];
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
        
        if (horizontalDistance < receiver.catchRadius) {
          // Check defender proximity for catch probability
          let catchProbability = 1.0; // 100% catch if no defender nearby
          
          // Find the closest defender to this receiver
          defenders.forEach((defender) => {
            const defDx = defender.position[0] - receiverPos[0];
            const defDz = defender.position[2] - receiverPos[2];
            const defenderDistance = Math.sqrt(defDx * defDx + defDz * defDz);
            
            // Defender within 1 unit: 60% catch chance
            // Defender within 2 units: 85% catch chance
            if (defenderDistance < 1) {
              catchProbability = Math.min(catchProbability, 0.6);
            } else if (defenderDistance < 2) {
              catchProbability = Math.min(catchProbability, 0.85);
            }
          });
          
          // Roll for catch based on probability
          const catchRoll = Math.random();
          if (catchRoll < catchProbability) {
            // Successful catch!
            setReceiverState(receiver.id, 'celebrating');
            recordCompletion(receiver.id);
            
            // Calculate points based on route difficulty
            const routePoints = {
              slant: 100,
              post: 200,
              corner: 200,
              go: 300,
              out: 150,
              curl: 100,
              drag: 100,
            };
            updateScore(routePoints[receiver.route.type] || 100);
            hitTargetThisThrowRef.current = true;
            triggerHaptic("success");
          } else {
            // Defender broke up the pass!
            setReceiverState(receiver.id, 'incomplete');
            triggerHaptic("error");
          }
        }
      });
    }
  }, [ballState.position, ballState.isActive, mode, targets, receivers, defenders, recordCompletion, updateScore, setReceiverState, resetReceivers]);

  // Game loop callback - called from R3F useFrame via GameScene
  const handleFrame = useCallback(
    (delta: number) => {
      workerRef.current?.postMessage({ type: "STEP", data: { delta } });

      if (useGameStore.getState().mode === "challenge") {
        useGameStore.getState().updateReceiverProgress(delta);
        useGameStore.getState().updateDefenderPositions(
          receiverPositionsRef.current,
          delta
        );
      }
    },
    []
  );

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

  // Track receiver positions for collision
  const handleReceiverPositionUpdate = useCallback(
    (id: string, position: [number, number, number]) => {
      receiverPositionsRef.current.set(id, position);
    },
    []
  );

  // Handle throw
  const handleThrowStart = useCallback(() => {
    setIsThrowing(true);
    // In challenge mode, start receivers running when starting to throw
    if (mode === 'challenge') {
      startPlay();
    }
  }, [mode, startPlay]);

  const handleThrowUpdate = useCallback((angle: number, power: number) => {
    setThrowAngle(angle);
    setThrowPower(power);
  }, []);

  const handleThrowEnd = useCallback(
    (throwData: ThrowData) => {
      setIsThrowing(false);

      // velocity is blended from swipe distance + velocity (0-1)
      const rawPower = throwData.velocity;
      const swipeAngle = throwData.angle;

      if (rawPower < 0.01) {
        setThrowAngle(0);
        setThrowPower(0);
        return;
      }

      // Apply power curve: sqrt makes low/mid swipes feel punchier
      // Floor at 0.25 so even a light swipe produces a visible throw
      const power = Math.max(0.25, Math.pow(rawPower, 0.6));

      // Tron-style throw mechanics
      // Power controls distance; ball speed adjusts to reach target
      const BALL_SPEED = 32;
      const minDistance = 8;   // Minimum throw distance (yards)
      const maxDistance = 50;  // Maximum throw distance (yards)

      // Calculate target throw distance based on power
      const throwDistance = minDistance + power * (maxDistance - minDistance);

      // Calculate flight time based on distance and ball speed
      const flightTime = throwDistance / BALL_SPEED;

      // Arc height scales with distance
      const maxHeight = 1.5 + (throwDistance * 0.08);

      // Convert swipe angle to world-space direction
      // Swipe up (PI/2) → forward (-Z), swipe left/right → lateral aim
      const horizontalAim = Math.cos(swipeAngle);
      const upwardComponent = Math.max(0, Math.sin(swipeAngle));
      // Treat any mostly-upward swipe as fully forward
      const forwardBias = Math.max(upwardComponent, 0.6);

      // Forward velocity based on distance and flight time
      const forwardVelocity = throwDistance / flightTime;

      // Vertical velocity to achieve max height at midpoint
      const upVelocity = Math.sqrt(2 * 9.81 * maxHeight);

      // Lateral aim scales with swipe angle
      const sidewaysVelocity = horizontalAim * forwardVelocity * 0.6;

      // Forward is negative Z in Three.js
      const throwForce: [number, number, number] = [
        sidewaysVelocity,
        upVelocity,
        -forwardVelocity * forwardBias
      ];
      
      // Spiral spin for realistic football rotation
      const spin: [number, number, number] = [
        8,                        // Forward spiral
        horizontalAim * 3,        // Slight wobble based on aim
        power * 2                 // Spin speed based on power
      ];

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

  // Next play (challenge mode)
  const handleNextPlay = useCallback(() => {
    nextPlay();
    workerRef.current?.postMessage({ type: "RESET_BALL" });
  }, [nextPlay]);

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
          receivers={receivers}
          defenders={defenders}
          receiverPositions={receiverPositionsRef.current}
          onReceiverPositionUpdate={handleReceiverPositionUpdate}
          onFrame={handleFrame}
          introPlaying={introPlaying}
          introSkip={introSkip}
          onIntroComplete={handleIntroComplete}
        />
      </div>

      {/* HUD - hidden during intro */}
      {!introPlaying && (
        <GameHUD
          onResetBall={handleResetBall}
          onResetTargets={handleResetTargets}
          onNextPlay={handleNextPlay}
          ballIsActive={ballState.isActive}
        />
      )}

      {/* Left control zone - Joystick (hidden during intro) */}
      {!introPlaying && (
        <div className="absolute bottom-8 left-8 z-10">
          <VirtualJoystick
            onMove={handleJoystickMove}
            onEnd={handleJoystickEnd}
            size={120}
          />
        </div>
      )}

      {/* Right control zone - Throw (hidden during intro) */}
      {!introPlaying && (
        <div className="absolute top-0 right-0 bottom-0 w-1/2 z-10">
          <ThrowZone
            onThrowStart={handleThrowStart}
            onThrowEnd={handleThrowEnd}
            onThrowUpdate={handleThrowUpdate}
            disabled={ballState.isActive}
          />
        </div>
      )}

      {/* Intro cutscene skip overlay */}
      {introPlaying && (
        <div
          className="absolute inset-0 z-20 flex items-end justify-center pb-12"
          onPointerDown={handleIntroSkip}
        >
          <div className="text-white/60 text-sm font-medium tracking-wide animate-pulse">
            Tap anywhere to skip
          </div>
        </div>
      )}
    </div>
  );
}
