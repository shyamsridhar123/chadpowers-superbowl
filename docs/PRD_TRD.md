Chad Powers Mobile Football Game
Product Requirements Document (PRD) & Technical Requirements Document (TRD)
Version: 1.0
Author: Technical Architecture Team
Date: February 1, 2026
Status: Foundation Document
________________________________________
Part I: Product Requirements Document (PRD)
Executive Summary
Chad Powers Mobile Football Game is a next-generation browser-based 3D football experience optimized for mobile-first gameplay. The game combines professional-grade physics simulation, cinematic presentation, and intuitive touch controls to deliver AAA-quality football action directly in mobile browsers without app store friction.
Core Value Proposition: Console-quality football gameplay accessible instantly through any mobile browser, featuring WebGPU-powered graphics, physics-based throwing mechanics, and zero-latency touch controls.
Product Vision
Primary Objectives
	Deliver 60fps 3D football gameplay on mid-range mobile devices (Snapdragon 778G, A15 Bionic baseline)
	Enable instant play-to-action within 3 seconds of URL load
	Create industry-leading touch-based quarterback controls that feel better than traditional gamepad input
	Establish technical foundation for progressive web app (PWA) distribution bypassing app stores
	Demonstrate production viability of WebGPU for mobile gaming in 2026
Target Audience
Primary: Mobile gamers aged 18-35 with interest in arcade-style football games
Secondary: Tech-forward gamers exploring browser-based gaming capabilities
Device Profile: iPhone SE (2022) and Snapdragon 778G Android devices as minimum viable hardware
Core Gameplay Experience
Quarterback Control System
Left-Thumb Movement Zone
	Virtual joystick controls quarterback positioning within pocket
	120px radial touch area positioned bottom-left
	Zero-latency response using canvas-based rendering (not DOM manipulation)
	Visual feedback: Semi-transparent gradient indicating input direction and magnitude
	Drag radius maps to player movement speed (0-100% sprint based on distance from center)
Right-Hand Throw Zone
	Occupies entire right 50% of screen to avoid occlusion of play field
	Swipe gesture mechanics translate to throw parameters:
	Velocity = Swipe speed determines throw power (measured in pixels/millisecond)
	Angle = Swipe direction controls trajectory arc and horizontal curve
	Touch duration influences ball spin and spiral tightness
	Visual throw indicator appears on touch-start showing projected arc
	Haptic feedback on release (where supported)
Game Modes (Phase 1)
Practice Mode
	Open field with stationary targets at 10, 20, 30, 40 yard markers
	Physics validation sandbox for throw mechanics tuning
	Performance profiling test bed
Passing Challenge
	Timed sequences hitting moving receivers
	Progressive difficulty with defender AI
	Score multipliers for accuracy, timing, spiral quality
Visual & Cinematic Goals
	Real-time dynamic shadows using optimized shadow mapping
	Particle effects for turf kick-up, ball trail, celebration animations
	Cinematic instant replays using Theatre.js timeline system
	Smooth camera transitions (behind-QB to cinematic angles)
	Level-of-detail (LOD) system maintaining visual fidelity at distance
	Character models: High-detail player models with 3-tier LOD system
Success Metrics & Performance Budgets
Performance Targets
Metric	Target	Minimum
Frame Rate (Flagship)	60 fps	55 fps
Frame Rate (Mid-Range)	45 fps	30 fps
Frame Rate (Budget)	30 fps	25 fps
Initial Load Time (4G)	2 sec	3 sec
Time to Interactive	3 sec	5 sec
Battery Drain Rate	8%/hr	10%/hr
Thermal Throttle Delay	10 min	5 min
Memory Footprint	80 MB	100 MB

Table 1: Performance Budget Targets
Device Tier Classification
Tier 1 (Flagship): iPhone 14+, Snapdragon 8 Gen 2+, A16 Bionic+
Tier 2 (Mid-Range): iPhone SE 2022, Snapdragon 778G, A15 Bionic
Tier 3 (Budget): iPhone 11, Snapdragon 695, A13 Bionic
Quality Assurance Gates
	Touch input latency < 16ms (measured touchstart to visual response)
	Physics determinism: Identical inputs produce identical ball trajectories
	No memory leaks over 30-minute continuous play session
	Graceful degradation on unsupported hardware (WebGL fallback functional)
User Experience Flow
Session Entry
	User navigates to URL
	Instant loading screen with progress indicator
	WebGPU capability detection (< 100ms)
	Asset streaming begins (prioritize critical game mechanics over cosmetics)
	Tutorial overlay on first launch (swipe gestures)
	Gameplay starts within 3 seconds
