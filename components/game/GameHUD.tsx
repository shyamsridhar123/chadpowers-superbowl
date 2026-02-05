"use client";

import { useGameStore } from "@/lib/game-store";
import { useMemo, useEffect, useState } from "react";
import type { PlayStatus, BonusIndicator } from "@/lib/game-types";

// Achievement thresholds and messages (Tron-style)
function getAchievementMessage(score: number): { message: string; color: string } | null {
  if (score >= 2800) return { message: "HALL OF FAME!", color: "#ffd700" };
  if (score >= 2100) return { message: "PRO BOWL!", color: "#c0c0c0" };
  if (score >= 1400) return { message: "SOLID GAME!", color: "#cd7f32" };
  if (score >= 700) return { message: "KEEP GRINDING!", color: "#00ffff" };
  return null;
}

// Play status display config
const PLAY_STATUS_CONFIG: Record<PlayStatus, { label: string; color: string; glow: string }> = {
  ready: { label: "READY", color: "#00ffff", glow: "0 0 20px #00ffff" },
  routes_running: { label: "ROUTES RUNNING", color: "#ffd700", glow: "0 0 20px #ffd700" },
  ball_in_air: { label: "BALL IN AIR", color: "#ff6b00", glow: "0 0 20px #ff6b00" },
  complete: { label: "COMPLETE!", color: "#00ff00", glow: "0 0 25px #00ff00" },
  incomplete: { label: "INCOMPLETE", color: "#ff4444", glow: "0 0 20px #ff4444" },
};

// Route type display names
const ROUTE_DISPLAY_NAMES: Record<string, string> = {
  slant: "Slant",
  post: "Post",
  corner: "Corner",
  go: "Go",
  out: "Out",
  curl: "Curl",
  drag: "Drag",
};

interface GameHUDProps {
  onResetBall: () => void;
  onResetTargets: () => void;
  onNextPlay?: () => void;
  ballIsActive: boolean;
}

