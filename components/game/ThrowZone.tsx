"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { ThrowData } from "@/lib/game-types";

interface ThrowZoneProps {
  onThrowStart: () => void;
  onThrowEnd: (throwData: ThrowData) => void;
  onThrowUpdate: (angle: number, power: number) => void;
  disabled?: boolean;
}

export function ThrowZone({
  onThrowStart,
  onThrowEnd,
  onThrowUpdate,
  disabled = false,
}: ThrowZoneProps) {
  const [isCharging, setIsCharging] = useState(false);
  const [power, setPower] = useState(0);
  const chargeStartRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  // Power meter animation - hold to charge, release to throw
  const updatePower = useCallback(() => {
    if (!isCharging) return;
    
    const elapsed = performance.now() - chargeStartRef.current;
    // Oscillate power between 0 and 1 over 1.5 seconds
    const cycle = (elapsed % 1500) / 1500;
    const newPower = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
    
    setPower(newPower);
    onThrowUpdate(0, newPower);
    animationRef.current = requestAnimationFrame(updatePower);
  }, [isCharging, onThrowUpdate]);

  useEffect(() => {
    if (isCharging) {
      animationRef.current = requestAnimationFrame(updatePower);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [isCharging, updatePower]);

  const handleStart = useCallback(() => {
    if (disabled) return;
    
    setIsCharging(true);
    setPower(0);
    chargeStartRef.current = performance.now();
    onThrowStart();

    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [disabled, onThrowStart]);

  const handleEnd = useCallback(() => {
    if (!isCharging) return;
    
    cancelAnimationFrame(animationRef.current);
    
    if (navigator.vibrate) {
      navigator.vibrate([20, 10, 20]);
    }

    const throwData: ThrowData = {
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      duration: performance.now() - chargeStartRef.current,
      velocity: power, // Use current power directly
      angle: 0,
    };

    setIsCharging(false);
    setPower(0);
    onThrowEnd(throwData);
  }, [isCharging, power, onThrowEnd]);

  // Get power color - green to yellow to red
  const getPowerColor = (p: number) => {
    if (p < 0.5) {
      return `rgb(${Math.floor(255 * p * 2)}, 255, 0)`;
    }
    return `rgb(255, ${Math.floor(255 * (1 - (p - 0.5) * 2))}, 0)`;
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center touch-none select-none">
      {/* Big throw button */}
      <button
        className={`
          relative w-32 h-32 rounded-full 
          flex flex-col items-center justify-center
          transition-all duration-100 active:scale-95
          ${disabled 
            ? "bg-white/10 border-2 border-white/20" 
            : isCharging 
              ? "bg-white/30 border-4 border-white scale-110" 
              : "bg-white/20 border-2 border-white/40"
          }
        `}
        disabled={disabled}
        onTouchStart={(e) => {
          e.preventDefault();
          handleStart();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleEnd();
        }}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={() => isCharging && handleEnd()}
      >
        {/* Football icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke={disabled ? "rgba(255,255,255,0.3)" : "white"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(45 12 12)" />
          <path d="M8.5 8.5L15.5 15.5" />
          <path d="M9 12L12 15" />
          <path d="M12 9L15 12" />
        </svg>
        
        <span className={`text-xs font-bold mt-2 uppercase tracking-wider ${disabled ? "text-white/30" : "text-white/80"}`}>
          {disabled ? "Wait..." : isCharging ? "Release!" : "Hold"}
        </span>

        {/* Power ring indicator */}
        {isCharging && (
          <svg 
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={getPowerColor(power)}
              strokeWidth="6"
              strokeDasharray={`${power * 289} 289`}
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {/* Power percentage display */}
      {isCharging && (
        <div 
          className="absolute bottom-20 text-4xl font-bold"
          style={{ 
            color: getPowerColor(power),
            textShadow: "0 0 20px rgba(0,0,0,0.8)",
            fontFamily: "var(--font-display), sans-serif"
          }}
        >
          {Math.round(power * 100)}%
        </div>
      )}

      {/* Instructions */}
      {!isCharging && !disabled && (
        <div className="absolute bottom-8 text-center text-white/50 text-sm">
          <p>Hold button to charge power</p>
          <p className="text-xs text-white/30 mt-1">Release at the right moment!</p>
        </div>
      )}
    </div>
  );
}
