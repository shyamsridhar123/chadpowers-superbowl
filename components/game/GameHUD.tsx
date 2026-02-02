"use client";

import { useGameStore } from "@/lib/game-store";

interface GameHUDProps {
  onResetBall: () => void;
  onResetTargets: () => void;
  ballIsActive: boolean;
}

export function GameHUD({ onResetBall, onResetTargets, ballIsActive }: GameHUDProps) {
  const { score, throws, completions, targets } = useGameStore();

  const accuracy = throws > 0 ? Math.round((completions / throws) * 100) : 0;
  const targetsHit = targets.filter((t) => t.hit).length;

  return (
    <>
      {/* Top HUD Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          {/* Score */}
          <div className="flex flex-col">
            <span className="text-xs text-white/60 uppercase tracking-wider">Score</span>
            <span
              className="text-3xl font-bold text-white"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              {score.toLocaleString()}
            </span>
          </div>

          {/* Game Title */}
          <div className="flex flex-col items-center">
            <span
              className="text-lg font-bold text-[#ffd700] tracking-wide"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              CHAD POWERS
            </span>
            <span className="text-xs text-white/60 uppercase tracking-widest">
              Super Bowl Edition
            </span>
          </div>

          {/* Stats */}
          <div className="flex flex-col items-end">
            <span className="text-xs text-white/60 uppercase tracking-wider">Accuracy</span>
            <span
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              {accuracy}%
            </span>
          </div>
        </div>
      </div>

      {/* Target Progress */}
      <div className="absolute top-20 left-4 z-20 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <span className="text-xs text-white/60 uppercase tracking-wider block mb-2">
            Targets
          </span>
          <div className="flex gap-2">
            {targets.map((target) => (
              <div
                key={target.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  target.hit
                    ? "bg-green-500 text-white scale-110"
                    : "bg-white/20 text-white/60"
                }`}
              >
                {target.distance}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm text-white/80">
              {targetsHit}/{targets.length} hit
            </span>
          </div>
        </div>
      </div>

      {/* Throw Stats */}
      <div className="absolute top-20 right-4 z-20 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <div className="flex gap-4">
            <div className="text-center">
              <span className="text-xs text-white/60 uppercase tracking-wider block">
                Throws
              </span>
              <span
                className="text-xl font-bold text-white"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                {throws}
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs text-white/60 uppercase tracking-wider block">
                Hits
              </span>
              <span
                className="text-xl font-bold text-green-400"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                {completions}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control buttons - moved to top left area */}
      <div className="absolute top-44 left-4 z-20 flex flex-col gap-3 pointer-events-auto">
        {/* Reset ball button - only show when ball is on ground */}
        {!ballIsActive && (
          <button
            onClick={onResetBall}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-colors active:scale-95"
            aria-label="Reset ball"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span className="text-xs font-medium">Reset Ball</span>
          </button>
        )}

        {/* Reset targets button */}
        <button
          onClick={onResetTargets}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ffd700]/20 backdrop-blur-sm border border-[#ffd700]/30 text-[#ffd700] hover:bg-[#ffd700]/30 transition-colors active:scale-95"
          aria-label="Restart game"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          <span className="text-xs font-medium">Restart</span>
        </button>
      </div>



      {/* All targets hit celebration */}
      {targetsHit === targets.length && targets.length > 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-8 text-center animate-in zoom-in-50 duration-300">
            <div
              className="text-4xl font-bold text-[#ffd700] mb-2"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              TOUCHDOWN!
            </div>
            <div className="text-white/80 text-lg mb-4">All targets hit!</div>
            <div
              className="text-5xl font-bold text-white"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              {score.toLocaleString()}
            </div>
            <div className="text-white/60 text-sm mt-2">
              {completions}/{throws} throws ({accuracy}% accuracy)
            </div>
            <button
              onClick={onResetTargets}
              className="mt-6 px-6 py-3 bg-[#ffd700] text-black font-bold rounded-lg hover:bg-[#ffed4a] transition-colors pointer-events-auto active:scale-95"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </>
  );
}
