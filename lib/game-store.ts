// Simple game state store with React hooks
import { create } from "zustand";
import type { GameState, Target, PerformanceMetrics } from "./game-types";

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
  setMode: (mode: GameState["mode"]) => void;
  startGame: () => void;
  resetGame: () => void;
  recordThrow: () => void;
  recordCompletion: (targetId: string) => void;
  updateScore: (points: number) => void;
  setTimeRemaining: (time: number) => void;
  toggleTrajectory: () => void;
  updatePerformance: (metrics: Partial<PerformanceMetrics>) => void;
  resetTargets: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  mode: "menu",
  score: 0,
  throws: 0,
  completions: 0,
  currentTarget: 0,
  targets: generatePracticeTargets(),
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
      timeRemaining: 60,
    }),

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
}));
