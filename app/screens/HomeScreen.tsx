import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Image,
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudio } from '../hooks/AudioContext';
import { auth } from "../services/firebase";

export default function HomeScreen({ navigation }: any) {
    const { playMusic } = useAudio();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    
    // Animaciones
    const floatAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        NavigationBar.setVisibilityAsync("hidden");
        NavigationBar.setBehaviorAsync("inset-touch");
        playMusic();

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, { toValue: -12, duration: 1800, useNativeDriver: true }),
                Animated.timing(floatAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <ImageBackground
                source={require('../assets/images/background_lobby.png')}
                style={styles.background}
                imageStyle={{ opacity: 0.85 }}
            >

                {/* --- HEADER: PERFIL Y WALLET --- */}
                <View style={[styles.header, { marginTop: insets.top + 10 }]}>
                    <Pressable
                        style={styles.profileSection}
                        onPress={() => navigation.navigate("Profile")}
                    >
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{
                                    uri: auth.currentUser?.photoURL || 'https://media.craiyon.com/2025-09-14/B2fMwH6xQ0yYA92a-a0fjg.webp'
                                }}
                                style={styles.avatarImage}
                                resizeMode="cover"
                            />
                            <View style={styles.levelBadge}>
                                <Text style={styles.levelText}>12</Text>
                            </View>
                        </View>
                        <View>
                            <Text style={styles.userName}>
                                {auth.currentUser?.email || "JUGADOR 1"}
                            </Text>
                           
                        </View>
                    </Pressable>

                    <View style={styles.currencyWrapper}>
                        <StatBox value="1,250" icon="💰" color="#FFB300" />
                        <StatBox value="45" icon="💎" color="#00E5FF" />
                    </View>
                </View>

                {/* --- PANEL DE ESTADO (TAMAGOTCHI) --- */}
                <View style={[styles.statusPanel, { top: insets.top + 70, right: insets.right + 15 }]}>
                    <ProgressBar icon="🍖" color="#FF5252" progress={0.8} />
                    <ProgressBar icon="⚡" color="#FFD600" progress={0.4} />
                    <ProgressBar icon="🧼" color="#40C4FF" progress={0.6} />
                    <ProgressBar icon="❤️" color="#69F0AE" progress={0.9} />
                </View>

                {/* --- ACCIONES IZQUIERDA --- */}
                <View style={[styles.sidebarLeft, { left: insets.left + 15 }]}>
                    <CareButton icon="🍎" color="#FF5252" />
                    <CareButton icon="💤" color="#7C4DFF" />
                    <CareButton icon="🚿" color="#00B0FF" />
                </View>

                {/* --- MENÚS DERECHA --- */}
                <View style={[styles.sidebarRight, { right: insets.right + 15 }]}>
                    <NavButton icon="🛒" label="TIENDA" />
                    <NavButton icon="🐥" label="AVES" badge="!" />
                </View>

                {/* --- PERSONAJE CENTRAL --- */}
                <Animated.View style={[styles.charContainer, { transform: [{ translateY: floatAnim }] }]}>
                    <Image
                        source={require('../assets/images/main_item.png')}
                        style={{ width: width * 0.5, height: height * 0.6 }}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* --- FOOTER: PLAY --- */}
                <View style={[styles.footer, { marginBottom: insets.bottom + 20 }]}>
                    <Pressable style={({ pressed }) => [
                        styles.playButton,
                        pressed && { transform: [{ scale: 0.95 }, {translateY: 4}], borderBottomWidth: 2 }
                    ]}>
                        <Text style={styles.playText}>¡LUCHA!</Text>
                    </Pressable>
                </View>

            </ImageBackground>
        </View>
    );
}

// --- SUBCOMPONENTES ---

const ProgressBar = ({ icon, color, progress }: any) => (
    <View style={styles.barRow}>
        <Text style={styles.barIcon}>{icon}</Text>
        <View style={styles.barContainer}>
            <View style={[styles.barFill, { backgroundColor: color, width: `${progress * 100}%` }]} />
            <View style={styles.barGloss} />
        </View>
    </View>
);

const StatBox = ({ value, icon, color }: any) => (
    <View style={[styles.statBox, { borderColor: color }]}>
        <Text style={styles.statText}>{value}</Text>
        <View style={[styles.iconCircle, { backgroundColor: color }]}>
            <Text style={styles.iconSymbol}>{icon}</Text>
        </View>
    </View>
);

