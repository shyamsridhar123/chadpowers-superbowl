// Game Types for Chad Powers Football

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface BallState {
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number, number];
  angularVelocity: [number, number, number];
  isActive: boolean;
}

export interface PlayerState {
  position: [number, number, number];
}

export interface PhysicsState {
  ball: BallState;
  player: PlayerState;
}

export interface Target {
  id: string;
  position: [number, number, number];
  radius: number;
  distance: number; // yards
  hit: boolean;
  points: number;
}

export interface GameState {
  mode: 'menu' | 'practice' | 'challenge' | 'replay';
  score: number;
  throws: number;
  completions: number;
  currentTarget: number;
  targets: Target[];
  timeRemaining: number;
  isPlaying: boolean;
  showTrajectory: boolean;
}

export interface ThrowData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  velocity: number;
  angle: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  tier: 'high' | 'medium' | 'low';
}
