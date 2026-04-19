import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { petService, PetStats } from '../services/petService';

const PetScreen = () => {
  const [stats, setStats] = useState<PetStats | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadPetData();
  }, []);

  const loadPetData = async () => {
    const data = await petService.getPetData();
    if (data) setStats(data);
  };

  const handleAction = async (type: 'eat' | 'sleep' | 'play') => {
    if (!stats) return;
    
    let updates = {};
    if (type === 'eat') updates = { hunger: Math.min(100, stats.hunger + 20), hp: Math.min(100, stats.hp + 5) };
    if (type === 'sleep') updates = { energy: Math.min(100, stats.energy + 30) };
    if (type === 'play') updates = { love: Math.min(100, stats.love + 10), energy: Math.max(0, stats.energy - 10) };

    await petService.updatePetStats(updates);
    loadPetData(); // Recargar visualmente
  };

  if (!stats) return <View style={styles.container}><Text>Cargando mascota...</Text></View>;

  return (
    <ImageBackground 
      source={require('../assets/images/background_lobby.png')} 
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.levelText}>Nivel {stats.level}</Text>
        <Text style={styles.expText}>EXP: {stats.experience}/100</Text>
      </View>

      <View style={styles.petContainer}>
        {/* Aquí iría la animación de tu pet_1, pet_2, etc */}
        <Image 
          source={require('../assets/sprites/pet_1/idle/0.png')} 
          style={styles.petImage} 
        />
      </View>

      <View style={styles.statsCard}>
        <StatBar label="Vida" value={stats.hp} color="#ff4d4d" />
        <StatBar label="Energía" value={stats.energy} color="#4db8ff" />
        <StatBar label="Hambre" value={stats.hunger} color="#ffa64d" />
      </View>

      <View style={styles.actions}>
        <ActionButton title="Alimentar" onPress={() => handleAction('eat')} icon="🍎" />
        <ActionButton title="Descansar" onPress={() => handleAction('sleep')} icon="💤" />
        <ActionButton title="Jugar" onPress={() => handleAction('play')} icon="⚽" />
      </View>

      <TouchableOpacity 
        style={styles.battleButton}
        onPress={() => navigation.navigate('BattleScreen' as never)}
      >
        <Text style={styles.battleButtonText}>¡IR A COMBATIR!</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
};

const StatBar = ({ label, value, color }: any) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <View style={styles.barBackground}>
      <View style={[styles.barFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  </View>
);

const ActionButton = ({ title, onPress, icon }: any) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={styles.actionText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { position: 'absolute', top: 50, alignItems: 'center' },
  levelText: { fontSize: 32, fontWeight: 'bold', color: '#fff', textShadowColor: '#000', textShadowRadius: 5 },
  expText: { color: '#ddd', fontSize: 16 },
  petContainer: { marginVertical: 40 },
  petImage: { width: 200, height: 200, resizeMode: 'contain' },
  statsCard: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 20, borderRadius: 15, width: '85%' },
  statRow: { marginBottom: 10 },
  statLabel: { color: '#fff', marginBottom: 5, fontWeight: 'bold' },
  barBackground: { height: 12, backgroundColor: '#333', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%' },
  actions: { flexDirection: 'row', marginTop: 20, gap: 10 },
  actionBtn: { backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center', width: 100 },
  actionIcon: { fontSize: 24 },
  actionText: { fontSize: 12, fontWeight: 'bold' },
  battleButton: { backgroundColor: '#ffcc00', padding: 20, borderRadius: 30, marginTop: 30, borderWidth: 3, borderColor: '#fff' },
  battleButtonText: { fontSize: 20, fontWeight: 'bold', color: '#000' }
});

export default PetScreen;