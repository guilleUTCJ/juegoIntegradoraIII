import Matter from 'matter-js';
import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { GameEngine as RNGameEngine } from 'react-native-game-engine';

import { AnimationSystem } from '../system/animationSystem';
import { BattleSystem } from '../system/battleSystem';
import { PhysicsSystem } from '../system/physicsSystem';

// En landscape, ancho real > alto real
const SCREEN = Dimensions.get('window');
const W = Math.max(SCREEN.width, SCREEN.height);
const H = Math.min(SCREEN.width, SCREEN.height);

// ── Constantes de arena ───────────────────────────────────────
const FLOOR_Y       = H - 1;
const PLAYER_W      = 60;
const PLAYER_H      = 50;
const SPAWN_Y       = FLOOR_Y - PLAYER_H / 2 - 2;
const P1_SPAWN_X    = 180;
const P2_SPAWN_X    = W - 180;

// Exportadas para que physicsSystem pueda clampar posiciones
export { FLOOR_Y, H, P1_SPAWN_X, P2_SPAWN_X, SPAWN_Y, W };

// ─────────────────────────────────────────────────────────────
// 🎨  RENDERER — sprite + ring de color estilo Clash Royale
// ─────────────────────────────────────────────────────────────
const SpriteRenderer = ({
  body, size, state, frame, sprites, isLocalPlayer,
}: any) => {
  const x         = body.position.x - size[0] / 2;
  const y         = body.position.y - size[1] / 2;
  const spriteArr = sprites[state] || sprites.idle;
  const sprite    = spriteArr[frame % spriteArr.length];
  const scaleX    = body.facing === 'left' ? -1 : 1;

  // Verde = tú, Rojo = enemigo
  const ringColor = isLocalPlayer ? '#22c55e' : '#ef4444';
  const glowColor = isLocalPlayer ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)';
  const ellipseW  = size[0] * 0.7;
  const ellipseH  = ellipseW * 0.28;

  return (
    <View style={{ position: 'absolute', left: x, top: y, width: size[0], height: size[1] }}>

      {/* Halo de fondo (glow detrás del sprite) */}
      <View style={{
        position: 'absolute',
        top: size[1] * 0.1,
        left: size[0] * 0.05,
        width: size[0] * 0.9,
        height: size[1] * 0.8,
        borderRadius: 16,
        backgroundColor: glowColor,
      }} />

      {/* Sprite */}
      <Image
        source={sprite}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: size[0],
          height: size[1],
          resizeMode: 'contain',
          transform: [{ scaleX }],
        }}
      />

      {/* Elipse / shadow en la base — indica equipo */}
      <View style={{
        position: 'absolute',
        bottom: -4,
        left: (size[0] - ellipseW) / 2,
        width: ellipseW,
        height: ellipseH,
        borderRadius: ellipseW,
        backgroundColor: ringColor,
        opacity: 0.9,
        shadowColor: ringColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 8,
      }} />

      {/* Badge YOU / RIVAL */}
      <View style={{
        position: 'absolute',
        top: -20,
        left: 0, right: 0,
        alignItems: 'center',
      }}>
        <View style={{
          backgroundColor: ringColor,
          borderRadius: 6,
          paddingHorizontal: 6,
          paddingVertical: 2,
        }}>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// 🌍  WORLD SETUP
