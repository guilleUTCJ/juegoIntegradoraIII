import { Audio } from 'expo-av';

let sounds: any = {};

const loadSounds = async () => {
  sounds.punch = new Audio.Sound();
  await sounds.punch.loadAsync(require('../../assets/sfx/punch_3.wav'));

  sounds.jump = new Audio.Sound();
  await sounds.jump.loadAsync(require('../../assets/sfx/swipe.wav'));
};

loadSounds();

export const AnimationSystem = (entities: any, { time }: any) => {
  Object.keys(entities).forEach((key) => {
    const entity = entities[key];
    if (!entity.body || !entity.sprites) return;

    // ✅ FIX CRÍTICO: si el enemigo tiene networkState (viene de Firebase),
    //    usarlo en vez de calcular desde velocity local (que siempre es 0
    //    porque el cuerpo es isStatic).
    if (entity.networkState !== undefined) {
      entity.state = entity.networkState;
    } else {
      // Jugador local: calcular estado desde físicas
      const velocityX = entity.body.velocity.x;
      const velocityY = entity.body.velocity.y;

      // Solo sobreescribir si no está en un estado de acción prioritaria
      if (!['attack', 'hit', 'block', 'died'].includes(entity.state)) {
        if (velocityY < -1) {
          entity.state = 'jump';
        } else if (Math.abs(velocityX) > 1) {
          entity.state = 'walk';
        } else {
          entity.state = 'idle';
        }
      }
    }

    // Velocidad de la animación según estado
    const speedMap: Record<string, number> = {
      idle: 150,
      walk: 100,
      jump: 60,
      attack: 80,
      hit: 80,
      block: 120,
      died: 200,
    };
    const speed = speedMap[entity.state] ?? 100;

    // Asegurarse de que el estado tiene sprites; si no, caer a idle
    if (!entity.sprites[entity.state]) {
      entity.state = 'idle';
    }

    entity.frameTime += time.delta;
    if (entity.frameTime > speed) {
      entity.frame = (entity.frame + 1) % entity.sprites[entity.state].length;
      entity.frameTime = 0;
    }
  });

  return entities;
};