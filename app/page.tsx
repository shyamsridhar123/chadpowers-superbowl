"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Three.js
const Game = dynamic(() => import("@/components/game/Game").then((mod) => mod.Game), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[#0a1628] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-10 mx-auto mb-4 relative animate-bounce">
          <div
            className="absolute inset-0 rounded-[50%] bg-gradient-to-br from-[#8B4513] to-[#5c2d0e]"
            style={{ transform: "rotate(-30deg)" }}
          />
        </div>
        <div
          className="text-white text-xl font-bold"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Loading...
        </div>
        <div className="text-white/50 text-sm mt-2">Chad Powers Football</div>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a1628]">
      <Game />
    </main>
  );
}
