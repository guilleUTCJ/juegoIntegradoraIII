import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import {
    ActivityIndicator,
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
import { useFloatingAnimation } from '../hooks/useFloatingAnimation';
import { usePet } from '../hooks/usePet';
import { usePetActions } from '../hooks/usePetActions';
import { auth } from "../services/firebase";

export default function HomeScreen({ navigation }: any) {
    const { playMusic } = useAudio();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    // 🧠 hooks limpios
    const { petData, loading } = usePet();
    const { feed, sleep, clean } = usePetActions();
    const floatAnim = useFloatingAnimation();

    useEffect(() => {
        NavigationBar.setVisibilityAsync("hidden");
        NavigationBar.setBehaviorAsync("inset-touch");
        playMusic();
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#FFD600" />
            </View>
        );
    }

    const StatBox = ({ value, icon, color }: any) => (
        <View style={[styles.statBox, { borderColor: color }]}>
            <Text style={styles.statText}>{value}</Text>
            <View style={[styles.iconCircle, { backgroundColor: color }]}>
                <Text style={styles.iconSymbol}>{icon}</Text>
            </View>
        </View>
    );

    const ProgressBar = ({ icon, color, progress }: any) => (
        <View style={styles.barRow}>
            <Text style={styles.barIcon}>{icon}</Text>
            <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
                <View style={styles.barGloss} />
            </View>
        </View>
    );

    const CareButton = ({ icon, color, onPress }: any) => (
        <Pressable onPress={onPress} style={[styles.careBtn, { backgroundColor: color }]}>
            <Text style={{ fontSize: 24 }}>{icon}</Text>
        </Pressable>
    );

    const NavButton = ({ icon, label, onPress }: any) => (
        <Pressable style={styles.navBtn} onPress={onPress}>
            <View style={styles.navIconContainer}>
                <Text style={{ fontSize: 22 }}>{icon}</Text>
            </View>
            <Text style={styles.navLabel}>{label}</Text>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            <ImageBackground
                source={require('../assets/images/background_lobby.png')}
                style={styles.background}
                imageStyle={{ opacity: 0.85 }}
            >

                {/* HEADER */}
                <View style={[styles.header, { marginTop: insets.top + 10 }]}>
                    <Pressable
                        style={styles.profileSection}
                        onPress={() => navigation.navigate("Profile")}
                    >
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{
                                    uri:
                                        auth.currentUser?.photoURL ||
                                        'https://media.craiyon.com/2025-09-14/B2fMwH6xQ0yYA92a-a0fjg.webp'
                                }}
                                style={styles.avatarImage}
                            />
                            <View style={styles.levelBadge}>
                                <Text style={styles.levelText}>
                                    {petData?.level || 1}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.userName}>
                            {auth.currentUser?.email?.split('@')[0] || "JUGADOR"}
                        </Text>
                    </Pressable>

                    <View style={styles.currencyWrapper}>
                        <StatBox value="1,250" icon="💰" color="#FFB300" />
                    </View>
                </View>

                {/* ESTADOS */}
                <View style={[styles.statusPanel, { top: insets.top + 70, right: insets.right + 15 }]}>
                    <ProgressBar icon="🍖" color="#FF5252" progress={(petData?.hunger || 0) / 100} />
                    <ProgressBar icon="⚡" color="#FFD600" progress={(petData?.energy || 0) / 100} />
                    <ProgressBar icon="🧼" color="#40C4FF" progress={(petData?.cleanliness || 0) / 100} />

                </View>

                {/* ACCIONES */}
                <View style={[styles.sidebarLeft, { left: insets.left + 15 }]}>
                    <CareButton icon="🍎" color="#FF5252" onPress={feed} />
                    <CareButton icon="💤" color="#7C4DFF" onPress={sleep} />
                    <CareButton icon="🚿" color="#00B0FF" onPress={clean} />
                </View>

                {/* MENÚ */}
                <View style={[styles.sidebarRight, { right: insets.right + 15 }]}>
                    <NavButton icon="🛒" label="TIENDA" onPress={() => navigation.navigate("ShopScreen")} />
                    <NavButton icon="🐥" label="AVES" onPress={() => navigation.navigate("Pet")} />
                </View>

                {/* PERSONAJE */}
                <Animated.View style={[styles.charContainer, { transform: [{ translateY: floatAnim }] }]}>
                    <Image
                        source={require('../assets/images/main_item.png')}
                        style={{ width: width * 0.5, height: height * 0.6 }}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* BOTÓN */}
                <View style={[styles.footer, { marginBottom: insets.bottom + 20 }]}>
                    <Pressable
                        onPress={() => navigation.navigate("BattleScreen")}
                        style={({ pressed }) => [
                            styles.playButton,
                            pressed && { transform: [{ scale: 0.95 }, { translateY: 4 }] }
                        ]}
                    >
                        <Text style={styles.playText}>¡LUCHA!</Text>
                    </Pressable>
                </View>

            </ImageBackground>
        </View>
    );
}

// --- ESTILOS ---

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
        overflow: 'hidden',
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
    userName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
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
    statText: { color: '#FFF', fontSize: 14, marginRight: 8, fontWeight: 'bold' },
    iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: -2 },
    iconSymbol: { fontSize: 14 },
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
    },
    navLabel: { color: '#FFF', fontSize: 11, marginTop: 4, fontWeight: 'bold' },
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
    },
    playText: { fontSize: 38, color: '#FFF', fontWeight: 'bold', letterSpacing: 2 },
});