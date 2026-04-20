// app/game/system/battleSystem.ts

export const BattleSystem = (entities: any, { actions, userId, room }: any) => {
  if (!actions || !room) return entities;

  const isP1     = room?.player1?.id === userId;
  const myKey    = isP1 ? 'player1' : 'player2';
  const myPlayer = entities[myKey];

  if (!myPlayer) return entities;

  const myActions = isP1 ? actions.p1 : actions.p2;
  if (!myActions) return entities;

  // ── Solo actualizamos el estado VISUAL del jugador local.
  //    El daño real (HP) lo gestiona battleService.performAttack() → Firebase.
  //    El estado del enemigo llega vía room.playerX.action → networkState.
  //
  // ⚠️ NO llamamos a Matter.Body.setVelocity() sobre el enemigo aquí.
  //    Hacerlo desincroniza la posición local respecto a Firebase.

  if (myActions.attack && !['attack', 'hit'].includes(myPlayer.state)) {
    myPlayer.state = 'attack';
  }

  if (myActions.block && !['attack', 'hit'].includes(myPlayer.state)) {
    myPlayer.state = 'block';
  }

  return entities;
};