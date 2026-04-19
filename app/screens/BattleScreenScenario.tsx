import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { battleService } from '../services/battleService';
import { auth } from '../services/firebase';
import { multiplayerService, RoomSchema } from '../services/multiplayerService';
import { petService } from '../services/petService';

const { width, height } = Dimensions.get('window');

export default function BattleScreenScenario({ route, navigation }: any) {
    const { roomId } = route.params;

    const [room, setRoom] = useState<RoomSchema | null>(null);
    const [isAttacking, setIsAttacking] = useState(false);

    const joystick = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const attackAnim = useRef(new Animated.Value(0)).current;
    const myStatsRef = useRef<{ level: number } | null>(null);
    const hasNavigatedRef = useRef(false);

    const userId = auth.currentUser?.uid;

    // 🔥 SUSCRIPCIÓN A LA SALA
    useEffect(() => {
        const unsubscribe = multiplayerService.subscribeToRoom(roomId, (updatedRoom) => {
            setRoom(updatedRoom);

            if (
                updatedRoom.status === 'finished' &&
                updatedRoom.player1 &&
                updatedRoom.player2 &&
                !hasNavigatedRef.current
            ) {
                hasNavigatedRef.current = true;

                const isWinner =
                    (updatedRoom.winner === 'player1' && updatedRoom.player1.id === userId) ||
                    (updatedRoom.winner === 'player2' && updatedRoom.player2.id === userId);

                Alert.alert(
                    "Fin de la batalla",
                    isWinner ? "Ganaste 😎" : "Perdiste 😢"
                );

                setTimeout(() => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "Home" }]
                    });
                }, 1500);
            }
        });

        return () => unsubscribe?.();
    }, [roomId, userId]);

    // CARGAR ESTADÍSTICAS
    useEffect(() => {
        petService.getPetData().then((stats) => {
            myStatsRef.current = stats;
        });
    }, []);

    // 🔒 BLOQUEO DE ORIENTACIÓN CORREGIDO
    useEffect(() => {
        const lockScreen = async () => {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
        };
        lockScreen();

        return () => {
            ScreenOrientation.unlockAsync();
        };
    }, []);

    // 🎮 CONFIGURACIÓN DEL JOYSTICK
    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, g) => {
            joystick.setValue({
                x: Math.max(-40, Math.min(40, g.dx)),
                y: Math.max(-40, Math.min(40, g.dy))
            });
        },
        onPanResponderRelease: () => {
            Animated.spring(joystick, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: true
            }).start();
        }
    }), []);

    // 👊 LÓGICA DE ATAQUE
    const handleAttack = useCallback(async () => {
        if (!room || room.status !== 'playing' || isAttacking) return;
        if (!room.player1 || !room.player2) return;

        setIsAttacking(true);

        Animated.sequence([
            Animated.timing(attackAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(attackAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]).start(() => setIsAttacking(false));

        const isPlayer1 = room.player1.id === userId;
        const opponent = isPlayer1 ? room.player2 : room.player1;

        await battleService.performAttack(
            room.id,
            isPlayer1,
            opponent,
            myStatsRef.current?.level || 1
        );
    }, [room, isAttacking]);

    // ⏳ PANTALLAS DE CARGA
    if (!room || !room.player1) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Conectando...</Text>
            </View>
        );
    }

    if (!room.player2) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Esperando oponente...</Text>
            </View>
        );
    }

    const isP1 = room.player1.id === userId;
    const me = isP1 ? room.player1 : room.player2;
    const enemy = isP1 ? room.player2 : room.player1;

    const attackTranslate = attackAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, isP1 ? 60 : -60]
    });

    return (
        <View style={styles.container}>
            {/* 🕹️ CONTROLES IZQUIERDA (Joystick) */}
            <View style={styles.sideControls}>
                <View style={styles.joystickBase} {...panResponder.panHandlers}>
                    <Animated.View
                        style={[
                            styles.joystickKnob,
                            { transform: joystick.getTranslateTransform() }
                        ]}
                    />
                </View>
            </View>

            {/* ⚔️ ÁREA CENTRAL (Batalla) */}
            <View style={styles.battleArea}>
                {/* ENEMIGO (Arriba en Landscape) */}
                <View style={styles.entityArea}>
                    <Text style={styles.name}>{enemy.email}</Text>
                    <View style={styles.hpBarContainer}>
                        <View style={[styles.hpBar, { width: `${enemy.hp}%`, backgroundColor: '#ff4d4d' }]} />
                    </View>
                    <Text style={styles.petSprite}>
                        {enemy.action === 'attack' ? '⚔️' : '👾'}
                    </Text>
                </View>

                <Text style={styles.vsText}>VS</Text>

                {/* JUGADOR (Abajo en Landscape) */}
                <View style={styles.entityArea}>
                    <Animated.Text style={[styles.petSprite, { transform: [{ translateX: attackTranslate }] }]}>
                        🐶
                    </Animated.Text>
                    <View style={styles.hpBarContainer}>
                        <View style={[styles.hpBar, { width: `${me.hp}%`, backgroundColor: '#00ff00' }]} />
                    </View>
                    <Text style={styles.name}>Tú ({me.hp} HP)</Text>
                </View>
            </View>

            {/* 👊 CONTROLES DERECHA (Botones) */}
            <View style={styles.sideControls}>
                <TouchableOpacity 
                    style={[styles.actionBtn, styles.attackBtn]} 
                    onPress={handleAttack}
                    disabled={isAttacking}
                >
                    <Text style={styles.btnIcon}>👊</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.defendBtn]}>
                    <Text style={styles.btnIcon}>🛡️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#1b263b',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        color: '#fff',
        marginTop: 15,
        fontSize: 16,
        fontWeight: 'bold'
    },
    sideControls: {
        width: '20%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 25
    },
    battleArea: {
        width: '60%',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20
    },
    entityArea: {
        alignItems: 'center',
        width: '100%'
    },
    name: {
        color: '#e0e1dd',
        fontWeight: '600',
        fontSize: 14,
        marginBottom: 5
    },
    petSprite: {
        fontSize: 70
    },
    vsText: {
        color: '#FFD700',
        fontSize: 40,
        fontWeight: '900',
        fontStyle: 'italic'
    },
    hpBarContainer: {
        width: '80%',
        height: 12,
        backgroundColor: '#444',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#777',
        overflow: 'hidden'
    },
    hpBar: {
        height: '100%'
    },
    joystickBase: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(65, 90, 119, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e0e1dd'
    },
    joystickKnob: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: '#e0e1dd',
        elevation: 5
    },
    actionBtn: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        borderWidth: 3,
        borderColor: '#fff'
    },
    attackBtn: { backgroundColor: '#ff4d4d' },
    defendBtn: { backgroundColor: '#4d79ff' },
    btnIcon: {
        fontSize: 30
    }
});