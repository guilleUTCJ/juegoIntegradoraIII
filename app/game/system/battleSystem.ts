// app/game/system/battleSystem.ts

export const BattleSystem = (entities: any, { actions, userId, room }: any) => {
  if (!actions || !room) return entities;

  const isP1     = room?.player1?.id === userId;
  const myKey    = isP1 ? 'player1' : 'player2';
  const enemyKey = isP1 ? 'player2' : 'player1';
  
  const myPlayer = entities[myKey];
  const enemyPlayer = entities[enemyKey];

  if (!myPlayer || !enemyPlayer) return entities;

  const myActions = isP1 ? actions.p1 : actions.p2;
  const enemyActions = isP1 ? actions.p2 : actions.p1; // Para checar si el enemigo bloquea
  
  if (!myActions) return entities;

  // 1. Aplicar estado visual de ataque
  if (myActions.attackAction && !['hit'].includes(myPlayer.state)) {
    myPlayer.state = myActions.attackAction;

    // 2. Lógica de proximidad para quitar vida
    const dist = Math.abs(myPlayer.body.position.x - enemyPlayer.body.position.x);
    const RANGO_ATAQUE = 60; // Ajusta este valor según el tamaño de tus sprites

    if (dist < RANGO_ATAQUE) {
      // 3. Verificar si el enemigo está bloqueando
      // Si el enemigo tiene el estado 'block', no recibe daño o recibe menos
      if (enemyPlayer.state !== 'block') {
         // Aquí llamarías a tu servicio para restar vida real en Firebase
         // battleService.performAttack(...) 
      }
    }
  }

  if (myActions.block && !['hit'].includes(myPlayer.state)) {
    myPlayer.state = 'block';
  }

  return entities;
};