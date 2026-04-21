import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    PanResponder,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import GameEngine from '../game/engine/GameEngine';
import { battleService } from '../services/battleService';
import { auth } from '../services/firebase';
import { multiplayerService, RoomSchema } from '../services/multiplayerService';
import { petService } from '../services/petService';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Combo label map ─────────────────────────────────────────
const COMBO_LABELS: Record<number, string> = {
    0: 'JAB',
    1: 'CROSS',
    2: 'HOOK',
    3: 'UPPERCUT',
};

const COMBO_COLORS: Record<number, string> = {
    0: '#facc15',
    1: '#fb923c',
    2: '#f87171',
    3: '#c084fc',
};

// ─── HP bar sub-component ─────────────────────────────────────
function HPBar({
    hp,
    maxHp = 100,
    color,
    reverse = false,
}: {
    hp: number;
    maxHp?: number;
    color: string;
    reverse?: boolean;
}) {
    const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    const barAnim = useRef(new Animated.Value(pct)).current;

    useEffect(() => {
        Animated.timing(barAnim, {
            toValue: pct,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [pct]);

    const width = barAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={[hpStyles.bg, reverse && { flexDirection: 'row-reverse' }]}>
            {/* Danger flash segments */}
            <Animated.View style={[hpStyles.fill, { width, backgroundColor: color }]} />
            {/* Segment dividers */}
            {[20, 40, 60, 80].map((v) => (
                <View key={v} style={[hpStyles.divider, { left: `${v}%` as any }]} />
            ))}
        </View>
    );
}

const hpStyles = StyleSheet.create({
    bg: {
        height: 14,
        backgroundColor: '#1e293b',
        borderRadius: 7,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#334155',
        flexDirection: 'row',
    },
    fill: {
        height: '100%',
        borderRadius: 7,
    },
    divider: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
});

// ─── Combo flash indicator ────────────────────────────────────
function ComboFlash({ label, color, trigger }: { label: string; color: string; trigger: number }) {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        if (!trigger) return;
        opacity.setValue(1);
        scale.setValue(0.5);
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 12 }),
            Animated.sequence([
                Animated.delay(400),
                Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]),
        ]).start();
    }, [trigger]);

    return (
        <Animated.View style={[comboStyles.wrap, { opacity, transform: [{ scale }] }]}>
            <Text style={[comboStyles.text, { color }]}>{label}</Text>
        </Animated.View>
    );
}

const comboStyles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        top: -36,
        alignSelf: 'center',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    text: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 3,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});

