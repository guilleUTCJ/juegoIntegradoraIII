import Matter from 'matter-js';
import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { GameEngine as RNGameEngine } from 'react-native-game-engine';

import { AnimationSystem } from '../system/animationSystem';
import { BattleSystem } from '../system/battleSystem';
import { PhysicsSystem } from '../system/physicsSystem';

const { width, height } = Dimensions.get('window');

// 🎨 RENDERIZADO DE SPRITES
const SpriteRenderer = ({ body, size, state, frame, sprites }: any) => {
  const x = body.position.x - size[0] / 2;
  const y = body.position.y - size[1] / 2;
  const spriteArray = sprites[state] || sprites.idle;
  const sprite = spriteArray[frame % spriteArray.length];
  const scaleX = body.facing === 'left' ? -1 : 1;

  return (
    <Image
      source={sprite}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size[0],
        height: size[1],
        resizeMode: 'contain',
        transform: [{ scaleX }],
      }}
    />
  );
};

// ✅ setupWorld: el cuerpo del enemigo se marca como isStatic=true
//    para que Matter.js NO le aplique gravedad ni físicas locales.
//    Su posición la controlamos 100% desde Firebase vía PhysicsSystem.
const setupWorld = () => {
  const engine = Matter.Engine.create({ enableSleeping: false });
  const world = engine.world;
  engine.gravity.y = 1.2;

  const p1 = Matter.Bodies.rectangle(150, height - 100, 60, 100, {
    label: 'Player1',
    frictionAir: 0.05,
  });

  // ✅ El enemigo es estático para que Matter.js no lo mueva por su cuenta
  const p2 = Matter.Bodies.rectangle(width - 150, height - 100, 60, 100, {
    label: 'Player2',
    frictionAir: 0.05,
    isStatic: true,   // ← CLAVE: no le aplica gravedad local
  });

  const floor = Matter.Bodies.rectangle(width / 2, height - 25, width, 50, {
    isStatic: true,
  });

  Matter.World.add(world, [p1, p2, floor]);

  const commonSprites = {
    idle: [
      require('../../assets/sprites/pet_1/idle/idle_pelea/1.png'),
      require('../../assets/sprites/pet_1/idle/idle_pelea/2.png'),
      require('../../assets/sprites/pet_1/idle/idle_pelea/3.png'),
      require('../../assets/sprites/pet_1/idle/idle_pelea/4.png'),
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
    attack: [
      require('../../assets/sprites/pet_1/fight/1.png'),
      require('../../assets/sprites/pet_1/fight/2.png'),
      require('../../assets/sprites/pet_1/fight/3.png'),
      require('../../assets/sprites/pet_1/fight/4.png'),
    ],
    block: [
      require('../../assets/sprites/pet_1/fight/block_punch.png'),
    ],
    hit: [
      require('../../assets/sprites/pet_1/hits/1.png'),
      require('../../assets/sprites/pet_1/hits/2.png'),
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

  return {
    physics: { engine, world },
    player1: {
      body: p1,
      size: [80, 120],
      renderer: SpriteRenderer,
      state: 'idle',
      frame: 0,
      frameTime: 0,
      sprites: commonSprites,
    },
    player2: {
      body: p2,
      size: [80, 120],
      renderer: SpriteRenderer,
      state: 'idle',
      frame: 0,
      frameTime: 0,
      sprites: commonSprites,
    },
    floor: {
      body: floor,
      size: [width, 50],
      color: '#333',
      renderer: View,
    },
  };
};

// ✅ setupWorld es llamado una sola vez por jugador.
//    Según quién eres (P1 o P2), el cuerpo "estático" (sin físicas locales)
//    es el del enemigo. Esto se resuelve en PhysicsSystem dinámicamente.
export default function GameEngine({ joystick, actions, room, userId }: any) {
  const [entities] = useState(setupWorld);

  return (
    <View style={styles.container}>
      <RNGameEngine
        style={styles.gameContainer}
        entities={entities}
        systems={[
          // ✅ PhysicsSystem ahora hace TODO: físicas locales + sincronización del enemigo + broadcast
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