Core Gameplay Loop
	QB spawns in pocket with defensive formation visible
	Left thumb activates movement joystick
	Receivers run routes (visualized with subtle path indicators)
	Right swipe initiates throw with real-time trajectory preview
	Ball physics simulation with wind effects and spiral dynamics
	Success/failure feedback (completion stats, accuracy score)
	Instant replay option with cinematic camera angles
	Next play begins
Progressive Enhancement Strategy
WebGPU Available:
	Full visual fidelity with advanced shaders
	Compute-based particle systems
	High-resolution shadow maps (1024x1024)
	Post-processing effects (bloom, depth of field)
WebGL 2 Fallback:
	Simplified lighting model
	Reduced particle count (50% density)
	Lower shadow resolution (512x512)
	Disabled post-processing
WebGL 1 Emergency Fallback:
	Basic Phong shading
	No dynamic shadows
	Minimal particles
	Maintain 30fps minimum
Monetization & Distribution (Future Phases)
Phase 1: No monetization, pure technical validation
Phase 2: Optional cosmetic purchases (uniform customization)
Phase 3: Season pass with challenge mode expansions
Distribution: PWA installable via browser, potential app store submission via Capacitor wrapper
________________________________________
Part II: Technical Requirements Document (TRD)
System Architecture Overview
High-Level Architecture
┌─────────────────────────────────────────────────────────┐
│ Main Thread │
│ ┌─────────────┐ ┌──────────────┐ ┌───────────────┐ │
│ │ Renderer │ │ Input System │ │ Game Logic │ │
│ │ (Three.js) │ │ (Touch) │ │ (State) │ │
│ └──────┬──────┘ └──────┬───────┘ └───────┬───────┘ │
│ │ │ │ │
│ └─────────────────┴───────────────────┘ │
│ │ │
└───────────────────────────┼─────────────────────────────┘
│ Shared Memory
┌───────────────────────────┼─────────────────────────────┐
│ │ │
│ Physics Worker │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Rapier WASM Physics Engine │ │
│ │ - Rigid body simulation │ │
│ │ - Collision detection │ │
│ │ - Impulse resolution │ │
│ └──────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────┘
Technology Stack
Core Rendering:
	Three.js r182+ (WebGPU + WebGL fallback)
	WebGPU API (native on iOS 26+, Chrome 121+ Android)
	WebGL 2.0 fallback (95%+ device coverage)
Physics Simulation:
	Rapier v0.17+ (Rust → WebAssembly)
	Web Workers for off-main-thread physics computation
	Fixed timestep at 60Hz (1/60s = 16.67ms per step)
Input Handling:
	nipple.js v0.9+ for virtual joystick
	Custom swipe detection for throw mechanics
	Hammer.js v2.0 for gesture recognition
Animation & Cinematics:
	Theatre.js for cutscene timeline authoring
	GSAP v3.12+ for UI animations
	Three.js AnimationMixer for character animations
Audio:
	Howler.js v2.2+ (better mobile compatibility than Web Audio API)
	Spatial audio positioning for immersive field presence
Build & Deployment:
	Vite v5.0+ with WebAssembly plugin
	Tree-shaking for minimal bundle size
	Service Worker for offline capability and asset caching
Detailed Technical Specifications
Graphics Rendering Pipeline
WebGPU Implementation
Renderer Configuration:
const renderer = new THREE.WebGPURenderer({
powerPreference: 'high-performance',
antialias: deviceTier > 1, // Only flagship devices
alpha: false,
stencil: false
});
// Dynamic resolution scaling
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
renderer.setSize(window.innerWidth, window.innerHeight);
Shader Strategy:
	Use WGSL (WebGPU Shading Language) for primary shaders
	Compute shaders for particle systems (turf particles, celebration effects)
	Shadow mapping via depth texture attachments
	Frustum culling to eliminate off-screen draw calls
LOD System Implementation:
Distance	Triangles	Texture Res	Shadows
0-20 units	8000	2048x2048	Full
20-50 units	2000	1024x1024	Medium
50+ units	500	512x512	None

Table 2: Level of Detail Thresholds
Optimization Techniques:
	Geometry instancing for crowd rendering (100+ spectators as billboards)
	Texture atlasing to reduce texture binding overhead
	Occlusion culling for stadium geometry behind camera
	Dynamic shadow map resolution based on FPS monitoring