// ─── Main screen ──────────────────────────────────────────────
export default function BattleScreenScenario({ route, navigation }: any) {
    const roomId: string | undefined =
        route?.params?.roomId ??
        route?.params?.room?.id ??
        route?.params?.id;

    const [room, setRoom] = useState<RoomSchema | null>(null);
    const [isAttacking, setIsAttacking] = useState(false);
    const [joystickData, setJoystickData] = useState({ x: 0, y: 0 });
    const [comboStep, setComboStep] = useState(0); // 0-3, cycles
    const [comboFlashTrigger, setComboFlashTrigger] = useState(0);

    const [actions, setActions] = useState({
        p1: { attackAction: '', block: false },
        p2: { attackAction: '', block: false },
    });

    const joystick = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const hasNavigatedRef = useRef(false);
    const comboStepRef = useRef(0); // keep in sync without re-render lag

    // Pulse animation for attack button
    const attackPulse = useRef(new Animated.Value(1)).current;

    const userId = auth.currentUser?.uid;
    const isP1 = room?.player1?.id === userId;
    const me = isP1 ? room?.player1 : room?.player2;
    const enemy = isP1 ? room?.player2 : room?.player1;
    const meSafe = me ?? null;
    const enemySafe = enemy ?? null;

    useEffect(() => {
        if (!roomId) {
            console.error('BattleScreenScenario: roomId es undefined.');
            return;
        }
        const unsubscribe = multiplayerService.subscribeToRoom(roomId, (updatedRoom) => {
            setRoom(updatedRoom);
            if (updatedRoom.status === 'finished' && !hasNavigatedRef.current) {
                hasNavigatedRef.current = true;
                const isWinner =
                    (updatedRoom.winner === 'player1' && updatedRoom.player1?.id === userId) ||
                    (updatedRoom.winner === 'player2' && updatedRoom.player2?.id === userId);
                Alert.alert('Fin de la batalla', isWinner ? 'VICTORIA 🏆' : 'DERROTA 💀');
                setTimeout(() => {
                    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
                }, 1500);
            }
        });
        return () => unsubscribe?.();
    }, [roomId]);

    useEffect(() => {
        petService.getPetData();
    }, []);

    // ── Joystick ──────────────────────────────────────────────
    const panResponder = useMemo(() =>
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, g) => {
                const maxDist = 40;
                const dist = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
                const ratio = dist > maxDist ? maxDist / dist : 1;
                const x = g.dx * ratio;
                const y = g.dy * ratio;
                joystick.setValue({ x, y });
                setJoystickData({ x: x / maxDist, y: y / maxDist });
            },
            onPanResponderRelease: () => {
                Animated.spring(joystick, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
                setJoystickData({ x: 0, y: 0 });
            },
        }),
        []
    );

    // ── Attack with combo ─────────────────────────────────────
    const handleAttack = useCallback(async () => {
        if (!room || room.status !== 'playing' || isAttacking) return;

        // 1. Cálculo de proximidad
        // Obtenemos las posiciones X de ambos jugadores desde el estado de la sala
        const myPosX = isP1 ? room.player1?.posX : room.player2?.posX;
        const enemyPosX = isP1 ? room.player2?.posX : room.player1?.posX;

        // Calculamos la distancia absoluta
        const distance = Math.abs((myPosX ?? 0) - (enemyPosX ?? 0));

        // Definimos un rango de ataque (ejemplo: 70 unidades)
        const ATTACK_RANGE = 70;
        const isCloseEnough = distance <= ATTACK_RANGE;

        // 2. Verificación de bloqueo del enemigo
        // Obtenemos si el enemigo tiene activado el estado de bloqueo
        const enemyIsBlocking = isP1 ? room.player2?.action === 'block' : room.player1?.action === 'block';

        setIsAttacking(true);

        const currentStep = comboStepRef.current;
        const nextStep = (currentStep + 1) % 4;
        comboStepRef.current = nextStep;
        setComboStep(nextStep);
        setComboFlashTrigger(Date.now());

        const attackAction = `attack${currentStep + 1}`;
        const key = isP1 ? 'p1' : 'p2';

        // Set visual state locally (la animación ocurre siempre, aunque no conecte el golpe)
        setActions(prev => ({
            ...prev,
            [key]: { ...prev[key], attackAction },
        }));

        // Pulse animation
        Animated.sequence([
            Animated.timing(attackPulse, { toValue: 0.88, duration: 70, useNativeDriver: true }),
            Animated.spring(attackPulse, { toValue: 1, useNativeDriver: true }),
        ]).start();

        // 3. Ejecutar el ataque real solo si cumple las condiciones
        // Solo quitamos vida si están cerca Y el enemigo NO está bloqueando
        if (roomId && isCloseEnough && !enemyIsBlocking) {
            await battleService.performAttack(
                roomId,
                isP1,
                enemySafe ?? undefined,
                meSafe?.level ?? 1,
            );
        } else if (enemyIsBlocking && isCloseEnough) {
            console.log("Ataque bloqueado");
            handleBlock;
        }

        // Clear local attack state after animation window
        setTimeout(() => {
            setActions(prev => ({
                ...prev,
                [key]: { ...prev[key], attackAction: '' },
            }));
            setIsAttacking(false);
        }, 300);
    }, [room, isAttacking, isP1, enemySafe, meSafe, roomId]);

    // ── Block ─────────────────────────────────────────────────
    const handleBlock = (value: boolean) => {
        const key = isP1 ? 'p1' : 'p2';
        setActions(prev => ({
            ...prev,
            [key]: { ...prev[key], block: value },
        }));
    };

    // ── Guards ────────────────────────────────────────────────
    if (!roomId) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>❌ Error: no se recibió roomId</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!room || !room.player1) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#facc15" />
                <Text style={styles.loadingText}>Conectando...</Text>
            </View>
        );
    }

    if (!room.player2) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#facc15" />
                <Text style={styles.loadingText}>Esperando rival...</Text>
            </View>
        );
    }

    const comboColor = COMBO_COLORS[comboStepRef.current === 0 ? 3 : comboStepRef.current - 1];
    const comboLabel = COMBO_LABELS[comboStepRef.current === 0 ? 3 : comboStepRef.current - 1];

    return (
        <View style={styles.container}>
            {/* ── Game canvas ── */}
            <GameEngine
                joystick={joystickData}
                actions={actions}
                room={room}
                userId={userId}
            />

            {/* ── HUD ── */}
            <View style={styles.hudContainer}>
                {/* Player side */}
                <View style={styles.hudCard}>
                    <View style={styles.hudCardInner}>
                        <View style={styles.avatarDot} />
                        <View style={styles.hudTextCol}>
                            <Text style={styles.hudName} numberOfLines={1}>
                                {meSafe?.email?.split('@')[0] ?? '...'}
                            </Text>
                            <Text style={styles.hudLevel}>LVL {meSafe?.level ?? 1}</Text>
                        </View>
                        <Text style={styles.hudHpNum}>{meSafe?.hp ?? 0}</Text>
                    </View>
                    <HPBar hp={meSafe?.hp ?? 0} color="#22c55e" />
                </View>

                {/* VS badge */}
                <View style={styles.vsBadge}>
                    <Text style={styles.vsText}>VS</Text>
                </View>

                {/* Enemy side */}
                <View style={[styles.hudCard, styles.hudCardRight]}>
                    <View style={[styles.hudCardInner, { flexDirection: 'row-reverse' }]}>
                        <View style={[styles.avatarDot, { backgroundColor: '#ef4444' }]} />
                        <View style={[styles.hudTextCol, { alignItems: 'flex-end' }]}>
                            <Text style={styles.hudName} numberOfLines={1}>
                                {enemySafe?.email?.split('@')[0] ?? '...'}
                            </Text>
                            <Text style={styles.hudLevel}>LVL {enemySafe?.level ?? 1}</Text>
                        </View>
                        <Text style={styles.hudHpNum}>{enemySafe?.hp ?? 0}</Text>
                    </View>
                    <HPBar hp={enemySafe?.hp ?? 0} color="#ef4444" reverse />
                </View>
            </View>

            {/* ── Round timer / status badge ── */}
            <View style={styles.statusRow}>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                        {room.status === 'playing' ? '⚔  PELEA' : room.status === 'waiting' ? '⏳ ESPERA' : '🏁 FIN'}
                    </Text>
                </View>
            </View>

            {/* ── Controls ── */}
            <View style={styles.controlsOverlay}>
                {/* Joystick */}
                <View style={styles.joystickWrapper} {...panResponder.panHandlers}>
                    <View style={styles.joystickBase}>
                        <View style={styles.joystickRing} />
                        <Animated.View
                            style={[styles.joystickKnob, { transform: joystick.getTranslateTransform() }]}
                        />
                    </View>
                    <Text style={styles.controlLabel}>MOVER</Text>
                </View>

                {/* Action buttons */}
                <View style={styles.actionButtons}>
                    {/* Block */}
                    <View style={styles.btnCol}>
                        <TouchableOpacity
                            style={[styles.btnCircle, styles.btnDefend]}
                            onPressIn={() => handleBlock(true)}
                            onPressOut={() => handleBlock(false)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.btnIcon}>🛡</Text>
                        </TouchableOpacity>
                        <Text style={styles.controlLabel}>CUBRIR</Text>
                    </View>

                    {/* Attack */}
                    <View style={styles.btnCol}>
                        <View>
                            <ComboFlash
                                label={comboLabel}
                                color={comboColor}
                                trigger={comboFlashTrigger}
                            />
                            <Animated.View style={{ transform: [{ scale: attackPulse }] }}>
                                <TouchableOpacity
                                    style={[styles.btnCircle, styles.btnAttack, isAttacking && styles.btnAttacking]}
                                    onPress={handleAttack}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.btnIcon}>👊</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                        <Text style={styles.controlLabel}>ATACAR</Text>
                    </View>
                </View>
            </View>

            {/* ── Combo counter strip ── */}
            <View style={styles.comboStrip}>
                {[0, 1, 2, 3].map((i) => {
                    const active = comboStepRef.current === 0
                        ? i === 3
                        : i === comboStepRef.current - 1;
                    return (
                        <View
                            key={i}
                            style={[
                                styles.comboDot,
                                { backgroundColor: active ? COMBO_COLORS[i] : '#1e293b', borderColor: COMBO_COLORS[i] },
                            ]}
                        />
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' },
    loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14, letterSpacing: 1 },
    errorText: { color: '#f87171', fontSize: 16, marginBottom: 12 },
    backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#1e293b', borderRadius: 8 },
    backBtnText: { color: '#facc15', fontWeight: 'bold' },

    // ── HUD ──────────────────────────────────────────────────
    hudContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        zIndex: 20,
    },
    hudCard: {
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.88)',
        borderRadius: 10,
        padding: 8,
        borderWidth: 1,
        borderColor: '#1e3a5f',
        gap: 6,
    },
    hudCardRight: {
        borderColor: '#5f1e1e',
    },
    hudCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    avatarDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#22c55e',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    hudTextCol: {
        flex: 1,
    },
    hudName: {
        color: '#f1f5f9',
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    hudLevel: {
        color: '#64748b',
        fontSize: 10,
        letterSpacing: 1,
    },
    hudHpNum: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
        minWidth: 24,
        textAlign: 'right',
    },

    // ── VS ────────────────────────────────────────────────────
    vsBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0f172a',
        borderWidth: 2,
        borderColor: '#facc15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    vsText: {
        color: '#facc15',
        fontWeight: '900',
        fontSize: 11,
        letterSpacing: 1,
    },

    // ── Status row ────────────────────────────────────────────
    statusRow: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 110 : 80,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 15,
    },
    statusBadge: {
        backgroundColor: 'rgba(15,23,42,0.7)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#334155',
    },
    statusText: {
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
    },

    // ── Controls ──────────────────────────────────────────────
    controlsOverlay: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 30,
        zIndex: 20,
    },
    joystickWrapper: {
        alignItems: 'center',
        gap: 6,
    },
    joystickBase: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(15,23,42,0.85)',
        borderWidth: 2,
        borderColor: '#1e3a5f',
        justifyContent: 'center',
        alignItems: 'center',
    },
    joystickRing: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(99,179,237,0.2)',
        borderStyle: 'dashed',
    },
    joystickKnob: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#3b82f6',
        borderWidth: 2,
        borderColor: '#93c5fd',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'flex-end',
    },
    btnCol: {
        alignItems: 'center',
        gap: 6,
    },
    btnCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
        elevation: 10,
    },
    btnAttack: {
        backgroundColor: '#dc2626',
        borderColor: '#fca5a5',
        shadowColor: '#dc2626',
    },
    btnAttacking: {
        backgroundColor: '#991b1b',
    },
    btnDefend: {
        backgroundColor: '#1d4ed8',
        borderColor: '#93c5fd',
        shadowColor: '#3b82f6',
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    btnIcon: { fontSize: 26 },
    controlLabel: {
        color: '#475569',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 2,
    },

    // ── Combo strip ───────────────────────────────────────────
    comboStrip: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 155 : 135,
        right: 40,
        flexDirection: 'row',
        gap: 6,
        zIndex: 20,
    },
    comboDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
    },
});