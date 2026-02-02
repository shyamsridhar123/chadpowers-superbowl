// Simple game state store with React hooks
import { create } from "zustand";
import type { GameState, Target, PerformanceMetrics, ReceiverData, RouteType, ROUTE_DEFINITIONS, PlayStatus, ScoreMultipliers, BonusIndicator, DefenderData } from "./game-types";
import { ROUTE_DEFINITIONS as ROUTES } from "./game-types";

// Generate receivers with random routes for challenge mode
function generateChallengeReceivers(): ReceiverData[] {
  const routeTypes: RouteType[] = ['slant', 'post', 'corner', 'go', 'out', 'curl', 'drag'];
  
  return [
    {
      id: 'receiver-1',
      startPosition: [-8, 0, -2],
      route: ROUTES.slant(-8, -2),
      state: 'idle',
      progress: 0,
      speed: 6,
      catchRadius: 1.5,
    },
    {
      id: 'receiver-2',
      startPosition: [8, 0, -2],
      route: ROUTES.post(8, -2),
      state: 'idle',
      progress: 0,
      speed: 5.5,
      catchRadius: 1.5,
    },
    {
      id: 'receiver-3',
      startPosition: [-4, 0, -1],
      route: ROUTES.drag(-4, -1),
      state: 'idle',
      progress: 0,
      speed: 5,
      catchRadius: 1.8,
    },
  ];
}

// Generate defenders for challenge mode (man coverage on receivers)
function generateChallengeDefenders(receivers: ReceiverData[]): DefenderData[] {
  // Create 1-2 defenders that cover specific receivers
  const numDefenders = Math.min(2, receivers.length);
  const defenders: DefenderData[] = [];
  
  for (let i = 0; i < numDefenders; i++) {
    const receiver = receivers[i];
    // Start defenders slightly behind and offset from their assigned receiver
    const offsetX = (i % 2 === 0 ? 1 : -1) * 1.5;
    const offsetZ = 2; // Start behind the receiver
    
    defenders.push({
      id: `defender-${i + 1}`,
      position: [
        receiver.startPosition[0] + offsetX,
        0,
        receiver.startPosition[2] + offsetZ
      ],
      startPosition: [
        receiver.startPosition[0] + offsetX,
        0,
        receiver.startPosition[2] + offsetZ
      ],
      coverageType: 'man',
      assignedReceiverId: receiver.id,
      speed: 5.2, // Slightly slower than receivers (5-6 speed)
      reactionDelay: 0.15, // 150ms reaction delay
    });
  }
  
  return defenders;
}

function generatePracticeTargets(): Target[] {
  return [
    {
      id: "target-10",
      position: [0, 1.5, -10],
      radius: 1.5,
      distance: 10,
      hit: false,
      points: 100,
    },
    {
      id: "target-20",
      position: [-3, 1.5, -20],
      radius: 1.2,
      distance: 20,
      hit: false,
      points: 200,
    },
    {
      id: "target-30",
      position: [3, 1.5, -30],
      radius: 1.0,
      distance: 30,
      hit: false,
      points: 300,
    },
    {
      id: "target-40",
      position: [0, 1.5, -40],
      radius: 0.8,
      distance: 40,
      hit: false,
      points: 500,
    },
  ];
}

interface GameStore extends GameState {
  performance: PerformanceMetrics;
  receivers: ReceiverData[];
  defenders: DefenderData[];
  playStartTime: number | null;
  playStatus: PlayStatus;
  multipliers: ScoreMultipliers;
  bonusIndicators: BonusIndicator[];
  setMode: (mode: GameState["mode"]) => void;
  startGame: () => void;
  startChallenge: () => void;
  resetGame: () => void;
  recordThrow: () => void;
  recordCompletion: (targetId: string) => void;
  updateScore: (points: number) => void;
  setTimeRemaining: (time: number) => void;
  toggleTrajectory: () => void;
  updatePerformance: (metrics: Partial<PerformanceMetrics>) => void;
  resetTargets: () => void;
  // Receiver management
  startPlay: () => void;
  updateReceiverProgress: (deltaTime: number) => void;
  setReceiverState: (id: string, state: ReceiverData['state']) => void;
  resetReceivers: () => void;
  // Defender management
  updateDefenderPositions: (receiverPositions: Map<string, [number, number, number]>, deltaTime: number) => void;
  // Challenge mode
  setPlayStatus: (status: PlayStatus) => void;
  setMultipliers: (multipliers: Partial<ScoreMultipliers>) => void;
  addBonusIndicator: (bonus: Omit<BonusIndicator, 'id' | 'timestamp'>) => void;
  clearBonusIndicators: () => void;
  nextPlay: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  mode: "menu",
  score: 0,
  throws: 0,
  completions: 0,
  currentTarget: 0,
  targets: generatePracticeTargets(),
  receivers: [],
  defenders: [],
  playStartTime: null,
  playStatus: 'ready',
  multipliers: { accuracy: 1.0, timing: 1.0, spiral: 1.0 },
  bonusIndicators: [],
  timeRemaining: 60,
  isPlaying: false,
  showTrajectory: true,
  performance: {
    fps: 60,
    frameTime: 16.67,
    tier: "high",
  },

  setMode: (mode) => set({ mode }),

