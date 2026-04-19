import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    Dimensions,
    Image,
    ImageBackground,
    Pressable, ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from "../services/firebase";

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();

    const handleLogout = async () => {
        try {
            await auth.signOut();
            await SecureStore.deleteItemAsync('userToken');
            navigation.replace("Start");
        } catch (error) {
            console.log("Error al salir:", error);
        }
    };

    // Extraemos un "Nickname" del email para que se vea más como un ID de juego
    const gameTag = auth.currentUser?.email?.split('@')[0].toUpperCase() || 'PLAYER_ONE';

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <ImageBackground
                source={require('../assets/images/background_lobby.png')}
                style={styles.background}
                blurRadius={2} // Un ligero desenfoque para que la UI resalte
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
                    ]}
                >
                    {/* --- HERO HEADER: El Badge del Jugador --- */}
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarFrame}>
                                {/* 1. Cambiamos View por Image */}
                                {/* 2. Usamos un condicional: si hay photoURL la muestra, si no, usa una imagen por defecto */}
                                <Image
                                    source={{
                                        uri: auth.currentUser?.photoURL || 'https://media.craiyon.com/2025-09-14/B2fMwH6xQ0yYA92a-a0fjg.webp'
                                    }}
                                    style={styles.avatarImage} // Nueva clase de estilo
                                    resizeMode="cover"
                                />
                            </View>
                            <View style={styles.lvlBadge}>
                                <Text style={styles.lvlText}>1</Text>
                            </View>
                        </View>

                        <View style={styles.idCard}>
                            <Text style={styles.userName}>{gameTag}</Text>
                            <Text style={styles.userEmail}>{auth.currentUser?.email}</Text>
                        </View>
                    </View>

                    {/* --- ACCIONES DE CUENTA --- */}
                    <View style={styles.actionsContainer}>
                        <MenuOption icon="⚙️" label="AJUSTES DEL JUEGO" color="#4A90E2" />
                        <MenuOption icon="🛡️" label="PRIVACIDAD" color="#50E3C2" />
                    </View>

                    {/* --- BOTÓN DE LOGOUT (MÁXIMO IMPACTO) --- */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.logoutBtn,
                            pressed && { transform: [{ translateY: 4 }], borderBottomWidth: 2 }
                        ]}
                        onPress={handleLogout}
                    >
                        <View style={styles.logoutContent}>
                            <Text style={styles.logoutText}>SALIR DEL JUEGO</Text>
                        </View>
                    </Pressable>

                </ScrollView>
            </ImageBackground>
        </View>
    );
}

// --- SUBCOMPONENTES PULIDOS ---

const StatItem = ({ label, value, color }: any) => (
    <View style={styles.statBox}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const MenuOption = ({ icon, label, color }: any) => (
    <Pressable style={({ pressed }) => [
        styles.menuOptionBtn,
        pressed && { transform: [{ scale: 0.98 }, { translateY: 2 }], borderBottomWidth: 1 }
    ]}>
        <View style={[styles.optionIconContainer, { backgroundColor: color }]}>
            <Text style={styles.optionIcon}>{icon}</Text>
        </View>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.arrow}>❯</Text>
    </Pressable>
);

// --- ESTILOS "JUICY" ---

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#001A33' },
    background: { flex: 1 },
    scrollContent: { alignItems: 'center', paddingHorizontal: 20 },

    // Header Style
    profileHeader: { alignItems: 'center', marginBottom: 20, width: '100%' },
    avatarWrapper: { marginBottom: -25, zIndex: 10 },
    avatarFrame: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 6,
        borderColor: '#FFF',
        backgroundColor: '#222',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        overflow: 'hidden',
        shadowRadius: 10,
    },
    avatarImage: {
    width: '100%',
    height: '100%',
  },
    avatarPlaceholder: { flex: 1, borderRadius: 60, backgroundColor: '#444' },
    lvlBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#FFD600',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 15,
        borderWidth: 3,
        borderColor: '#000'
    },
    lvlText: { fontFamily: 'LilitaOne_400Regular', fontSize: 20, color: '#000', fontWeight: 'bold' },

    idCard: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        width: '100%',
        paddingTop: 35,
        paddingBottom: 15,
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#444',
        alignItems: 'center'
    },
    userName: {
        fontFamily: 'LilitaOne_400Regular',
        fontSize: 26,
        color: '#FFF',
        letterSpacing: 1,
        textShadowColor: '#000',
        textShadowRadius: 3,
        textShadowOffset: { width: 2, height: 2 }
    },
    userEmail: { color: '#AAA', fontSize: 12, fontWeight: 'bold', marginTop: 4 },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 25,
        width: '100%'
    },
    statBox: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 15,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    statValue: { fontFamily: 'LilitaOne_400Regular', fontSize: 22 },
    statLabel: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

    // Actions
    actionsContainer: { width: '100%', gap: 12, marginBottom: 30 },
    menuOptionBtn: {
        flexDirection: 'row',
        backgroundColor: '#2C3E50',
        padding: 12,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#000',
        borderBottomWidth: 6, // Efecto 3D
    },
    optionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    optionIcon: { fontSize: 20 },
    optionLabel: { flex: 1, color: '#FFF', fontFamily: 'LilitaOne_400Regular', fontSize: 16 },
    arrow: { color: '#FFF', fontSize: 18, opacity: 0.5 },

    // Logout
    logoutBtn: {
        backgroundColor: '#FF5252',
        width: '100%',
        borderRadius: 20,
        borderWidth: 4,
        borderColor: '#000',
        borderBottomWidth: 8,
        borderBottomColor: '#B22A00',
    },
    logoutContent: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    logoutText: {
        fontFamily: 'LilitaOne_400Regular',
        fontSize: 22,
        color: '#FFF',
        letterSpacing: 1
    }
});