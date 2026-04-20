import { Audio } from 'expo-av';

let sounds: any = {};

// 1. Cargamos los sonidos a la memoria (Se ejecuta solo al iniciar)
const loadSounds = async () => {
  try {
    sounds.punch = new Audio.Sound();
    await sounds.punch.loadAsync(require('../../assets/sfx/punch_3.wav'));

    sounds.jump = new Audio.Sound();
    await sounds.jump.loadAsync(require('../../assets/sfx/swipe.wav'));
  } catch (error) {
    console.warn("Error cargando sonidos:", error);
  }
};

loadSounds();

// 2. Nueva función dedicada a reproducir el sonido de golpe
const playPunchSound = async () => {
  try {
    if (sounds.punch) {
      // replayAsync es perfecto porque si el sonido ya estaba sonando, lo reinicia al instante
      await sounds.punch.replayAsync(); 
    }
  } catch (error) {
    console.warn("Error reproduciendo punch:", error);
  }
};

// States that prevent auto-overwrite from velocity-based logic
const PRIORITY_STATES = ['attack1', 'attack2', 'attack3', 'attack4', 'hit','block', 'hit_block','died'];

// Map attack1..4 → the sprite key in commonSprites
const ATTACK_SPRITE_MAP: Record<string, string> = {
  attack1: 'attack1',
  attack2: 'attack2',
  attack3: 'attack3',
  attack4: 'attack4',
};

export const AnimationSystem = (entities: any, { time }: any) => {
  Object.keys(entities).forEach((key) => {
    const entity = entities[key];
    if (!entity.body || !entity.sprites) return;

    // 3. Guardamos el estado al iniciar el frame para comparar más adelante
    const prevState = entity.state;

    // Enemy: use networkState from Firebase
    if (entity.networkState !== undefined) {
      entity.state = entity.networkState;
    } else {
      // Local player: derive from velocity, but don't overwrite priority states
      const velocityX = entity.body.velocity.x;
      const velocityY = entity.body.velocity.y;

      if (!PRIORITY_STATES.includes(entity.state)) {
        if (velocityY < -1) {
          entity.state = 'jump';
        } else if (Math.abs(velocityX) > 1) {
          entity.state = 'walk';
        } else {
          entity.state = 'idle';
        }
      }
    }

    // Map attack1..4 to sprite key (falls back to 'attack1' if missing)
    const spriteKey = ATTACK_SPRITE_MAP[entity.state] ?? entity.state;
    const resolvedState = entity.sprites[spriteKey] ? spriteKey : 'idle';
    
    if (entity.state !== resolvedState && ATTACK_SPRITE_MAP[entity.state]) {
      // Use closest available attack sprite
      entity.state = entity.sprites['attack1'] ? 'attack1' : 'idle';
    } else if (!entity.sprites[resolvedState]) {
      entity.state = 'idle';
    }

    // 4. LÓGICA DE SONIDO: Si el estado acaba de cambiar y es 'hit' o algún ataque, suena.
    if (entity.state !== prevState && (entity.state === 'hit' || ATTACK_SPRITE_MAP[entity.state])) {
      playPunchSound();
    }

    // Animation speed per state
    const speedMap: Record<string, number> = {
      idle:    150,
      walk:    100,
      jump:     60,
      attack1:  80,
      attack2:  80,
      attack3:  80,
      attack4:  80,
      hit:      80,
      hit_block: 80,
      block:   120,
      died:    200,
    };
    const speed = speedMap[entity.state] ?? 100;

    const sprites = entity.sprites[entity.state] ?? entity.sprites['idle'];

    entity.frameTime += time.delta;
    if (entity.frameTime > speed) {
      entity.frame     = (entity.frame + 1) % sprites.length;
      entity.frameTime = 0;
    }
  });

  return entities;
};