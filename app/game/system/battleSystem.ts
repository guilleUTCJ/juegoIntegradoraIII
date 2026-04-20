// app/game/system/combatSystem.ts
import Matter from 'matter-js';

export const BattleSystem = (entities: any, { actions }: any) => {
  const player1 = entities.player1;
  const player2 = entities.player2;

  if (!actions) return entities;

  // 🎮 PLAYER 1
  if (actions.p1) {
    if (actions.p1.attack) {
      player1.state = 'attack';

      // 💥 empujar enemigo
      Matter.Body.setVelocity(player2.body, {
        x: 5,
        y: -2,
      });
    }

    if (actions.p1.block) {
      player1.state = 'block';
    }
  }

  // 🎮 PLAYER 2
  if (actions.p2) {
    if (actions.p2.attack) {
      player2.state = 'attack';

      Matter.Body.setVelocity(player1.body, {
        x: -5,
        y: -2,
      });
    }

    if (actions.p2.block) {
      player2.state = 'block';
    }
  }

  return entities;
};