Physics Engine Architecture
Rapier Configuration
Football Physics Parameters:
// Ball rigid body specification
const ballCollider = {
shape: ColliderDesc.ball(0.143), // 11.35" diameter (regulation)
mass: 0.41, // 14.5 oz in kg
restitution: 0.35, // Bounce coefficient
friction: 0.7, // Surface grip
linearDamping: 0.12, // Air resistance
angularDamping: 0.18 // Spiral decay rate
};
// Player collision capsules
const playerCollider = {
shape: ColliderDesc.capsule(0.9, 0.3), // Height 1.8m, radius 0.3m
mass: 100, // kg
restitution: 0.1,
friction: 0.9
};
Throw Mechanics Translation:
F ⃗_"impulse" =[■(cos⁡(θ)⋅P@sin⁡(θ)⋅P⋅0.5@0)]
Where:
	θ = Swipe angle from horizontal
	P = Power derived from swipe velocity (clamped 0-100)
	Vertical component scaled by 0.5 for realistic arc
Spin Mechanics:
T ⃗_"spin" =[■(θ⋅15@0@v_"swipe" ⋅0.3)]
Applied as angular impulse to generate spiral rotation.
Worker Threading Architecture
Main Thread → Worker Communication:
// Message structure (sent at 60 Hz)
{
type: 'STEP',
delta: 16.67, // Fixed timestep
inputs: {
playerPosition: [x, y, z],
throwImpulse: {force: [fx, fy, fz], torque: [tx, ty, tz]}
}
}
// Worker → Main Thread response
{
type: 'STATE_UPDATE',
timestamp: performance.now(),
bodies: [
{id: 'ball', position: [x,y,z], rotation: [qx,qy,qz,qw]},
{id: 'player', position: [x,y,z], rotation: [qx,qy,qz,qw]}
]
}
Interpolation Strategy:
Client-side prediction with server reconciliation pattern:
	Main thread sends input to worker
	Worker computes physics step (16.67ms fixed)
	Main thread interpolates visual positions between physics updates
	Smooth 60fps rendering despite physics at discrete steps
Touch Input System
Dual-Zone Architecture
Left Zone (Movement Joystick):
	Position: Bottom-left, 120x120px touch area
	Library: nipple.js with custom styling
	Output: Normalized vector (-1 to 1 on X and Y axes)
	Mapping: Linear to player velocity (max 5 units/sec sprint)
	Visual: Semi-transparent radial gradient, updates at 60fps
Right Zone (Throw Mechanic):
	Position: Entire right 50% of screen (no fixed button)
	Detection: Custom touchstart/touchmove/touchend handlers
	Calculation: Velocity = √(dx^2+dy^2 )/dt
	Angle: "atan2"(dy,dx) converted to world-space vector
	Preview: Real-time trajectory arc rendered as dashed line
	Feedback: Haptic pulse on supported devices via Vibration API
Input Latency Optimization:
// Prevent passive event listener delays
canvas.addEventListener('touchstart', handler, {passive: false});
canvas.addEventListener('touchmove', handler, {passive: false});
// Direct canvas manipulation bypasses DOM reflow
ctx.clearRect(0, 0, width, height);
ctx.drawImage(joystickSprite, x, y);
Target: touchstart event → visual feedback < 16ms (single frame at 60fps).
Performance Monitoring & Adaptive Quality
Real-Time FPS Monitoring
class PerformanceManager {
constructor() {
this.frameTimes = [];
this.currentTier = 'high';
}
recordFrame(deltaTime) {
this.frameTimes.push(deltaTime);
if (this.frameTimes.length > 180) { // 3 seconds at 60fps
const avgFps = 1000 / (this.frameTimes.reduce((a,b) => a+b) / 180);
  if (avgFps < 30 && this.currentTier !== 'low') {
    this.downgradeTier();
  } else if (avgFps > 55 && this.currentTier !== 'high') {
    this.upgradeTier();
  }
  
  this.frameTimes = [];
}

}
downgradeTier() {
// Reduce shadow resolution by 50%
// Disable post-processing effects
// Lower particle density
// Simplify shader complexity
}
}
Battery Optimization
// Detect low battery state
if ('getBattery' in navigator) {
const battery = await navigator.getBattery();
if (battery.level < 0.20) {
targetFPS = 30; // Lower from 60fps
disableNonEssentialEffects();
reducePhysicsAccuracy(); // Fewer substeps
}
battery.addEventListener('levelchange', () => {
adjustPerformanceProfile(battery.level);
});
}
Asset Pipeline & Loading Strategy
Bundle Size Targets
Asset Category	Size	Load Priority
Core Engine (JS + WASM)	850 KB	Critical
Stadium Geometry	450 KB	Critical
Player Models (LOD 0-2)	600 KB	High
Textures (Compressed)	1.2 MB	Medium
Audio (Compressed)	300 KB	Low
UI Assets	150 KB	Critical
Total Initial	3.55 MB	-

