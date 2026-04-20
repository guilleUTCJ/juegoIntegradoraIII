// app/game/system/battleSystem.ts

export const BattleSystem = (entities: any, { actions, userId, room }: any) => {
  if (!actions || !room) return entities;

  const isP1     = room?.player1?.id === userId;
  const myKey    = isP1 ? 'player1' : 'player2';
  const myPlayer = entities[myKey];

  if (!myPlayer) return entities;

  const myActions = isP1 ? actions.p1 : actions.p2;
  if (!myActions) return entities;

  // Apply attack animation state — the actual attack action (attack1/2/3/4)
  // is pushed from battleService via Firebase and arrives as networkState for the enemy,
  // or directly set here for the local player visual.
  if (myActions.attackAction && !['hit'].includes(myPlayer.state)) {
    myPlayer.state = myActions.attackAction; // e.g. 'attack1', 'attack2', etc.
  }

  if (myActions.block && !['hit'].includes(myPlayer.state)) {
    myPlayer.state = 'block';
  }

  return entities;
};