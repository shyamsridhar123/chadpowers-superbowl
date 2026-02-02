"use client";

import { useGameStore } from "@/lib/game-store";

export function MainMenu() {
  const { setMode, startGame } = useGameStore();

  const handleStartPractice = () => {
    setMode("practice");
    startGame();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0a1628] via-[#0f2847] to-[#0a1628] flex flex-col items-center justify-center p-6">
      {/* Background stadium silhouette */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#1a3d1a]/20 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-32 bg-[#2d5a27]/10 rounded-[100%]" />
        
        {/* Stadium lights */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#ffd700]/30"
            style={{
              top: `${20 + Math.random() * 30}%`,
              left: `${10 + i * 15}%`,
              boxShadow: "0 0 30px 10px rgba(255,215,0,0.1)",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1
            className="text-5xl font-bold text-white mb-2 tracking-tight"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            CHAD
            <span className="text-[#ffd700]"> POWERS</span>
          </h1>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#ffd700]/50" />
            <span className="text-[#ffd700] text-sm uppercase tracking-[0.3em] font-medium">
              Football
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#ffd700]/50" />
          </div>
          <p className="text-white/60 text-lg">Super Bowl Edition</p>
        </div>

        {/* Football icon */}
        <div className="w-24 h-16 mx-auto mb-8 relative">
          <div
            className="absolute inset-0 rounded-[50%] bg-gradient-to-br from-[#8B4513] to-[#5c2d0e]"
            style={{
              transform: "rotate(-30deg)",
              boxShadow:
                "0 4px 20px rgba(139,69,19,0.4), inset 0 2px 4px rgba(255,255,255,0.1)",
            }}
          >
            {/* Laces */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-4 h-0.5 bg-white/80 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Menu buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleStartPractice}
            className="w-full py-4 px-8 bg-[#ffd700] text-black font-bold text-lg rounded-xl hover:bg-[#ffed4a] transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#ffd700]/20"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            PRACTICE MODE
          </button>

          <button
            disabled
            className="w-full py-4 px-8 bg-white/10 text-white/50 font-bold text-lg rounded-xl cursor-not-allowed border border-white/10"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            CHALLENGE MODE
            <span className="block text-xs font-normal text-white/30 mt-1">
              Coming Soon
            </span>
          </button>
        </div>

        {/* Controls hint */}
        <div className="mt-12 text-white/40 text-sm">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="5 9 2 12 5 15" />
                  <polyline points="9 5 12 2 15 5" />
                  <polyline points="15 19 12 22 9 19" />
                  <polyline points="19 9 22 12 19 15" />
                </svg>
              </div>
              <span>Move</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
              <span>Swipe to throw</span>
            </div>
          </div>
        </div>

        {/* Version */}
        <div className="absolute bottom-4 left-0 right-0 text-center text-white/20 text-xs">
          v1.0 - Built with Three.js
        </div>
      </div>
    </div>
  );
}