Table 3: Asset Budget Breakdown
Progressive Loading
	Critical Path (0-2s): Engine bootstrap, minimal stadium, basic player model
	Interactive (2-3s): Touch controls active, physics initialized, gameplay ready
	Enhancement (3-10s): High-res textures, detailed LODs, audio, particles
	Background: Crowd animations, additional uniforms, celebration effects
Compression Strategy:
	glTF meshes with Draco compression (70% size reduction)
	Basis Universal for texture compression (80% reduction, GPU decompression)
	Brotli compression for JavaScript bundles
	Service Worker caching after first session
Cinematics & Replay System
Theatre.js Integration
import { getProject } from '@theatre/core';
import studio from '@theatre/studio';
const project = getProject('ChadPowersReplays');
const sheet = project.sheet('ThrowReplay');
// Define animated properties
const cameraAnimation = sheet.object('Camera', {
position: types.compound({
x: types.number(camera.position.x),
y: types.number(camera.position.y),
z: types.number(camera.position.z)
}),
lookAt: types.compound({
x: types.number(ball.position.x),
y: types.number(ball.position.y),
z: types.number(ball.position.z)
})
});
// Play cinematic sequence
sheet.sequence.play({ iterationCount: 1, range: [0, 3] });
Replay Capture:
	Record physics state at 20Hz during gameplay
	Store positions, rotations, velocities for 5 seconds of action
	On replay trigger: Interpolate recorded data, apply cinematic camera path
	Slow-motion effects via time-scaling (0.25x - 1.0x playback speed)
Platform-Specific Optimizations
iOS Safari Considerations
	WebGPU available on iOS 26+ (Safari 26)
	Automatic fallback to WebGL 2 for iOS 15-25
	Audio playback requires user interaction unlock (handle on first touch)
	Viewport height quirks with mobile Safari toolbar (use visualViewport API)
	Prevent default on touchmove to avoid page scrolling during gameplay
Android Chrome Optimizations
	WebGPU on Chrome 121+ with Android 12+ (Qualcomm/ARM GPUs)
	Mali GPU detection for shader optimization paths
	Thermal throttling aggressive on Snapdragon 7-series (monitor via devicememory API)
	Hardware acceleration verification via OffscreenCanvas support check
Development & Testing Strategy
Testing Devices
Required Hardware Testing:
	iPhone SE 2022 (A15 Bionic, budget iOS device)
	iPhone 14 Pro (A16 Bionic, flagship baseline)
	Samsung Galaxy A54 (Snapdragon 778G, mid-range Android)
	Google Pixel 7a (Tensor G2, alternative Android mid-range)
	Older fallback: iPhone 11 (A13, WebGL only)
Testing Protocol:
	Deploy via ngrok tunnel for remote device testing
	Monitor FPS via on-screen debug overlay
	Battery drain measurement over 30-minute sessions
	Thermal camera monitoring for hotspot identification
	Touch latency measurement using high-speed camera (240fps recording)
Performance Profiling Tools
	Chrome DevTools Performance panel (frame timing analysis)
	WebGPU Inspector extension (shader profiling)
	Stats.js for real-time FPS/MS monitoring
	Spector.js for WebGL/WebGPU frame capture
	Lighthouse for load time and performance scoring
Risk Assessment & Mitigation
Technical Risks
Risk	Severity	Mitigation
WebGPU instability on Android	High	Mandatory WebGL fallback, extensive device testing
Physics worker synchronization stutter	Medium	Interpolation buffer, fixed timestep discipline
Touch input lag on low-end	Medium	Canvas-based rendering, passive event optimization
Memory leaks in long sessions	Medium	Aggressive object pooling, periodic cleanup cycles
Thermal throttling after 5 min	High	Adaptive quality system, preemptive downgrade
Audio unlock on iOS	Low	Clear UX prompt on first interaction

Table 4: Technical Risk Matrix
Browser Compatibility Matrix
Browser	WebGPU	WebGL 2	Status
Safari 26+ iOS	✓	✓	Full Support
Safari 18-25 iOS	✗	✓	WebGL Fallback
Chrome 121+ Android	✓	✓	Full Support
Chrome < 121 Android	✗	✓	WebGL Fallback
Firefox Android	✗	✓	WebGL Only (2026)
Samsung Internet	✗	✓	WebGL Fallback

