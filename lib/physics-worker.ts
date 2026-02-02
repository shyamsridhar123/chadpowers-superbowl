// Physics Worker for Chad Powers Football Game
// Uses Tron-style simplified physics simulation for ball trajectory

interface PhysicsState {
  ball: {
    position: [number, number, number];
    velocity: [number, number, number];
    rotation: [number, number, number, number];
    angularVelocity: [number, number, number];
    isActive: boolean;
  };
  player: {
    position: [number, number, number];
  };
}

interface ThrowInput {
  force: [number, number, number];
  spin: [number, number, number];
  targetDistance?: number; // Optional: distance to target for arc calculation
}

// Tron-style physics constants
const BALL_SPEED = 32;           // Ball velocity units/sec (from Tron)
const LEAD_FACTOR = 0.65;        // Lead targeting (65% ahead of receiver)
const CATCH_RADIUS = 5;          // Forgiving catch zone
const GRAVITY = -9.81;
const AIR_RESISTANCE = 0.08;     // Reduced for smoother flight
const ANGULAR_DAMPING = 0.15;    // Slower spiral decay
const GROUND_Y = 0.143;          // Ball radius
const FIXED_TIMESTEP = 1000 / 60;
const RELEASE_HEIGHT = 1.8;      // QB release point (meters)

let state: PhysicsState = {
  ball: {
    position: [0, 1.8, 0],
    velocity: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    angularVelocity: [0, 0, 0],
    isActive: false,
  },
  player: {
    position: [0, 0, 0],
  },
};

let accumulator = 0;

function stepPhysics(dt: number) {
  if (!state.ball.isActive) return;

  const dtSeconds = dt / 1000;

  // Apply gravity
  state.ball.velocity[1] += GRAVITY * dtSeconds;

  // Apply air resistance (reduced effect on vertical for better arcs)
  state.ball.velocity[0] *= 1 - AIR_RESISTANCE * dtSeconds;
  state.ball.velocity[1] *= 1 - AIR_RESISTANCE * dtSeconds * 0.3; // Less drag on vertical
  state.ball.velocity[2] *= 1 - AIR_RESISTANCE * dtSeconds;

  // Update position
  state.ball.position[0] += state.ball.velocity[0] * dtSeconds;
  state.ball.position[1] += state.ball.velocity[1] * dtSeconds;
  state.ball.position[2] += state.ball.velocity[2] * dtSeconds;

  // Apply angular damping
  state.ball.angularVelocity[0] *= 1 - ANGULAR_DAMPING * dtSeconds;
  state.ball.angularVelocity[1] *= 1 - ANGULAR_DAMPING * dtSeconds;
  state.ball.angularVelocity[2] *= 1 - ANGULAR_DAMPING * dtSeconds;

  // Update rotation (simplified quaternion update)
  const ax = state.ball.angularVelocity[0] * dtSeconds;
  const ay = state.ball.angularVelocity[1] * dtSeconds;
  const az = state.ball.angularVelocity[2] * dtSeconds;

  const [qx, qy, qz, qw] = state.ball.rotation;
  state.ball.rotation = [
    qx + 0.5 * (qw * ax - qz * ay + qy * az),
    qy + 0.5 * (qz * ax + qw * ay - qx * az),
    qz + 0.5 * (-qy * ax + qx * ay + qw * az),
    qw + 0.5 * (-qx * ax - qy * ay - qz * az),
  ];

  // Normalize quaternion
  const mag = Math.sqrt(
    state.ball.rotation[0] ** 2 +
      state.ball.rotation[1] ** 2 +
      state.ball.rotation[2] ** 2 +
      state.ball.rotation[3] ** 2
  );
  state.ball.rotation = state.ball.rotation.map((v) => v / mag) as [
    number,
    number,
    number,
    number,
  ];

  // Ground collision
  if (state.ball.position[1] <= GROUND_Y) {
    state.ball.position[1] = GROUND_Y;
    state.ball.velocity = [0, 0, 0];
    state.ball.angularVelocity = [0, 0, 0];
    state.ball.isActive = false;
  }
}

self.onmessage = (event: MessageEvent) => {
  const { type, data } = event.data;

  switch (type) {
    case "STEP": {
      accumulator += data.delta;

      while (accumulator >= FIXED_TIMESTEP) {
        stepPhysics(FIXED_TIMESTEP);
        accumulator -= FIXED_TIMESTEP;
      }

      const alpha = accumulator / FIXED_TIMESTEP;

      self.postMessage({
        type: "STATE_UPDATE",
        state: {
          ball: { ...state.ball },
          player: { ...state.player },
        },
        alpha,
      });
      break;
    }

    case "THROW": {
      const throwInput = data as ThrowInput;
      state.ball.position = [
        state.player.position[0],
        1.8,
        state.player.position[2],
      ];
      state.ball.velocity = [...throwInput.force];
      state.ball.angularVelocity = [...throwInput.spin];
      state.ball.isActive = true;
      break;
    }

    case "RESET_BALL": {
      state.ball = {
        position: [state.player.position[0], 1.8, state.player.position[2]],
        velocity: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        angularVelocity: [0, 0, 0],
        isActive: false,
      };
      break;
    }

    case "MOVE_PLAYER": {
      const { x, z } = data;
      // Clamp player to pocket area
      state.player.position[0] = Math.max(-5, Math.min(5, x));
      state.player.position[2] = Math.max(-3, Math.min(3, z));
      break;
    }

    case "INIT": {
      state = {
        ball: {
          position: [0, 1.8, 0],
          velocity: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          angularVelocity: [0, 0, 0],
          isActive: false,
        },
        player: {
          position: [0, 0, 0],
        },
      };
      break;
    }
  }
};

export {};
