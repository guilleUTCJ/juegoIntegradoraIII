
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import GameEngine from '../game/engine/GameEngine';
import { auth } from '../services/firebase';
import { multiplayerService, RoomSchema } from '../services/multiplayerService';
import { petService } from '../services/petService';

export default function BattleScreenScenario({ route, navigation }: any) {
    const { roomId } = route.params;

    const [room, setRoom] = useState<RoomSchema | null>(null);
    const [isAttacking, setIsAttacking] = useState(false);
    const [joystickData, setJoystickData] = useState({ x: 0, y: 0 });

    const [actions, setActions] = useState({
        p1: { attack: false, block: false },
        p2: { attack: false, block: false },
    });

    const joystick = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const attackAnim = useRef(new Animated.Value(0)).current;
    const hasNavigatedRef = useRef(false);

    const userId = auth.currentUser?.uid;
    const isP1 = room?.player1?.id === userId;
    const me = isP1 ? room?.player1 : room?.player2;
    const enemy = isP1 ? room?.player2 : room?.player1;
    const meSafe = me ?? null;
    const enemySafe = enemy ?? null;

    useEffect(() => {
        const unsubscribe = multiplayerService.subscribeToRoom(roomId, (updatedRoom) => {
            setRoom(updatedRoom);

            if (updatedRoom.status === 'finished' && !hasNavigatedRef.current) {
                hasNavigatedRef.current = true;

                const isWinner =
                    (updatedRoom.winner === 'player1' && updatedRoom.player1?.id === userId) ||
                    (updatedRoom.winner === 'player2' && updatedRoom.player2?.id === userId);

                Alert.alert("Fin de la batalla", isWinner ? "VICTORIA 😎" : "DERROTA 😢");

                setTimeout(() => {
                    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
                }, 1500);
            }
        });

        return () => unsubscribe?.();
    }, [roomId]);

    useEffect(() => {
        petService.getPetData();
   
    }, []);

    // 🎮 JOYSTICK
    // ✅ Ya NO llama a Firebase directamente — eso lo hace physicsSystem cada 50ms
    //    con la posición real del cuerpo físico.
    const panResponder = useMemo(() =>
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,

            onPanResponderMove: (_, g) => {
                const maxDist = 40;
                const dx = g.dx;
                const dy = g.dy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const ratio = dist > maxDist ? maxDist / dist : 1;
                const x = dx * ratio;
                const y = dy * ratio;

                joystick.setValue({ x, y });
                setJoystickData({ x: x / maxDist, y: y / maxDist });
            },

            onPanResponderRelease: () => {
                Animated.spring(joystick, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: true
                }).start();
                setJoystickData({ x: 0, y: 0 });
            }
        }),
        []
    );

    // 🎯 ATAQUE
    const handleAttack = useCallback(() => {
        if (!room || room.status !== 'playing' || isAttacking) return;

        setIsAttacking(true);
        const key = isP1 ? 'p1' : 'p2';

        setActions(prev => ({
            ...prev,
            [key]: { ...prev[key], attack: true }
        }));

        setTimeout(() => {
            setActions(prev => ({
                ...prev,
                [key]: { ...prev[key], attack: false }
            }));
        }, 200);

        Animated.sequence([
            Animated.timing(attackAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
            Animated.timing(attackAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start(() => setIsAttacking(false));

    }, [room, isAttacking, isP1]);

    const handleBlock = (value: boolean) => {
        const key = isP1 ? 'p1' : 'p2';
        setActions(prev => ({
            ...prev,
            [key]: { ...prev[key], block: value }
        }));
    };

    const attackTranslate = attackAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, isP1 ? 100 : -100]
    });

    if (!room || !room.player1) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Conectando...</Text>
            </View>
        );
    }

    if (!room.player2) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Esperando rival...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <GameEngine
                joystick={joystickData}
                actions={actions}
                room={roomId}
                userId={userId}
            />

            {/* HUD */}
            <View style={styles.hudContainer}>
                <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                        {meSafe?.email?.split('@')[0] ?? '...'}
                    </Text>
                    <View style={styles.hpBarBg}>
                        <View style={[styles.hpBarFill, { width: `${meSafe?.hp ?? 0}%`, backgroundColor: '#22c55e' }]} />
                    </View>
                </View>

                <Text style={styles.vsText}>VS</Text>

                <View style={[styles.playerInfo, { alignItems: 'flex-end' }]}>
                    <Text style={styles.playerName}>
                        {enemySafe?.email?.split('@')[0] ?? '...'}
                    </Text>
                    <View style={styles.hpBarBg}>
                        <View style={[styles.hpBarFill, { width: `${enemySafe?.hp ?? 0}%`, backgroundColor: '#ef4444' }]} />
                    </View>
                </View>
            </View>

            {/* PERSONAJES */}
            <View style={styles.centerStage}>
                <Animated.Text style={[styles.petSprite, { left: 100, transform: [{ translateX: isP1 ? attackTranslate : 0 }] }]}>
                    🐶
                </Animated.Text>
                <Animated.Text style={[styles.petSprite, { right: 100, transform: [{ translateX: !isP1 ? attackTranslate : 0 }] }]}>
                    🐺
                </Animated.Text>
            </View>

            {/* CONTROLES */}
            <View style={styles.controlsOverlay}>
                <View style={styles.joystickWrapper} {...panResponder.panHandlers}>
                    <View style={styles.joystickBase}>
                        <Animated.View
                            style={[styles.joystickKnob, { transform: joystick.getTranslateTransform() }]}
                        />
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.btnCircle, styles.btnAttack]} onPress={handleAttack}>
                        <Text style={styles.btnIcon}>👊</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btnCircle, styles.btnDefend]}
                        onPressIn={() => handleBlock(true)}
                        onPressOut={() => handleBlock(false)}
                    >
                        <Text style={styles.btnIcon}>🛡️</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#fff', marginTop: 10 },

    hudContainer: {
        position: 'absolute',
        top: 30,
        left: 30,
        right: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 10
    },
    playerInfo: { width: '40%' },
    playerName: { color: '#fff', fontWeight: 'bold' },
    hpBarBg: { height: 10, backgroundColor: '#333', borderRadius: 5, overflow: 'hidden' },
    hpBarFill: { height: '100%', borderRadius: 5 },
    vsText: { color: '#FFD700', fontWeight: 'bold', alignSelf: 'center' },

    centerStage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    petSprite: { fontSize: 80, position: 'absolute' },

    controlsOverlay: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 50
    },
    joystickWrapper: { width: 120, height: 120 },
    joystickBase: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    joystickKnob: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)'
    },
    actionButtons: { flexDirection: 'row', gap: 20, alignItems: 'center' },
    btnCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center'
    },
    btnAttack: { backgroundColor: '#dc2626' },
    btnDefend: { backgroundColor: '#2563eb' },
    btnIcon: { fontSize: 24 }
});