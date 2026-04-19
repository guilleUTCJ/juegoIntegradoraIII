import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { auth } from '../services/firebase';
import { multiplayerService } from '../services/multiplayerService';
import { petService } from '../services/petService';

const BattleScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    // ✅ Bloquear orientación aquí, una sola vez, antes de navegar
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE_LEFT
    ).catch((e) => console.log("Error locking orientation:", e));

    startMatchmaking();

    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // ✅ Si el usuario cancela el matchmaking, desbloquear
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const startMatchmaking = async () => {
    try {
      const myStats = await petService.getPetData();

      const roomId = await multiplayerService.findMatch({
        id: userId || 'anonymous',
        hp: 100,
        level: myStats?.level || 1
      });

      const unsubscribe = multiplayerService.subscribeToRoom(roomId, (room) => {
        if (room.status === 'playing') {
          setLoading(false);
          unsubscribe?.();
          // ✅ La orientación ya está bloqueada, navigate sin efectos secundarios
          navigation.replace("BattleScreenScenario", { roomId });
        }
      });
    } catch (error) {
      console.error("Error en matchmaking:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        🔎 BUSCANDO OPONENTE...
      </Animated.Text>

      <ActivityIndicator size="large" color="#FFD700" />

      <Text style={styles.tip}>
        Preparando arena de combate...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20
  },
  title: {
    fontSize: 26,
    color: '#FFD700',
    fontWeight: '900',
    letterSpacing: 2
  },
  tip: {
    color: '#AAA',
    marginTop: 10
  }
});

export default BattleScreen;