const CareButton = ({ icon, color }: any) => (
    <Pressable style={({ pressed }) => [
        styles.careBtn,
        { backgroundColor: color, borderBottomColor: 'rgba(0,0,0,0.3)' },
        pressed && { transform: [{ scale: 0.9 }] }
    ]}>
        <Text style={{ fontSize: 28 }}>{icon}</Text>
    </Pressable>
);

const NavButton = ({ icon, label, badge }: any) => (
    <Pressable style={styles.navBtn}>
        <View style={styles.navIconContainer}>
            <Text style={{ fontSize: 24 }}>{icon}</Text>
            {badge && <View style={styles.navBadge}><Text style={styles.navBadgeText}>{badge}</Text></View>}
        </View>
        <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
);

// --- ESTILOS MEJORADOS ---

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#001A33' },
    background: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        alignItems: 'center',
        zIndex: 100,
    },

    // Perfil
    profileSection: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 6,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    avatarContainer: { 
        width: 54, 
        height: 54, 
        borderRadius: 27, 
        borderWidth: 3, 
        borderColor: '#FFF',
        overflow: 'hidden', // Recorta la imagen
        backgroundColor: '#444'
    },
    avatarImage: { width: '100%', height: '100%' },
    levelBadge: { 
        position: 'absolute', 
        bottom: -2, 
        right: -2, 
        backgroundColor: '#FFD600', 
        borderRadius: 10, 
        paddingHorizontal: 6, 
        borderWidth: 2, 
        borderColor: '#000' 
    },
    levelText: { fontSize: 10, fontWeight: '900', color: '#000' },
    userName: { color: '#FFF', fontFamily: 'LilitaOne_400Regular', fontSize: 18 },
    rankText: { color: '#00E5FF', fontSize: 10, fontWeight: 'bold', marginTop: -4 },

    // Wallet
    currencyWrapper: { flexDirection: 'row', gap: 10 },
    statBox: { 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingLeft: 12, 
        borderRadius: 20, 
        borderWidth: 2, 
        height: 38 
    },
    statText: { color: '#FFF', fontFamily: 'LilitaOne_400Regular', fontSize: 14, marginRight: 8 },
    iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: -2 },
    iconSymbol: { fontSize: 14 },

    // Status Panel
    statusPanel: { 
        position: 'absolute', 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        padding: 12, 
        borderRadius: 20, 
        gap: 8, 
        width: 140,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    barIcon: { fontSize: 16 },
    barContainer: { flex: 1, height: 12, backgroundColor: '#111', borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
    barFill: { height: '100%', borderRadius: 6 },
    barGloss: { position: 'absolute', top: 1, left: '5%', width: '90%', height: '30%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },

    // Sidebars
    sidebarLeft: { position: 'absolute', top: '28%', gap: 18 },
    careBtn: { 
        width: 64, 
        height: 64, 
        borderRadius: 32, 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 3, 
        borderColor: '#FFF', 
        borderBottomWidth: 6,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
    },

    sidebarRight: { position: 'absolute', top: '55%', gap: 15 },
    navBtn: { alignItems: 'center' },
    navIconContainer: { 
        width: 60, 
        height: 60, 
        backgroundColor: '#2C3E50', 
        borderRadius: 15, 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 3, 
        borderColor: '#000', 
        transform: [{ skewX: '-6deg' }] 
    },
    navLabel: { color: '#FFF', fontFamily: 'LilitaOne_400Regular', fontSize: 11, marginTop: 4, textShadowColor: '#000', textShadowRadius: 2 },
    navBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFD600', borderRadius: 10, paddingHorizontal: 6, borderWidth: 2, borderColor: '#000' },
    navBadgeText: { fontSize: 10, fontWeight: 'bold' },

    charContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    footer: { alignItems: 'center' },
    playButton: {
        backgroundColor: '#FF3D00',
        paddingHorizontal: 70,
        paddingVertical: 20,
        borderRadius: 30,
        borderWidth: 4,
        borderColor: '#000',
        borderBottomWidth: 10,
        borderBottomColor: '#B22A00',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    playText: { fontSize: 38, color: '#FFF', fontFamily: 'LilitaOne_400Regular', letterSpacing: 2 },
});