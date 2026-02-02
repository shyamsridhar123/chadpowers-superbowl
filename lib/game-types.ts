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

// Route Types for Receivers
export type RouteType = 'slant' | 'post' | 'corner' | 'go' | 'out' | 'curl' | 'drag';

export interface RouteWaypoint {
  position: [number, number, number];
  timing: number; // normalized 0-1, when to reach this point
}

export interface Route {
  type: RouteType;
  waypoints: RouteWaypoint[];
  duration: number; // total route time in seconds
}

export type ReceiverState = 'idle' | 'running' | 'catching' | 'celebrating' | 'incomplete';

export interface ReceiverData {
  id: string;
  startPosition: [number, number, number];
  route: Route;
  state: ReceiverState;
  progress: number; // 0-1 along route
  speed: number; // units per second
  catchRadius: number;
}

// Predefined routes from line of scrimmage
export const ROUTE_DEFINITIONS: Record<RouteType, (startX: number, startZ: number) => Route> = {
  slant: (startX, startZ) => ({
    type: 'slant',
    waypoints: [
      { position: [startX, 0, startZ], timing: 0 },
      { position: [startX, 0, startZ - 3], timing: 0.2 },
      { position: [startX + (startX > 0 ? -8 : 8), 0, startZ - 15], timing: 1 },
    ],
    duration: 2.5,
  }),
  post: (startX, startZ) => ({
    type: 'post',
    waypoints: [
      { position: [startX, 0, startZ], timing: 0 },
      { position: [startX, 0, startZ - 10], timing: 0.4 },
      { position: [startX + (startX > 0 ? -6 : 6), 0, startZ - 25], timing: 1 },
    ],
    duration: 3.5,
  }),
  corner: (startX, startZ) => ({
    type: 'corner',
    waypoints: [
      { position: [startX, 0, startZ], timing: 0 },
      { position: [startX, 0, startZ - 10], timing: 0.4 },
      { position: [startX + (startX > 0 ? 8 : -8), 0, startZ - 25], timing: 1 },
    ],
    duration: 3.5,
  }),
  go: (startX, startZ) => ({
    type: 'go',
    waypoints: [
      { position: [startX, 0, startZ], timing: 0 },
      { position: [startX, 0, startZ - 40], timing: 1 },
    ],
    duration: 4.0,
  }),
  out: (startX, startZ) => ({
    type: 'out',
    waypoints: [
      { position: [startX, 0, startZ], timing: 0 },
      { position: [startX, 0, startZ - 8], timing: 0.5 },
      { position: [startX + (startX > 0 ? 10 : -10), 0, startZ - 8], timing: 1 },
    ],
    duration: 2.0,
  }),
  curl: (startX, startZ) => ({
    type: 'curl',
    waypoints: [
      { position: [startX, 0, startZ], timing: 0 },
      { position: [startX, 0, startZ - 12], timing: 0.7 },
      { position: [startX, 0, startZ - 10], timing: 1 },
    ],
    duration: 2.5,
  }),
  drag: (startX, startZ) => ({
    type: 'drag',
    waypoints: [
      { position: [startX, 0, startZ], timing: 0 },
      { position: [startX, 0, startZ - 2], timing: 0.2 },
      { position: [startX + (startX > 0 ? -15 : 15), 0, startZ - 5], timing: 1 },
    ],
    duration: 2.5,
  }),
};

// Play status for challenge mode
export type PlayStatus = 'ready' | 'routes_running' | 'ball_in_air' | 'complete' | 'incomplete';

// Score multipliers for challenge mode
export interface ScoreMultipliers {
  accuracy: number;    // 1.0 - 2.0 based on distance to receiver
  timing: number;      // 1.0 - 1.5 based on when in route
  spiral: number;      // 1.0 - 1.5 based on throw quality
}

// Bonus indicator for UI feedback
export interface BonusIndicator {
  id: string;
  type: 'accuracy' | 'timing' | 'spiral' | 'catch';
  value: number;
  label: string;
  timestamp: number;
}

// Defender coverage types
export type CoverageType = 'man' | 'zone';

// Zone definition for zone coverage
export interface DefenseZone {
  center: [number, number, number];
  radius: number;
}

// Defender data for challenge mode
export interface DefenderData {
  id: string;
  position: [number, number, number];
  startPosition: [number, number, number];
  coverageType: CoverageType;
  assignedReceiverId?: string;  // For man coverage - which receiver to shadow
  zone?: DefenseZone;           // For zone coverage - patrol area
  speed: number;                // Movement speed (slightly slower than receivers)
  reactionDelay: number;        // Delay before tracking (makes man coverage beatable)
}