//     Necesita userId + room para saber quién es P1/P2 y
//     hacer spawn en el lado correcto desde el inicio
// ─────────────────────────────────────────────────────────────
const setupWorld = (userId: string | undefined, room: any) => {
  const engine = Matter.Engine.create({ enableSleeping: false });
  const world  = engine.world;
  engine.gravity.y = 1.5;

  const isP1 = room?.player1?.id === userId;

  // El jugador local spawna en su lado, el enemigo en el opuesto
  const mySpawnX    = isP1 ? P1_SPAWN_X : P2_SPAWN_X;
  const enemySpawnX = isP1 ? P2_SPAWN_X : P1_SPAWN_X;

  const CAT_PLAYER = 0x0001;
  const CAT_WORLD  = 0x0002;

  // ── Cuerpo del jugador local: dinámico, colisiona con mundo
  const myBody = Matter.Bodies.rectangle(mySpawnX, SPAWN_Y, PLAYER_W, PLAYER_H, {
    label: isP1 ? 'Player1' : 'Player2',
    frictionAir: 0.15,   // fricción alta → no resbaloso
    friction: 0.9,
    restitution: 0,       // sin rebote al aterrizar
    collisionFilter: { category: CAT_PLAYER, mask: CAT_WORLD },
  });

  // ── Cuerpo del enemigo: dinámico pero sin colisión ni gravedad local
  //    PhysicsSystem lo tele-transporta a la pos de Firebase cada frame
  const enemyBody = Matter.Bodies.rectangle(enemySpawnX, SPAWN_Y, PLAYER_W, PLAYER_H, {
    label: isP1 ? 'Player2' : 'Player1',
    frictionAir: 1,
    collisionFilter: { category: CAT_PLAYER, mask: 0 },
    isStatic: false,
  });
  // Desactiva gravedad para versiones modernas de Matter
  (enemyBody as any).gravityScale = 0;

  // ── Suelo
  const floor = Matter.Bodies.rectangle(W / 2, FLOOR_Y + 25, W + 40, 500, {
    isStatic: true, label: 'Floor', friction: 0.9,
    collisionFilter: { category: CAT_WORLD, mask: CAT_PLAYER },
  });

  // ── Paredes laterales (clampan al jugador local en pantalla)
  const wallL = Matter.Bodies.rectangle(-25, H / 2, 50, H + 100, {
    isStatic: true, label: 'WallLeft',
    collisionFilter: { category: CAT_WORLD, mask: CAT_PLAYER },
  });
  const wallR = Matter.Bodies.rectangle(W + 25, H / 2, 50, H + 100, {
    isStatic: true, label: 'WallRight',
    collisionFilter: { category: CAT_WORLD, mask: CAT_PLAYER },
  });

  // ── Techo (evita saltos infinitos)
  const ceiling = Matter.Bodies.rectangle(W / 2, -25, W + 40, 50, {
    isStatic: true, label: 'Ceiling',
    collisionFilter: { category: CAT_WORLD, mask: CAT_PLAYER },
  });

  Matter.World.add(world, [myBody, enemyBody, floor, wallL, wallR, ceiling]);

  const commonSprites = {
    idle: [
      require('../../assets/sprites/pet_1/idle/idle_pelea/1.png'),
      require('../../assets/sprites/pet_1/idle/idle_pelea/2.png'),
      require('../../assets/sprites/pet_1/idle/idle_pelea/3.png'),
      require('../../assets/sprites/pet_1/idle/idle_pelea/4.png'),
      require('../../assets/sprites/pet_1/idle/idle_pelea/4.png'),
      require('../../assets/sprites/pet_1/idle/idle_pelea/3.png'),
      require('../../assets/sprites/pet_1/idle/idle_pelea/2.png'),
     
    ],
    walk: [
      require('../../assets/sprites/pet_1/walk/1.png'),
      require('../../assets/sprites/pet_1/walk/2.png'),
      require('../../assets/sprites/pet_1/walk/3.png'),
      require('../../assets/sprites/pet_1/walk/4.png'),
      require('../../assets/sprites/pet_1/walk/5.png'),
      require('../../assets/sprites/pet_1/walk/6.png'),
      require('../../assets/sprites/pet_1/walk/7.png'),
    ],
    jump: [
      require('../../assets/sprites/pet_1/jump/1.png'),
      require('../../assets/sprites/pet_1/jump/2.png'),
      require('../../assets/sprites/pet_1/jump/3.png'),
    ],
    attack1: [
      require('../../assets/sprites/pet_1/fight/1.png'),
    ],
    attack2: [
      require('../../assets/sprites/pet_1/fight/2.png'),
    ],
    attack3: [
      require('../../assets/sprites/pet_1/fight/3.png'),
    ],

    attack4: [
      require('../../assets/sprites/pet_1/fight/4.png'),
    ],
    block: [
      require('../../assets/sprites/pet_1/fight/block_punch.png'),
    ],
    hit: [
      require('../../assets/sprites/pet_1/hits/1.png'),
    ],
    hit_block: [
      require('../../assets/sprites/pet_1/hits/3.png'),
    ],
    died: [
      require('../../assets/sprites/pet_1/died/1.png'),
      require('../../assets/sprites/pet_1/died/2.png'),
      require('../../assets/sprites/pet_1/died/3.png'),
      require('../../assets/sprites/pet_1/died/4.png'),
      require('../../assets/sprites/pet_1/died/5.png'),
    ],
  };

  // Mapeamos player1/player2 en entities según quién es quién
  const p1Body = isP1 ? myBody : enemyBody;
  const p2Body = isP1 ? enemyBody : myBody;

  return {
    physics: { engine, world },

    player1: {
      body: p1Body,
      size: [80, 120],
      renderer: SpriteRenderer,
      state: 'idle',
      frame: 0,
      frameTime: 0,
      sprites: commonSprites,
      isLocalPlayer: isP1,    // verde si eres P1
    },

    player2: {
      body: p2Body,
      size: [80, 120],
      renderer: SpriteRenderer,
      state: 'idle',
      frame: 0,
      frameTime: 0,
      sprites: commonSprites,
      isLocalPlayer: !isP1,   // verde si eres P2 (tú sigues siendo "local")
    },

    floor: {
      body: floor,
      size: [W + 40, 50],
      color: 'transparent',
      renderer: View,
    },
  };
};

// ─────────────────────────────────────────────────────────────
// 🎮  GAME ENGINE COMPONENT
// ─────────────────────────────────────────────────────────────
export default function GameEngine({ joystick, actions, room, userId }: any) {
  // setupWorld se llama UNA SOLA VEZ con los datos iniciales
  const [entities] = useState(() => setupWorld(userId, room));

  return (
    <View style={styles.container}>
      <RNGameEngine
        style={styles.gameContainer}
        entities={entities}
        systems={[
          (ent: any, args: any) => PhysicsSystem(ent, { ...args, joystick, userId, room }),
          (ent: any, args: any) => BattleSystem(ent, { ...args, actions, userId, room }),
          AnimationSystem,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gameContainer: { position: 'absolute', width: '100%', height: '100%' },
});