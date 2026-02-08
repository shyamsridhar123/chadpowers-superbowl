# Chad Powers Mobile Football Game

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/shyamsridhar123s-projects/v0-chadpowers-superbowl)

## Overview

A mobile-first 3D football game built with Next.js, React Three Fiber, and Zustand. Experience realistic quarterback gameplay with touch controls, physics-based ball mechanics, and multiple game modes. Targets 60fps on mid-range mobile devices with WebGPU/WebGL rendering.

## Agents Quick Reference

This project uses specialized AI agents for development. Use `@AgentName` to invoke:

| Agent | Use For |
|-------|---------|
| `@ChadPowersDirector` | Multi-system features, coordination |
| `@PhysicsEngineer` | Ball physics, throw mechanics, collisions |
| `@GraphicsEngineer` | Rendering, WebGPU, shadows, performance |
| `@UXEngineer` | Touch controls, joystick, gestures |
| `@CinematicsEngineer` | Replays, camera animation |
| `@QAEngineer` | Testing, benchmarks |
| `@GameDeveloper` | Full-stack implementation |

See `.github/copilot-instructions.md` for detailed routing rules.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint
```

## Features

- **Touch Controls**: Virtual joystick for QB movement, swipe-to-throw mechanics
- **Physics Simulation**: Web Worker-based physics with realistic ball trajectories
- **Multiple Game Modes**: Practice, Challenge, and Instant Replay
- **3D Graphics**: React Three Fiber with WebGPU/WebGL rendering
- **Performance Optimized**: Targets 60fps on mobile devices

## Project Structure

See `CLAUDE.md` for detailed architecture documentation and development guidelines.

## Deployment

The project is deployed on Vercel at:
**[https://vercel.com/shyamsridhar123s-projects/v0-chadpowers-superbowl](https://vercel.com/shyamsridhar123s-projects/v0-chadpowers-superbowl)**