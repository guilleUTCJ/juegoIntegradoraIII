import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { battleService } from '../services/battleService';
import { auth } from '../services/firebase';
import { multiplayerService, RoomSchema } from '../services/multiplayerService';
import { petService } from '../services/petService';

const BattleScreen = () => {
  const [room, setRoom] = useState<RoomSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    startMatchmaking();
    return () => {
      if (room?.id) multiplayerService.leaveRoom(room.id);
    };
  }, []);

  const startMatchmaking = async () => {
    const myStats = await petService.getPetData();
    const roomId = await multiplayerService.findMatch({
      id: userId || 'anonymous',
      hp: 100,
      level: myStats?.level || 1 // Ahora TypeScript lo reconocerá
    });

    multiplayerService.subscribeToRoom(roomId, (updatedRoom) => {
      setRoom(updatedRoom);
      setLoading(false);

      if (updatedRoom.status === 'finished') {
        Alert.alert("Fin de la batalla", `Ganador: ${updatedRoom.winner}`);
      }
    });
  };

  const handleAttack = async () => {
    if (!room || room.status !== 'playing') return;

    const isPlayer1 = room.player1.id === userId;
    const opponent = isPlayer1 ? room.player2! : room.player1;
    const myStats = await petService.getPetData();

    const isVictory = await battleService.performAttack(
      room.id,
      isPlayer1,
      opponent,
      myStats?.level || 1
    );

    if (isVictory) {
      await petService.addExperience(50);
    }
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#ffcc00" />
      <Text style={styles.loadingText}>Buscando oponente...</Text>
    </View>
  );

  const isP1 = room?.player1.id === userId;
  const me = isP1 ? room?.player1 : room?.player2;
  const enemy = isP1 ? room?.player2 : room?.player1;

  return (
    <View style={styles.container}>
      <View style={styles.battleField}>
        {/* Lado Enemigo */}
        <View style={styles.playerArea}>
          <Text style={styles.playerName}>{enemy?.email || 'Esperando...'}</Text>
          <View style={styles.hpBarContainer}>
            <View style={[styles.hpBar, { width: `${enemy?.hp || 0}%`, backgroundColor: 'red' }]} />
          </View>
          <Text style={styles.spritePlaceholder}>{enemy?.action === 'attack' ? '⚔️' : '👾'}</Text>
        </View>

        <Text style={styles.vsText}>VS</Text>

        {/* Mi Lado */}
        <View style={styles.playerArea}>
          <Text style={styles.spritePlaceholder}>{me?.action === 'attack' ? '⚔️' : '🛡️'}</Text>
          <View style={styles.hpBarContainer}>
            <View style={[styles.hpBar, { width: `${me?.hp || 0}%`, backgroundColor: '#00ff00' }]} />
          </View>
          <Text style={styles.playerName}>Tú ({me?.hp} HP)</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.attackBtn, room?.status !== 'playing' && { opacity: 0.5 }]} 
          onPress={handleAttack}
          disabled={room?.status !== 'playing'}
        >
          <Text style={styles.attackBtnText}>ATACAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#fff', marginTop: 20, fontSize: 18 },
  battleField: { flex: 3, justifyContent: 'space-around', alignItems: 'center', paddingVertical: 50 },
  playerArea: { alignItems: 'center', width: '100%' },
  playerName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  hpBarContainer: { width: '70%', height: 20, backgroundColor: '#444', borderRadius: 10, overflow: 'hidden' },
  hpBar: { height: '100%' }, // Se eliminó 'transition' que causaba el error
  spritePlaceholder: { fontSize: 80, marginVertical: 20 },
  vsText: { color: '#ffcc00', fontSize: 40, fontWeight: '900' },
  controls: { 
    flex: 1, 
    backgroundColor: '#333', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30 
  },
  attackBtn: { 
    backgroundColor: '#ff4d4d', 
    paddingVertical: 20, 
    paddingHorizontal: 60, 
    borderRadius: 40, 
    elevation: 5 
  },
  attackBtnText: { color: '#fff', fontSize: 24, fontWeight: 'bold' }
});

export default BattleScreen;