export function GameHUD({ onResetBall, onResetTargets, onNextPlay, ballIsActive }: GameHUDProps) {
  const { 
    score, 
    throws, 
    completions, 
    targets, 
    mode,
    receivers,
    playStatus,
    multipliers,
    bonusIndicators,
    timeRemaining,
    setTimeRemaining,
  } = useGameStore();

  const accuracy = throws > 0 ? Math.round((completions / throws) * 100) : 0;
  const targetsHit = targets.filter((t) => t.hit).length;

  // Get current achievement based on score
  const achievement = useMemo(() => getAchievementMessage(score), [score]);

  // Timer countdown for challenge mode
  const [displayTime, setDisplayTime] = useState(timeRemaining);
  
  useEffect(() => {
    if (mode !== 'challenge') return;
    
    const interval = setInterval(() => {
      setDisplayTime((prev) => {
        const newTime = Math.max(0, prev - 1);
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [mode]);

  // Sync display time with store when store changes externally
  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);
  
  // Update store time separately (not during render)
  useEffect(() => {
    if (mode !== 'challenge') return;
    setTimeRemaining(displayTime);
  }, [displayTime, mode, setTimeRemaining]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate total multiplier
  const totalMultiplier = multipliers.accuracy * multipliers.timing * multipliers.spiral;

  // Clean up old bonus indicators
  const [visibleBonuses, setVisibleBonuses] = useState<BonusIndicator[]>([]);
  
  useEffect(() => {
    setVisibleBonuses(bonusIndicators);
    
    // Remove bonuses after 2 seconds
    const timeout = setTimeout(() => {
      setVisibleBonuses((prev) => 
        prev.filter((b) => Date.now() - b.timestamp < 2000)
      );
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [bonusIndicators]);

  // Render practice mode HUD
  if (mode === 'practice') {
    return <PracticeHUD 
      score={score}
      throws={throws}
      completions={completions}
      accuracy={accuracy}
      targets={targets}
      targetsHit={targetsHit}
      achievement={achievement}
      ballIsActive={ballIsActive}
      onResetBall={onResetBall}
      onResetTargets={onResetTargets}
    />;
  }

  // Challenge Mode HUD
  const statusConfig = PLAY_STATUS_CONFIG[playStatus];
  const isPlayComplete = playStatus === 'complete' || playStatus === 'incomplete';

  return (
    <>
      {/* Top HUD Bar - Challenge Mode */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
          {/* Timer */}
          <div className="flex flex-col">
            <span className="text-xs text-white/60 uppercase tracking-wider">Play Clock</span>
            <span
              className={`text-3xl font-bold tabular-nums ${displayTime <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}
              style={{ 
                fontFamily: "var(--font-display), sans-serif",
                textShadow: displayTime <= 10 ? '0 0 15px #ff0000' : 'none'
              }}
            >
              {formatTime(displayTime)}
            </span>
          </div>

          {/* Play Status */}
          <div className="flex flex-col items-center">
            <span
              className="text-lg font-bold tracking-wide animate-pulse"
              style={{ 
                fontFamily: "var(--font-display), sans-serif",
                color: statusConfig.color,
                textShadow: statusConfig.glow,
              }}
            >
              {statusConfig.label}
            </span>
            <span className="text-xs text-white/60 uppercase tracking-widest">
              Challenge Mode
            </span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-end">
            <span className="text-xs text-white/60 uppercase tracking-wider">Score</span>
            <span
              className="text-3xl font-bold text-[#ffd700]"
              style={{ 
                fontFamily: "var(--font-display), sans-serif",
                textShadow: '0 0 15px rgba(255, 215, 0, 0.5)'
              }}
            >
              {score.toLocaleString()}
            </span>
            {/* Achievement Message */}
            {achievement && (
              <span
                className="text-xs font-bold animate-pulse mt-1"
                style={{ 
                  fontFamily: "var(--font-display), sans-serif",
                  color: achievement.color,
                  textShadow: `0 0 10px ${achievement.color}`
                }}
              >
                {achievement.message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Receivers Display - Left Side */}
      <div className="absolute top-20 left-4 z-20 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-[#00ffff]/30">
          <span className="text-xs text-[#00ffff] uppercase tracking-wider block mb-3 font-bold">
            Receivers
          </span>
          <div className="flex flex-col gap-2">
            {receivers.map((receiver, index) => {
              const routeName = ROUTE_DISPLAY_NAMES[receiver.route.type] || receiver.route.type;
              const isActive = receiver.state === 'running';
              const isCaught = receiver.state === 'celebrating';
              const isIncomplete = receiver.state === 'incomplete';
              
              return (
                <div
                  key={receiver.id}
                  className={`flex items-center gap-2 p-2 rounded transition-all duration-300 ${
                    isCaught 
                      ? 'bg-green-500/30 border border-green-500/50' 
                      : isIncomplete
                        ? 'bg-red-500/20 border border-red-500/30'
                        : isActive
                          ? 'bg-[#ffd700]/20 border border-[#ffd700]/30'
                          : 'bg-white/10 border border-white/20'
                  }`}
                >
                  {/* Receiver Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCaught 
                      ? 'bg-green-500 text-white' 
                      : isIncomplete
                        ? 'bg-red-500/50 text-white/60'
                        : isActive
                          ? 'bg-[#ffd700] text-black'
                          : 'bg-white/30 text-white'
                  }`}>
                    {isCaught ? '✓' : `W${index + 1}`}
                  </div>
                  
                  {/* Route Info */}
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${
                      isCaught ? 'text-green-400' : isActive ? 'text-[#ffd700]' : 'text-white/80'
                    }`}>
                      WR{index + 1}: {routeName}
                    </span>
                    {isActive && (
                      <div className="w-16 h-1 bg-white/20 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-[#ffd700] transition-all duration-100"
                          style={{ width: `${receiver.progress * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Multipliers Display - Right Side */}
      <div className="absolute top-20 right-4 z-20 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-[#ffd700]/30">
          <span className="text-xs text-[#ffd700] uppercase tracking-wider block mb-3 font-bold">
            Multipliers
          </span>
          <div className="space-y-2">
            <MultiplierBar label="Accuracy" value={multipliers.accuracy} maxValue={2.0} color="#00ff00" />
            <MultiplierBar label="Timing" value={multipliers.timing} maxValue={1.5} color="#00ffff" />
            <MultiplierBar label="Spiral" value={multipliers.spiral} maxValue={1.5} color="#ff6b00" />
          </div>
          <div className="mt-3 pt-2 border-t border-white/20">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60 uppercase">Total</span>
              <span 
                className="text-lg font-bold"
                style={{ 
                  fontFamily: "var(--font-display), sans-serif",
                  color: totalMultiplier > 1.5 ? '#ffd700' : '#ffffff',
                  textShadow: totalMultiplier > 1.5 ? '0 0 10px #ffd700' : 'none'
                }}
              >
                {totalMultiplier.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Throw Stats - Bottom Left */}
      <div className="absolute bottom-24 left-4 z-20 pointer-events-none">
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
                Catches
              </span>
              <span
                className="text-xl font-bold text-green-400"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                {completions}
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs text-white/60 uppercase tracking-wider block">
                Accuracy
              </span>
              <span
                className="text-xl font-bold text-[#00ffff]"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                {accuracy}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bonus Indicators - Floating */}
      <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
        {visibleBonuses.map((bonus, index) => (
          <div
            key={bonus.id}
            className="absolute left-1/2 animate-bounce-up"
            style={{
              top: `${30 + index * 12}%`,
              transform: 'translateX(-50%)',
              animation: 'floatUp 2s ease-out forwards',
            }}
          >
            <div 
              className="px-4 py-2 rounded-lg text-center"
              style={{
                background: 'rgba(0,0,0,0.8)',
                border: `2px solid ${getBonusColor(bonus.type)}`,
                boxShadow: `0 0 20px ${getBonusColor(bonus.type)}`,
              }}
            >
              <span 
                className="text-lg font-bold"
                style={{ 
                  color: getBonusColor(bonus.type),
                  fontFamily: "var(--font-display), sans-serif",
                }}
              >
                +{bonus.value}
              </span>
              <span className="text-xs text-white/80 block uppercase tracking-wide">
                {bonus.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Next Play Button - Shows after completion */}
      {isPlayComplete && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto">
          <button
            onClick={onNextPlay}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold text-lg transition-all active:scale-95 ${
              playStatus === 'complete'
                ? 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/50'
                : 'bg-[#ffd700] hover:bg-[#ffed4a] text-black shadow-lg shadow-[#ffd700]/50'
            }`}
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Next Play
          </button>
        </div>
      )}

      {/* Time's Up Overlay */}
      {displayTime === 0 && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none bg-black/60">
          <div className="bg-black/90 backdrop-blur-md rounded-2xl p-8 text-center border-2 border-[#ffd700] animate-in zoom-in-50 duration-300">
            <div
              className="text-4xl font-bold text-[#ffd700] mb-2"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              TIME&apos;S UP!
            </div>
            <div className="text-white/80 text-lg mb-4">Final Score</div>
            <div
              className="text-5xl font-bold text-white"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              {score.toLocaleString()}
            </div>
            <div className="text-white/60 text-sm mt-2">
              {completions}/{throws} completions ({accuracy}% accuracy)
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

// Helper function for bonus colors
function getBonusColor(type: BonusIndicator['type']): string {
  switch (type) {
    case 'accuracy': return '#00ff00';
    case 'timing': return '#00ffff';
    case 'spiral': return '#ff6b00';
    case 'catch': return '#ffd700';
    default: return '#ffffff';
  }
}

// Multiplier bar component
function MultiplierBar({ 
  label, 
  value, 
  maxValue, 
  color 
}: { 
  label: string; 
  value: number; 
  maxValue: number; 
  color: string;
}) {
  const percentage = ((value - 1) / (maxValue - 1)) * 100;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/60 w-16">{label}</span>
      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-300"
          style={{ 
            width: `${Math.min(100, percentage)}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
      <span 
        className="text-xs font-bold w-10 text-right"
        style={{ color }}
      >
        {value.toFixed(1)}x
      </span>
    </div>
  );
}

// Practice Mode HUD (original implementation)
interface PracticeHUDProps {
  score: number;
  throws: number;
  completions: number;
  accuracy: number;
  targets: { id: string; distance: number; hit: boolean }[];
  targetsHit: number;
  achievement: { message: string; color: string } | null;
  ballIsActive: boolean;
  onResetBall: () => void;
  onResetTargets: () => void;
}

function PracticeHUD({
  score,
  throws,
  completions,
  accuracy,
  targets,
  targetsHit,
  achievement,
  ballIsActive,
  onResetBall,
  onResetTargets,
}: PracticeHUDProps) {
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
            {/* Achievement Message */}
            {achievement && (
              <span
                className="text-xs font-bold animate-pulse mt-1"
                style={{ 
                  fontFamily: "var(--font-display), sans-serif",
                  color: achievement.color,
                  textShadow: `0 0 10px ${achievement.color}`
                }}
              >
                {achievement.message}
              </span>
            )}
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
              Practice Mode
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

      {/* Control buttons */}
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
