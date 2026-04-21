import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Image,
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { petService } from "../services/petService";

// Configuraciones de regeneración
const ENERGY_REGEN_RATE = 1; // +1 de energía por segundo
const ENERGY_MAX = 100;

export default function BedroomScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [petStats, setPetStats] = useState<any>(null);
    const [isSleeping, setIsSleeping] = useState(false);
    
    // Animación para llenar la barra suavemente
    const barWidthAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadPetData();
    }, []);

    // 🔄 REGLA DE REGENERACIÓN EN TIEMPO REAL 🔄
    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | null = null;

        if (isSleeping && petStats) {
            // Regla: Aumentar energía cada segundo localmente
            timer = setInterval(() => {
                setPetStats((prev: any) => {
                    if (!prev || prev.energy >= ENERGY_MAX) {
                        if (timer) clearInterval(timer); // Detener timer si está lleno
                        return prev;
                    }

                    const newEnergy = Math.min(ENERGY_MAX, prev.energy + ENERGY_REGEN_RATE);
                    return { ...prev, energy: newEnergy };
                });
            }, 1000); // 1 segundo
        }

        return () => {
            // Limpiar timer al desmontar o dejar de dormir
            if (timer) clearInterval(timer);
        };
    }, [isSleeping]);

    // 📊 REGLA DE ANIMACIÓN DE LA BARRA 📊
    useEffect(() => {
        if (petStats) {
            // Regla: Animar el cambio de ancho en 500ms
            Animated.timing(barWidthAnim, {
                toValue: petStats.energy || 0,
                duration: 500,
                useNativeDriver: false, // width no soporta native driver
            }).start();
        }
    }, [petStats?.energy]);

    const loadPetData = async () => {
        const pet = await petService.getPetData();
        if (!pet) return;
        setPetStats(pet);
        setIsSleeping(pet.isSleeping || false); // Cargar estado actual
    };

    const toggleSleep = async () => {
        if (!petStats) return;

        if (!isSleeping) {
            // --- PASAR A MODO SUEÑO ---
            const updates = { 
                isSleeping: true, 
                // Opcional: registrar hora de inicio para regen offline
                lastSleepStart: Date.now() 
            };
            
            // Optimistic update local
            setIsSleeping(true);
            setPetStats({ ...petStats, ...updates });

            // Actualizar Firebase
            await petService.updatePetStats(updates);

        } else {
            // --- DESPERTAR ---
            // Regla: Guardar la energía final acumulada
            const updates = { 
                isSleeping: false, 
                energy: petStats.energy 
            };

            // Optimistic update local
            setIsSleeping(false);
            
            // Actualizar Firebase
            await petService.updatePetStats(updates);
            
            // Recargar datos oficiales para asegurar sincronía
            loadPetData();
        }
    };

    // Interpolación para el ancho de la barra
    const barWidth = barWidthAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    return (
        <ImageBackground
            source={require("../assets/images/background_bedroom.png")} // Fondo temporal solicitado
            style={styles.container}
        >
            <View style={[styles.mainLayout, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                
                {/* BOTÓN VOLVER (Superior Izquierda) */}
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>⬅️</Text>
                </Pressable>

                {/* ZONA IZQUIERDA: La Mascota (Centro de atención) */}
                <View style={styles.petContainer}>
                    <View style={styles.petWrapper}>
                        {/* REGLA DE SPRITE: Cambiar según estado de sueño */}
                        <Image 
                            source={
                                isSleeping 
                                ? require("../assets/sprites/pet_1/idle/idle_home/4.png") // <--- TU idle_2.png AQUÍ (ojos cerrados)
                                : require("../assets/sprites/0.png") // <--- Sprite normal (ojos abiertos)
                            }
                            style={styles.petImage}
                            resizeMode="contain"
                        />
                        
                        {/* Overlay oscuro cuando duerme */}
                        {isSleeping && (
                            <View style={styles.sleepOverlay}>
                                <Text style={styles.zzzText}>Zzz...</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* SIDEBAR DERECHA: Barra e Inventario */}
                <View style={styles.sidebar}>
                    
                    {/* Barra de Energía Compacta */}
                    <View style={styles.statsCard}>
                        <Text style={styles.barLabel}>ENERGÍA</Text>
                        <View style={styles.barBackground}>
                            <Animated.View 
                                style={[
                                    styles.barFill, 
                                    { width: barWidth } 
                                ]} 
                            />
                            <Text style={styles.barText}>{Math.round(petStats?.energy || 0)}%</Text>
                        </View>
                    </View>

                    {/* Botón de Acción Principal (Dormir/Despertar) */}
                    <View style={styles.actionContainer}>
                        <Pressable 
                            onPress={toggleSleep}
                            style={[
                                styles.sleepButton,
                                isSleeping ? styles.wakeBtnStyle : styles.sleepBtnStyle
                            ]}
                        >
                            <Text style={styles.sleepBtnEmoji}>
                                {isSleeping ? '☀️' : '🌙'}
                            </Text>
                            <Text style={styles.sleepBtnText}>
                                {isSleeping ? 'DESPERTAR' : 'DORMIR'}
                            </Text>
                        </Pressable>
                        
                        {isSleeping && (
                            <Text style={styles.regenHint}>+1/seg</Text>
                        )}
                    </View>

                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    mainLayout: {
        flex: 1,
        flexDirection: 'row', // Layout lateral: Mascota | Sidebar
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 50, height: 50, borderRadius: 25,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#FFF',
        zIndex: 10
    },
    backIcon: { fontSize: 22 },
    
    // Área de la Mascota
    petContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    petWrapper: {
        width: 280,
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
    },
    petImage: {
        width: '100%',
        height: '100%',
    },
    sleepOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 20, 50, 0.4)', // Tinte azul oscuro
        borderRadius: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    zzzText: {
        position: 'absolute',
        top: 20,
        right: 40,
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
        textShadowColor: '#000',
        textShadowRadius: 4,
    },

    // Sidebar Derecha
    sidebar: {
        width: 140,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderLeftWidth: 3,
        borderLeftColor: '#FFD600', // Color amarillo para energía
        paddingVertical: 30,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    statsCard: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 10,
        borderRadius: 15,
        marginBottom: 30,
        alignItems: 'center',
    },
    barLabel: { color: '#FFD600', fontSize: 10, fontWeight: '900', marginBottom: 5, letterSpacing: 1 },
    barBackground: {
        width: '100%', height: 18, backgroundColor: '#222',
        borderRadius: 9, borderWidth: 1.5, borderColor: '#FFF', overflow: 'hidden',
    },
    barFill: { position: 'absolute', height: '100%', backgroundColor: '#FFD600' }, // Llenado amarillo
    barText: { 
        textAlign: 'center', color: '#FFF', fontSize: 9, fontWeight: 'bold', 
        textShadowColor: '#000', textShadowRadius: 2, lineHeight: 15 
    },

    actionContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sleepButton: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 20,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
    },
    sleepBtnStyle: {
        backgroundColor: '#4C1D95', // Morado oscuro
        borderColor: '#7C3AED',
    },
    wakeBtnStyle: {
        backgroundColor: '#CA8A04', // Amarillo oscuro
        borderColor: '#FBBF24',
    },
    sleepBtnEmoji: { fontSize: 32, marginBottom: 5 },
    sleepBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    regenHint: {
        marginTop: 10,
        color: '#FFD600',
        fontSize: 10,
        fontStyle: 'italic',
        fontWeight: 'bold'
    }
});