import Matter from 'matter-js';
import { multiplayerService } from '../../services/multiplayerService';

let lastBroadcast = 0;

// These should match GameEngine.tsx arena constants as closely as possible.
// W/H here are used only for clamping — the actual physics floor is set in GameEngine.
// Landscape: W = long side, H = short side
import { Dimensions } from 'react-native';
const SCREEN = Dimensions.get('window');
const W = Math.max(SCREEN.width, SCREEN.height);
const H = Math.min(SCREEN.width, SCREEN.height);

const FLOOR_Y = H - 30;       // must match GameEngine.tsx FLOOR_Y
const MIN_X   = 50;
const MAX_X   = W - 50;
const MIN_Y   = 20;
const MAX_Y   = FLOOR_Y - 50; // clamped just above ground

export const PhysicsSystem = (entities: any, { time, joystick, userId, room }: any) => {
  if (!room || !userId || !room.player1 || !room.id) return entities;

  const engine   = entities.physics.engine;
  const isP1     = room.player1.id === userId;
  const myKey    = isP1 ? 'player1' : 'player2';
  const enemyKey = isP1 ? 'player2' : 'player1';

  const myPlayer    = entities[myKey];
  const enemyPlayer = entities[enemyKey];

  if (!myPlayer?.body) return entities;

  const body = myPlayer.body;

  // ── 1. Horizontal movement ───────────────────────────────
  const moveX = joystick?.x ?? 0;

  Matter.Body.setVelocity(body, {
    x: moveX * 7,
    y: body.velocity.y,
  });

  if (Math.abs(moveX) > 0.1) {
    myPlayer.state = 'walk';
    body.facing    = moveX > 0 ? 'right' : 'left';
  } else if (!['jump', 'attack1', 'attack2', 'attack3', 'attack4', 'hit', 'block'].includes(myPlayer.state)) {
    myPlayer.state = 'idle';
  }

  // ── 2. Jump ──────────────────────────────────────────────
  const nearFloor  = body.position.y >= FLOOR_Y - 80;
  const isOnGround = nearFloor && Math.abs(body.velocity.y) < 1.5;

  if (joystick?.y < -0.5 && isOnGround) {
    Matter.Body.setVelocity(body, { x: body.velocity.x, y: -14 });
    myPlayer.state = 'jump';
  }

  if (myPlayer.state === 'jump' && isOnGround && body.velocity.y >= 0) {
    myPlayer.state = 'idle';
  }

  // ── 3. Neutralize enemy gravity ──────────────────────────
  if (enemyPlayer?.body) {
    Matter.Body.setVelocity(enemyPlayer.body, { x: 0, y: 0 });
  }

  // ── 4. Step physics ──────────────────────────────────────
  Matter.Engine.update(engine, time.delta);

  // ── 5. Clamp local player ────────────────────────────────
  const pos      = body.position;
  const clampedX = Math.max(MIN_X, Math.min(MAX_X, pos.x));
  const clampedY = Math.max(MIN_Y, Math.min(MAX_Y, pos.y));
  if (clampedX !== pos.x || clampedY !== pos.y) {
    Matter.Body.setPosition(body, { x: clampedX, y: clampedY });
    if (clampedY !== pos.y) {
      Matter.Body.setVelocity(body, { x: body.velocity.x, y: 0 });
    }
  }

  // ── 6. Broadcast to Firebase every 50ms ──────────────────
  const now = Date.now();
  if (now - lastBroadcast > 50) {
    lastBroadcast = now;
    multiplayerService.updatePlayerState(room.id, myKey as 'player1' | 'player2', {
      posX:   Math.round(body.position.x),
      posY:   Math.round(body.position.y),
      velY:   Math.round(body.velocity.y),
      facing: body.facing ?? 'right',
      action: myPlayer.state,
    });
  }

  // ── 7. Sync enemy from Firebase ──────────────────────────
  const enemyData = isP1 ? room.player2 : room.player1;

  if (enemyData && enemyPlayer?.body) {
    const { posX, posY, facing, action } = enemyData;

    if (posX !== undefined && posY !== undefined) {
      const cx = enemyPlayer.body.position.x;
      const cy = enemyPlayer.body.position.y;

      const targetX = Math.max(MIN_X, Math.min(MAX_X, posX));
      const targetY = Math.max(MIN_Y, Math.min(MAX_Y, posY));

      Matter.Body.setPosition(enemyPlayer.body, {
        x: cx + (targetX - cx) * 0.35,
        y: cy + (targetY - cy) * 0.35,
      });

      Matter.Body.setVelocity(enemyPlayer.body, { x: 0, y: 0 });
    }

    enemyPlayer.body.facing  = facing ?? (isP1 ? 'left' : 'right');
    enemyPlayer.networkState = action ?? 'idle';
  }

  return entities;
};