import Matter from 'matter-js';
import { multiplayerService } from '../../services/multiplayerService';

let lastBroadcast = 0;

export const PhysicsSystem = (entities: any, { time, joystick, userId, room }: any) => {
  if (!room || !userId || !room.player1 || !room.id) return entities;

  const engine = entities.physics.engine;
  const isP1 = room.player1.id === userId;
  const myKey = isP1 ? 'player1' : 'player2';
  const enemyKey = isP1 ? 'player2' : 'player1';

  const myPlayer = entities[myKey];
  const enemyPlayer = entities[enemyKey];

  if (!myPlayer?.body) return entities;

  const body = myPlayer.body;

  // ─────────────────────────────────────────
  // 1. FÍSICAS DEL JUGADOR LOCAL
  // ─────────────────────────────────────────
  const moveX = joystick?.x || 0;
  Matter.Body.setVelocity(body, {
    x: moveX * 6,
    y: body.velocity.y,
  });

  if (Math.abs(moveX) > 0.1) {
    myPlayer.state = 'walk';
    body.facing = moveX > 0 ? 'right' : 'left';
  } else if (!['jump', 'attack', 'hit'].includes(myPlayer.state)) {
    myPlayer.state = 'idle';
  }

  const isOnGround = Math.abs(body.velocity.y) < 0.5;
  if (joystick?.y < -0.6 && isOnGround) {
    Matter.Body.setVelocity(body, { x: body.velocity.x, y: -13 });
    myPlayer.state = 'jump';
  }
  if (myPlayer.state === 'jump' && isOnGround && Math.abs(body.velocity.y) < 0.5) {
    myPlayer.state = 'idle';
  }

  // ─────────────────────────────────────────
  // 2. ACTUALIZAR MOTOR FÍSICO
  //    (isStatic:true en el enemigo lo excluye de la simulación)
  // ─────────────────────────────────────────
  Matter.Engine.update(engine, time.delta);

  // ─────────────────────────────────────────
  // 3. BROADCAST — enviar posición a Firebase
  // ─────────────────────────────────────────
  const now = Date.now();
  if (now - lastBroadcast > 50) {
    lastBroadcast = now;
    multiplayerService.updatePlayerState(room.id, myKey as 'player1' | 'player2', {
      posX: Math.round(body.position.x),
      posY: Math.round(body.position.y),
      velY: Math.round(body.velocity.y),
      facing: body.facing ?? 'right',
      action: myPlayer.state,
    });
  }

  // ─────────────────────────────────────────
  // 4. MOVER AL ENEMIGO CON DATOS DE FIREBASE
  // ─────────────────────────────────────────
  const enemyData = isP1 ? room.player2 : room.player1;

  if (enemyData && enemyPlayer?.body) {
    const { posX, posY, facing, action } = enemyData;

    if (posX !== undefined && posY !== undefined) {
      const cx = enemyPlayer.body.position.x;
      const cy = enemyPlayer.body.position.y;
      Matter.Body.setPosition(enemyPlayer.body, {
        x: cx + (posX - cx) * 0.4,
        y: cy + (posY - cy) * 0.4,
      });
    }

    enemyPlayer.body.facing = facing ?? 'right';
    // ✅ networkState evita que AnimationSystem lo pise con velocity local
    enemyPlayer.networkState = action ?? 'idle';
  }

  return entities;
};