"use client";

export type DeviceTier = "high" | "medium" | "low";

export interface DeviceProfile {
  tier: DeviceTier;
  targetFPS: number;
  maxPixelRatio: number;
  shadowMapSize: number;
  shadows: boolean;
  antialias: boolean;
  fogDistance: [number, number];
}

const DEVICE_PROFILES: Record<DeviceTier, DeviceProfile> = {
  high: {
    tier: "high",
    targetFPS: 60,
    maxPixelRatio: 2,
    shadowMapSize: 2048,
    shadows: true,
    antialias: true,
    fogDistance: [50, 150],
  },
  medium: {
    tier: "medium",
    targetFPS: 45,
    maxPixelRatio: 1.5,
    shadowMapSize: 512,
    shadows: true,
    antialias: true,
    fogDistance: [40, 120],
  },
  low: {
    tier: "low",
    targetFPS: 30,
    maxPixelRatio: 1,
    shadowMapSize: 0,
    shadows: false,
    antialias: false,
    fogDistance: [30, 80],
  },
};

export function detectDeviceTier(): DeviceTier {
  if (typeof navigator === "undefined") return "medium";

  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency || 4;
  const gpu = "gpu" in navigator;
  const memoryGB = memory || 4;

  // WebGPU + good specs = high tier
  if (gpu && memoryGB >= 8 && cores >= 6) {
    return "high";
  }

  // Mid-range check
  if (memoryGB >= 4 && cores >= 4) {
    return "medium";
  }

  return "low";
}

export function getDeviceProfile(tier?: DeviceTier): DeviceProfile {
  const resolvedTier = tier ?? detectDeviceTier();
  return DEVICE_PROFILES[resolvedTier];
}

// FPS monitor that recommends tier changes
export class FPSMonitor {
  private frameTimes: number[] = [];
  private currentTier: DeviceTier;
  private readonly SAMPLE_SIZE = 180; // 3 seconds at 60fps
  private readonly DOWNGRADE_THRESHOLD = 28;
  private readonly UPGRADE_THRESHOLD = 55;
  private onTierChange?: (profile: DeviceProfile) => void;

  constructor(initialTier: DeviceTier, onTierChange?: (profile: DeviceProfile) => void) {
    this.currentTier = initialTier;
    this.onTierChange = onTierChange;
  }

  recordFrame(deltaMs: number) {
    this.frameTimes.push(deltaMs);

    if (this.frameTimes.length >= this.SAMPLE_SIZE) {
      this.evaluate();
      this.frameTimes = [];
    }
  }

  private evaluate() {
    const avg =
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const avgFPS = 1000 / avg;

    if (avgFPS < this.DOWNGRADE_THRESHOLD && this.currentTier !== "low") {
      this.changeTier(this.currentTier === "high" ? "medium" : "low");
    } else if (avgFPS > this.UPGRADE_THRESHOLD && this.currentTier !== "high") {
      this.changeTier(this.currentTier === "low" ? "medium" : "high");
    }
  }

  private changeTier(newTier: DeviceTier) {
    this.currentTier = newTier;
    this.onTierChange?.(DEVICE_PROFILES[newTier]);
  }

  getCurrentTier(): DeviceTier {
    return this.currentTier;
  }

  getAverageFPS(): number {
    if (this.frameTimes.length === 0) return 60;
    const avg =
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    return 1000 / avg;
  }
}
