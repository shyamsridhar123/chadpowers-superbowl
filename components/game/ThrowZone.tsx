"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import type { ThrowData } from "@/lib/game-types";

interface ThrowZoneProps {
  onThrowStart: () => void;
  onThrowEnd: (throwData: ThrowData) => void;
  onThrowUpdate: (angle: number, power: number) => void;
  disabled?: boolean;
}

// Minimum swipe distance to register as a throw (pixels)
const MIN_SWIPE_DISTANCE = 12;
// Maximum distance for full power (pixels)
const MAX_SWIPE_DISTANCE = 180;
// Maximum velocity for full power (pixels per millisecond)
const MAX_VELOCITY = 0.8;

export function ThrowZone({
  onThrowStart,
  onThrowEnd,
  onThrowUpdate,
  disabled = false,
}: ThrowZoneProps) {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeVector, setSwipeVector] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [power, setPower] = useState(0);
  
  // Track swipe state in refs for immediate access in event handlers
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const currentTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Calculate power from distance (0-1 scale)
  const calculatePower = useCallback((distance: number): number => {
    return Math.min(distance / MAX_SWIPE_DISTANCE, 1);
  }, []);

  // Calculate angle from swipe direction (radians, 0 = right, PI/2 = up)
  const calculateAngle = useCallback((dx: number, dy: number): number => {
    // Invert Y because screen Y increases downward
    return Math.atan2(-dy, dx);
  }, []);

  // Get power color - green to yellow to red
  const getPowerColor = (p: number) => {
    if (p < 0.5) {
      return `rgb(${Math.floor(255 * p * 2)}, 255, 0)`;
    }
    return `rgb(255, ${Math.floor(255 * (1 - (p - 0.5) * 2))}, 0)`;
  };

  // Refs to track the latest callback values for native event listeners
  const onThrowStartRef = useRef(onThrowStart);
  const onThrowEndRef = useRef(onThrowEnd);
  const onThrowUpdateRef = useRef(onThrowUpdate);
  const disabledRef = useRef(disabled);
  const zoneRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync with props
  useEffect(() => {
    onThrowStartRef.current = onThrowStart;
    onThrowEndRef.current = onThrowEnd;
    onThrowUpdateRef.current = onThrowUpdate;
    disabledRef.current = disabled;
  }, [onThrowStart, onThrowEnd, onThrowUpdate, disabled]);

  // Use native event listeners to properly control passive behavior
  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (disabledRef.current) return;
      
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: performance.now()
      };
      currentTouchRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
      
      setIsSwiping(true);
      setSwipeVector({ dx: 0, dy: 0 });
      setPower(0);
      onThrowStartRef.current();

      // Light haptic on touch start
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (!touchStartRef.current || disabledRef.current) return;
      
      const touch = e.touches[0];
      currentTouchRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
      
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const newPower = calculatePower(distance);
      const angle = calculateAngle(dx, dy);
      
      setSwipeVector({ dx, dy });
      setPower(newPower);
      
      // Update trajectory preview in real-time
      onThrowUpdateRef.current(angle, newPower);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (!touchStartRef.current || !currentTouchRef.current) {
        setIsSwiping(false);
        return;
      }
    
    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;
    const startTime = touchStartRef.current.time;
    
    // Use changedTouches for touchend
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = performance.now();
    
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = endTime - startTime;
    
    // Check minimum swipe distance to avoid accidental taps
    if (distance < MIN_SWIPE_DISTANCE) {
      setIsSwiping(false);
      setSwipeVector({ dx: 0, dy: 0 });
      setPower(0);
      touchStartRef.current = null;
      currentTouchRef.current = null;
      onThrowUpdateRef.current(0, 0);
      return;
    }

    // Distance-based power (matches visual feedback the user sees)
    const distancePower = Math.min(distance / MAX_SWIPE_DISTANCE, 1);

    // Velocity bonus (rewards quick flicks)
    const rawVelocity = distance / Math.max(duration, 1);
    const velocityBonus = Math.min(rawVelocity / MAX_VELOCITY, 1);

    // Blend: distance is primary (matches visuals), velocity adds bonus
    const blendedPower = Math.min(distancePower * 0.5 + velocityBonus * 0.5, 1);

    // Calculate angle from swipe direction
    const angle = calculateAngle(dx, dy);

    // Haptic feedback scaled to power
    if (navigator.vibrate) {
      navigator.vibrate(blendedPower > 0.6 ? [20, 10, 20] : [15]);
    }

      const throwData: ThrowData = {
        startX,
        startY,
        endX,
        endY,
        duration,
        velocity: blendedPower,
        angle,
      };

      // Reset state
      setIsSwiping(false);
      setSwipeVector({ dx: 0, dy: 0 });
      setPower(0);
      touchStartRef.current = null;
      currentTouchRef.current = null;

      onThrowEndRef.current(throwData);
    };

    const handleTouchCancel = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      setIsSwiping(false);
      setSwipeVector({ dx: 0, dy: 0 });
      setPower(0);
      touchStartRef.current = null;
      currentTouchRef.current = null;
      onThrowUpdateRef.current(0, 0);
    };

    // Mouse event handlers for desktop support
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      if (disabledRef.current) return;
      
      touchStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: performance.now()
      };
      currentTouchRef.current = {
        x: e.clientX,
        y: e.clientY
      };
      
      setIsSwiping(true);
      setSwipeVector({ dx: 0, dy: 0 });
      setPower(0);
      onThrowStartRef.current();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!touchStartRef.current || disabledRef.current) return;
      
      currentTouchRef.current = {
        x: e.clientX,
        y: e.clientY
      };
      
      const dx = e.clientX - touchStartRef.current.x;
      const dy = e.clientY - touchStartRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const newPower = calculatePower(distance);
      const angle = calculateAngle(dx, dy);
      
      setSwipeVector({ dx, dy });
      setPower(newPower);
      
      onThrowUpdateRef.current(angle, newPower);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      if (!touchStartRef.current || !currentTouchRef.current) {
        setIsSwiping(false);
        return;
      }
    
    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;
    const startTime = touchStartRef.current.time;
    
    const endX = e.clientX;
    const endY = e.clientY;
    const endTime = performance.now();
    
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = endTime - startTime;
    
    // Check minimum swipe distance to avoid accidental taps
    if (distance < MIN_SWIPE_DISTANCE) {
      setIsSwiping(false);
      setSwipeVector({ dx: 0, dy: 0 });
      setPower(0);
      touchStartRef.current = null;
      currentTouchRef.current = null;
      onThrowUpdateRef.current(0, 0);
      return;
    }

    // Distance-based power (matches visual feedback the user sees)
    const distancePower = Math.min(distance / MAX_SWIPE_DISTANCE, 1);

    // Velocity bonus (rewards quick flicks)
    const rawVelocity = distance / Math.max(duration, 1);
    const velocityBonus = Math.min(rawVelocity / MAX_VELOCITY, 1);

    // Blend: distance is primary (matches visuals), velocity adds bonus
    const blendedPower = Math.min(distancePower * 0.5 + velocityBonus * 0.5, 1);

    // Calculate angle from swipe direction
    const angle = calculateAngle(dx, dy);

      const throwData: ThrowData = {
        startX,
        startY,
        endX,
        endY,
        duration,
        velocity: blendedPower,
        angle,
      };
      
      // Reset state
      setIsSwiping(false);
      setSwipeVector({ dx: 0, dy: 0 });
      setPower(0);
      touchStartRef.current = null;
      currentTouchRef.current = null;
      
      onThrowEndRef.current(throwData);
    };

    // Add native event listeners with passive: false to allow preventDefault
    zone.addEventListener('touchstart', handleTouchStart, { passive: false });
    zone.addEventListener('touchmove', handleTouchMove, { passive: false });
    zone.addEventListener('touchend', handleTouchEnd, { passive: false });
    zone.addEventListener('touchcancel', handleTouchCancel, { passive: false });
    
    // Add mouse event listeners for desktop support
    zone.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      zone.removeEventListener('touchstart', handleTouchStart);
      zone.removeEventListener('touchmove', handleTouchMove);
      zone.removeEventListener('touchend', handleTouchEnd);
      zone.removeEventListener('touchcancel', handleTouchCancel);
      zone.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [calculatePower, calculateAngle, onThrowUpdate]);

  // Calculate swipe arrow rotation for display
  const swipeAngle = Math.atan2(swipeVector.dy, swipeVector.dx) * (180 / Math.PI);
  const swipeDistance = Math.sqrt(swipeVector.dx * swipeVector.dx + swipeVector.dy * swipeVector.dy);

  return (
    <div 
      ref={zoneRef}
      className="absolute inset-0 touch-none select-none"
    >
      {/* Swipe zone visual indicator */}
      <div className={`
        absolute inset-0 flex items-center justify-center
        transition-all duration-150
        ${disabled 
          ? "bg-white/5" 
          : isSwiping 
            ? "bg-white/10" 
            : "bg-transparent"
        }
      `}>
        {/* Swipe indicator when active */}
        {isSwiping && swipeDistance > 10 && (
          <div 
            className="absolute"
            style={{
              left: touchStartRef.current ? `${touchStartRef.current.x}px` : '50%',
              top: touchStartRef.current ? `${touchStartRef.current.y}px` : '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Start point indicator */}
            <div className="absolute w-4 h-4 rounded-full bg-white/50 -translate-x-1/2 -translate-y-1/2" />
            
            {/* Swipe line */}
            <div
              className="absolute origin-left h-1 bg-gradient-to-r from-white/60 to-transparent rounded-full"
              style={{
                width: `${Math.min(swipeDistance, MAX_SWIPE_DISTANCE)}px`,
                transform: `rotate(${swipeAngle}deg)`,
              }}
            />
            
            {/* Arrow head at end of swipe */}
            <div
              className="absolute"
              style={{
                left: `${swipeVector.dx}px`,
                top: `${swipeVector.dy}px`,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={getPowerColor(power)}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="-translate-x-1/2 -translate-y-1/2"
                style={{ transform: `translate(-50%, -50%) rotate(${swipeAngle}deg)` }}
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Power display during swipe */}
        {isSwiping && power > 0 && (
          <div 
            className="absolute top-1/4 left-1/2 -translate-x-1/2 text-4xl font-bold"
            style={{ 
              color: getPowerColor(power),
              textShadow: "0 0 20px rgba(0,0,0,0.8)",
              fontFamily: "var(--font-display), sans-serif"
            }}
          >
            {Math.round(power * 100)}%
          </div>
        )}

        {/* Instructions overlay */}
        {!isSwiping && !disabled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center text-white/40 mb-4">
              {/* Swipe gesture icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-2 opacity-60"
              >
                <path d="M12 19V5" />
                <path d="M5 12l7-7 7 7" />
              </svg>
              <p className="text-sm font-medium">Swipe to throw</p>
              <p className="text-xs text-white/30 mt-1">Faster = more power</p>
            </div>
          </div>
        )}

        {/* Disabled state */}
        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/30 text-sm font-medium uppercase tracking-wider">
              Wait for ball...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