  startGame: () =>
    set({
      mode: "practice",
      isPlaying: true,
      score: 0,
      throws: 0,
      completions: 0,
      targets: generatePracticeTargets(),
      receivers: [],
      timeRemaining: 60,
    }),

  startChallenge: () => {
    const receivers = generateChallengeReceivers();
    const defenders = generateChallengeDefenders(receivers);
    return set({
      mode: "challenge",
      isPlaying: true,
      score: 0,
      throws: 0,
      completions: 0,
      targets: [],
      receivers,
      defenders,
      timeRemaining: 60,
      playStartTime: null,
      playStatus: 'ready',
      multipliers: { accuracy: 1.0, timing: 1.0, spiral: 1.0 },
      bonusIndicators: [],
    });
  },

  resetGame: () =>
    set({
      mode: "menu",
      isPlaying: false,
      score: 0,
      throws: 0,
      completions: 0,
      targets: generatePracticeTargets(),
      timeRemaining: 60,
    }),

  recordThrow: () => set((state) => ({ throws: state.throws + 1 })),

  recordCompletion: (targetId) =>
    set((state) => ({
      completions: state.completions + 1,
      targets: state.targets.map((t) =>
        t.id === targetId ? { ...t, hit: true } : t
      ),
    })),

  updateScore: (points) => set((state) => ({ score: state.score + points })),

  setTimeRemaining: (time) => set({ timeRemaining: time }),

  toggleTrajectory: () =>
    set((state) => ({ showTrajectory: !state.showTrajectory })),

  updatePerformance: (metrics) =>
    set((state) => ({
      performance: { ...state.performance, ...metrics },
    })),

  resetTargets: () =>
    set({
      targets: generatePracticeTargets(),
    }),

  // Receiver management for challenge mode
  startPlay: () =>
    set((state) => ({
      playStartTime: Date.now(),
      playStatus: 'routes_running',
      receivers: state.receivers.map((r) => ({
        ...r,
        state: 'running' as const,
        progress: 0,
      })),
    })),

  updateReceiverProgress: (deltaTime: number) =>
    set((state) => {
      if (!state.playStartTime) return state;
      
      return {
        receivers: state.receivers.map((receiver) => {
          if (receiver.state !== 'running') return receiver;
          
          const newProgress = Math.min(
            1,
            receiver.progress + (deltaTime / 1000) / receiver.route.duration
          );
          
          // If route complete, stop running
          if (newProgress >= 1) {
            return { ...receiver, progress: 1, state: 'idle' as const };
          }
          
          return { ...receiver, progress: newProgress };
        }),
      };
    }),

  setReceiverState: (id: string, newState: ReceiverData['state']) =>
    set((state) => ({
      receivers: state.receivers.map((r) =>
        r.id === id ? { ...r, state: newState } : r
      ),
    })),

  resetReceivers: () => {
    const receivers = generateChallengeReceivers();
    const defenders = generateChallengeDefenders(receivers);
    return set({
      receivers,
      defenders,
      playStartTime: null,
      playStatus: 'ready',
    });
  },

  // Defender AI: update positions to track assigned receivers
  updateDefenderPositions: (receiverPositions: Map<string, [number, number, number]>, deltaTime: number) =>
    set((state) => {
      if (!state.playStartTime) return state;
      
      const playTime = (Date.now() - state.playStartTime) / 1000;
      
      return {
        defenders: state.defenders.map((defender) => {
          // Apply reaction delay before defender starts tracking
          if (playTime < defender.reactionDelay) {
            return defender;
          }
          
          if (defender.coverageType === 'man' && defender.assignedReceiverId) {
            const targetPos = receiverPositions.get(defender.assignedReceiverId);
            if (!targetPos) return defender;
            
            // Calculate direction to receiver (with slight offset to stay behind)
            const dx = targetPos[0] - defender.position[0];
            const dz = (targetPos[2] + 1) - defender.position[2]; // Stay 1 unit behind
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            // Move toward receiver if not already close
            if (dist > 0.5) {
              const moveSpeed = defender.speed * (deltaTime / 1000);
              const moveX = (dx / dist) * Math.min(moveSpeed, dist);
              const moveZ = (dz / dist) * Math.min(moveSpeed, dist);
              
              return {
                ...defender,
                position: [
                  defender.position[0] + moveX,
                  0,
                  defender.position[2] + moveZ,
                ] as [number, number, number],
              };
            }
          }
          
          return defender;
        }),
      };
    }),

  // Challenge mode specific
  setPlayStatus: (status: PlayStatus) =>
    set({ playStatus: status }),

  setMultipliers: (multipliers: Partial<ScoreMultipliers>) =>
    set((state) => ({
      multipliers: { ...state.multipliers, ...multipliers },
    })),

  addBonusIndicator: (bonus: Omit<BonusIndicator, 'id' | 'timestamp'>) =>
    set((state) => ({
      bonusIndicators: [
        ...state.bonusIndicators,
        {
          ...bonus,
          id: `bonus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        },
      ],
    })),

  clearBonusIndicators: () =>
    set({ bonusIndicators: [] }),

  nextPlay: () => {
    const receivers = generateChallengeReceivers();
    const defenders = generateChallengeDefenders(receivers);
    return set({
      receivers,
      defenders,
      playStartTime: null,
      playStatus: 'ready',
      multipliers: { accuracy: 1.0, timing: 1.0, spiral: 1.0 },
      bonusIndicators: [],
    });
  },
}));
