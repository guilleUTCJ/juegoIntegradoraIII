import Matter from 'matter-js';
import { multiplayerService } from '../../services/multiplayerService';
import { FLOOR_Y, W } from '../engine/GameEngine';

let lastBroadcast = 0;

// Límites de la arena para clampar posiciones
const MIN_X = 50;
const MAX_X = W - 50;
const MIN_Y = 20;
const MAX_Y = FLOOR_Y - 10;   // justo encima del suelo

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

  // ─────────────────────────────────────────
  // 1. MOVIMIENTO HORIZONTAL del jugador local
  // ─────────────────────────────────────────
  const moveX = joystick?.x ?? 0;

  Matter.Body.setVelocity(body, {
    x: moveX * 7,
    y: body.velocity.y,   // preservar velocidad vertical (gravedad/salto)
  });

  // Estado y dirección
  if (Math.abs(moveX) > 0.1) {
    myPlayer.state    = 'walk';
    body.facing       = moveX > 0 ? 'right' : 'left';
  } else if (!['jump', 'attack', 'hit', 'block'].includes(myPlayer.state)) {
    myPlayer.state = 'idle';
  }

  // ─────────────────────────────────────────
  // 2. SALTO — joystick Y negativo
  //    isOnGround: velocidad vertical casi cero Y cerca del suelo
  // ─────────────────────────────────────────
  const nearFloor = body.position.y >= FLOOR_Y - 80;
  const isOnGround = nearFloor && Math.abs(body.velocity.y) < 1.5;

  if (joystick?.y < -0.5 && isOnGround) {
    Matter.Body.setVelocity(body, { x: body.velocity.x, y: -14 });
    myPlayer.state = 'jump';
  }

  // Volver a idle al aterrizar
  if (myPlayer.state === 'jump' && isOnGround && body.velocity.y >= 0) {
    myPlayer.state = 'idle';
  }

  // ─────────────────────────────────────────
  // 3. NEUTRALIZAR gravedad del cuerpo enemigo
  //    (para versiones de Matter que no respetan gravityScale en options)
  // ─────────────────────────────────────────
  if (enemyPlayer?.body) {
    Matter.Body.setVelocity(enemyPlayer.body, { x: 0, y: 0 });
  }

  // ─────────────────────────────────────────
  // 4. ACTUALIZAR MOTOR FÍSICO
  // ─────────────────────────────────────────
  Matter.Engine.update(engine, time.delta);

  // ─────────────────────────────────────────
  // 5. CLAMPAR posición del jugador local
  //    (por si se escapa de los bounds antes de que las paredes respondan)
  // ─────────────────────────────────────────
  const pos = body.position;
  const clampedX = Math.max(MIN_X, Math.min(MAX_X, pos.x));
  const clampedY = Math.max(MIN_Y, Math.min(MAX_Y, pos.y));
  if (clampedX !== pos.x || clampedY !== pos.y) {
    Matter.Body.setPosition(body, { x: clampedX, y: clampedY });
    if (clampedY !== pos.y) {
      Matter.Body.setVelocity(body, { x: body.velocity.x, y: 0 });
    }
  }

  // ─────────────────────────────────────────
  // 6. BROADCAST → Firebase (cada 50 ms)
  // ─────────────────────────────────────────
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

  // ─────────────────────────────────────────
  // 7. SINCRONIZAR ENEMIGO desde Firebase
  //    setPosition directamente (sin acumulación de velocidad)
  // ─────────────────────────────────────────
  const enemyData = isP1 ? room.player2 : room.player1;

  if (enemyData && enemyPlayer?.body) {
    const { posX, posY, facing, action } = enemyData;

    if (posX !== undefined && posY !== undefined) {
      // Interpolación suave en X e Y para movimiento fluido
      const cx = enemyPlayer.body.position.x;
      const cy = enemyPlayer.body.position.y;

      const targetX = Math.max(MIN_X, Math.min(MAX_X, posX));
      const targetY = Math.max(MIN_Y, Math.min(MAX_Y, posY));

      Matter.Body.setPosition(enemyPlayer.body, {
        x: cx + (targetX - cx) * 0.35,
        y: cy + (targetY - cy) * 0.35,
      });

      // Resetear velocidad post-setPosition para evitar drift
      Matter.Body.setVelocity(enemyPlayer.body, { x: 0, y: 0 });
    }

    enemyPlayer.body.facing = facing ?? (isP1 ? 'left' : 'right');
    // networkState evita que AnimationSystem lo sobreescriba
    enemyPlayer.networkState = action ?? 'idle';
  }

  return entities;
};