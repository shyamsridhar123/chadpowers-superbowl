"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
  size?: number;
}

export function VirtualJoystick({
  onMove,
  onEnd,
  size = 120,
}: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const centerRef = useRef({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);
  const onMoveRef = useRef(onMove);
  const onEndRef = useRef(onEnd);
  onMoveRef.current = onMove;
  onEndRef.current = onEnd;

  const maxDistance = size / 2 - 20;

  const handleStart = useCallback(
    (clientX: number, clientY: number, touchId?: number) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      touchIdRef.current = touchId ?? null;
      isActiveRef.current = true;
      setIsActive(true);

      const dx = clientX - centerRef.current.x;
      const dy = clientY - centerRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const clampedDistance = Math.min(distance, maxDistance);
      const angle = Math.atan2(dy, dx);

      const clampedX = Math.cos(angle) * clampedDistance;
      const clampedY = Math.sin(angle) * clampedDistance;

      setKnobPosition({ x: clampedX, y: clampedY });
      onMoveRef.current(clampedX / maxDistance, clampedY / maxDistance);
    },
    [maxDistance]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isActiveRef.current) return;

      const dx = clientX - centerRef.current.x;
      const dy = clientY - centerRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const clampedDistance = Math.min(distance, maxDistance);
      const angle = Math.atan2(dy, dx);

      const clampedX = Math.cos(angle) * clampedDistance;
      const clampedY = Math.sin(angle) * clampedDistance;

      setKnobPosition({ x: clampedX, y: clampedY });
      onMoveRef.current(clampedX / maxDistance, clampedY / maxDistance);
    },
    [maxDistance]
  );

  const handleEnd = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);
    setKnobPosition({ x: 0, y: 0 });
    touchIdRef.current = null;
    onEndRef.current();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY, touch.identifier);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === touchIdRef.current) {
          handleMove(e.touches[i].clientX, e.touches[i].clientY);
          break;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          handleEnd();
          break;
        }
      }
    };

    // Mouse event handlers for desktop support
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      handleEnd();
    };

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: false });
    
    // Add mouse event listeners for desktop support
    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleStart, handleMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-full touch-none select-none"
      style={{
        width: size,
        height: size,
        background: isActive
          ? "radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0.1) 50%, transparent 70%)"
          : "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, transparent 70%)",
        border: `2px solid ${isActive ? "rgba(255,215,0,0.6)" : "rgba(255,255,255,0.3)"}`,
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {/* Direction indicators */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute top-2 text-white/30 text-xs font-bold">W</div>
        <div className="absolute bottom-2 text-white/30 text-xs font-bold">S</div>
        <div className="absolute left-2 text-white/30 text-xs font-bold">A</div>
        <div className="absolute right-2 text-white/30 text-xs font-bold">D</div>
      </div>

      {/* Knob */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 40,
          height: 40,
          left: "50%",
          top: "50%",
          transform: `translate(calc(-50% + ${knobPosition.x}px), calc(-50% + ${knobPosition.y}px))`,
          background: isActive
            ? "radial-gradient(circle, #ffd700 0%, #ffaa00 100%)"
            : "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)",
          boxShadow: isActive
            ? "0 0 20px rgba(255,215,0,0.6)"
            : "0 0 10px rgba(255,255,255,0.3)",
          transition: isActive ? "none" : "transform 0.15s ease-out",
        }}
      />
    </div>
  );
}