Table 5: Browser Support Status (Feb 2026)
Implementation Phases
Phase 0: Foundation (Prototype Validation)
Deliverables:
	Three.js WebGPU renderer initialized
	Rapier physics in Web Worker
	Dual-zone touch controls functional
	Ball throw impulse working
	60fps on flagship device
Success Criteria: Shareable CodeSandbox link demonstrating core mechanics
Phase 1: Core Gameplay
Deliverables:
	Complete practice mode
	LOD system implemented
	Performance monitoring active
	Adaptive quality scaling
	Device tier detection
	WebGL fallback path validated
Phase 2: Visual Polish
Deliverables:
	Theatre.js replay system
	Particle effects (turf, ball trail)
	Dynamic shadows
	Post-processing pipeline
	Character animations
Phase 3: PWA & Distribution
Deliverables:
	Service Worker implementation
	Offline capability
	Add to Home Screen manifest
	Installable PWA
	Performance audit (Lighthouse 90+ score)
Appendix: Code Examples
WebGPU Feature Detection
async function initializeRenderer() {
if (navigator.gpu) {
try {
const adapter = await navigator.gpu.requestAdapter({
powerPreference: 'high-performance'
});
  if (adapter) {
    console.log('WebGPU available');
    return new THREE.WebGPURenderer({ antialias: true });
  }
} catch (err) {
  console.warn('WebGPU initialization failed:', err);
}

}
// Fallback to WebGL 2
console.log('Using WebGL 2 fallback');
return new THREE.WebGLRenderer({
antialias: true,
powerPreference: 'high-performance'
});
}
Fixed Timestep Physics Loop
// In Physics Worker
let accumulator = 0;
const FIXED_TIMESTEP = 1000 / 60; // 16.67ms
self.onmessage = (event) => {
if (event.data.type === 'STEP') {
accumulator += event.data.delta;
// Fixed timestep with accumulator
while (accumulator >= FIXED_TIMESTEP) {
  world.step(); // Rapier physics step
  accumulator -= FIXED_TIMESTEP;
}

// Send interpolated state back
const alpha = accumulator / FIXED_TIMESTEP;
self.postMessage({
  type: 'STATE_UPDATE',
  bodies: serializeBodies(),
  alpha: alpha // For interpolation
});

}
};
Throw Impulse Calculation
function calculateThrowImpulse(touchStart, touchEnd, deltaTime) {
const dx = touchEnd.x - touchStart.x;
const dy = touchEnd.y - touchStart.y;
// Velocity-based power
const velocity = Math.sqrt(dxdx + dydy) / deltaTime;
const power = Math.min(velocity * 50, 100); // Clamp to max
// Angle determines trajectory
const angle = Math.atan2(dy, dx);
// World-space impulse vector
const impulse = {
x: Math.cos(angle) * power,
y: Math.sin(angle) * power * 0.5, // Arc coefficient
z: 0
};
// Spin torque for spiral
const spin = {
x: angle * 15, // Rotation around forward axis
y: 0,
z: velocity * 0.3 // Wobble based on speed
};
return { impulse, spin };
}
References
[1] Web.dev Team. (2025). WebGPU is now supported in major browsers. https://web.dev/blog/webgpu-supported-major-browsers
[2] ByteIOTA. (2026). WebGPU 2026: 70% Browser Support, 15x Performance Gains. https://byteiota.com/webgpu-2026-70-browser-support-15x-performance-gains/
[3] Coding Cops. (2025). WebGPU Explained: The Future of Cross-Platform Gaming. https://codingcops.com/webgpu-cross-platform-performance/
[4] W3C. (2026). WebGPU W3C Working Draft. https://www.w3.org/TR/webgpu/
[5] Millington, I. (2010). Game Physics Engine Development. CRC Press.
[6] Rapier Physics Engine Documentation. https://rapier.rs/docs/
[7] Three.js Documentation. https://threejs.org/docs/
[8] Theatre.js Documentation. https://www.theatrejs.com/docs/
[9] Genieee. (2025). Phaser Game Development Best Practices. https://genieee.com/phaser-game-development-best-practices/
[10] Mobile Gamer. (2026). 2026 Mobile Gaming Predictions. https://mobilegamer.biz/your-2026-predictions-d2c-evolves-ai-invades-browser-and-premium-return-more/
