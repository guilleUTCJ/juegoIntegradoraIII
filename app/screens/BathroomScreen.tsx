import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    ImageBackground,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { petService } from "../services/petService";

const { width, height } = Dimensions.get("window");

const CLEAN_CATALOG = [
    { id: "4", emoji: "🧼", title: "JABÓN", category: "clean", key: "soap", recoveryValue: 30 },
    { id: "9", emoji: "🧴", title: "CHAMPÚ", category: "clean", key: "shampoo", recoveryValue: 50 },
    { id: "10", emoji: "🧽", title: "ESPONJA", category: "clean", key: "sponge", recoveryValue: 20 },
    { id: "11", emoji: "🪥", title: "CEPILLO", category: "clean", key: "toothbrush", recoveryValue: 25 },
    { id: "12", emoji: "🛁", title: "BURBUJAS", category: "clean", key: "bubbles", recoveryValue: 100 }
];

const DraggableItem = ({ item, onUseItem }: any) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const scale = useRef(new Animated.Value(1)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                Animated.spring(scale, { toValue: 1.2, useNativeDriver: false }).start();
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (e, gesture) => {
                Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();
                
                // Detectar si se arrastró hacia la izquierda (donde está la mascota)
                if (gesture.dx < -100) {
                    onUseItem(item);
                }
                
                Animated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    friction: 5,
                    useNativeDriver: false
                }).start();
            }
        })
    ).current;

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.draggableItem,
                { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }] }
            ]}
        >
            <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>x{item.quantity}</Text>
            </View>
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
            <Text style={styles.itemTitle}>{item.title}</Text>
        </Animated.View>
    );
};

export default function BathroomScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [petStats, setPetStats] = useState<any>(null);
    const [cleanItems, setCleanItems] = useState<any[]>([]);
    
    // Animaciones
    const washAnim = useRef(new Animated.Value(0)).current;
    const barWidthAnim = useRef(new Animated.Value(0)).current; // Para la barra real-time

    useEffect(() => {
        loadBathroomData();
    }, []);

    // Actualizar la barra animada cada vez que cambie la higiene
    useEffect(() => {
        if (petStats) {
            Animated.timing(barWidthAnim, {
                toValue: petStats.cleanliness || 0,
                duration: 500,
                useNativeDriver: false,
            }).start();
        }
    }, [petStats?.cleanliness]);

    const loadBathroomData = async () => {
        const pet = await petService.getPetData();
        if (!pet) return;
        setPetStats(pet);

        const inventory = pet.inventory || {};
        const cleanCategory = inventory["clean"] || {};
        
        const itemsArray = Object.keys(cleanCategory)
            .map(key => {
                const catalogInfo = CLEAN_CATALOG.find(i => i.key === key);
                return {
                    key,
                    quantity: cleanCategory[key],
                    emoji: catalogInfo?.emoji || "🧼",
                    title: catalogInfo?.title || key,
                    recoveryValue: catalogInfo?.recoveryValue || 20
                };
            })
            .filter(item => item.quantity > 0);

        setCleanItems(itemsArray);
    };

    const handleWash = async (item: any) => {
        if (!petStats) return;

        Animated.sequence([
            Animated.timing(washAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(washAnim, { toValue: 0, duration: 800, delay: 500, useNativeDriver: true })
        ]).start();

        const newCleanliness = Math.min(100, (petStats.cleanliness || 0) + item.recoveryValue);
        
        // Optimistic Update (Actualización visual inmediata)
        setPetStats({ ...petStats, cleanliness: newCleanliness });

        await petService.updatePetStats({ cleanliness: newCleanliness });
        await petService.removeItem("clean", item.key, 1);
        
        loadBathroomData();
    };

    return (
        <ImageBackground
            source={require("../assets/images/background_bathroom.jpg")} // Asegúrate de tener un fondo de baño
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
                        <Image 
                            source={require("../assets/sprites/0.png")} // <--- TU IMAGEN AQUÍ
                            style={styles.petImage}
                            resizeMode="contain"
                        />
                        
                        {/* Efecto de Burbujas sobre la mascota */}
                        <Animated.View style={[styles.washEffect, { opacity: washAnim, transform: [{ scale: washAnim }] }]}>
                            <Text style={{ fontSize: 80 }}>🫧🧼🫧</Text>
                        </Animated.View>
                    </View>
                </View>

                {/* SIDEBAR DERECHA: Barra e Inventario */}
                <View style={styles.sidebar}>
                    
                    {/* Barra de Higiene Vertical o Compacta */}
                    <View style={styles.statsCard}>
                        <Text style={styles.barLabel}>HIGIENE</Text>
                        <View style={styles.barBackground}>
                            <Animated.View 
                                style={[
                                    styles.barFill, 
                                    { 
                                        width: barWidthAnim.interpolate({
                                            inputRange: [0, 100],
                                            outputRange: ['0%', '100%']
                                        }) 
                                    }
                                ]} 
                            />
                            <Text style={styles.barText}>{Math.round(petStats?.cleanliness || 0)}%</Text>
                        </View>
                    </View>

                    {/* Inventario de Objetos */}
                    <View style={styles.inventoryContainer}>
                        <Text style={styles.inventoryTitle}>LIMPIEZA</Text>
                        <ScrollView 
                            contentContainerStyle={styles.scrollItems}
                            showsVerticalScrollIndicator={false}
                        >
                            {cleanItems.length > 0 ? (
                                cleanItems.map((item) => (
                                    <View key={item.key} style={styles.itemSlot}>
                                        <DraggableItem item={item} onUseItem={handleWash} />
                                    </View>
                                ))
                            ) : (
                                <Pressable 
                                    onPress={() => navigation.navigate("ShopScreen")}
                                    style={styles.emptyCard}
                                >
                                    <Text style={styles.emptyText}>🛒</Text>
                                    <Text style={styles.emptySubText}>TIENDA</Text>
                                </Pressable>
                            )}
                        </ScrollView>
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
        flexDirection: 'row', // Todo en línea: Mascota | Sidebar
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
        width: 250,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
    },
    petImage: {
        width: '100%',
        height: '100%',
    },
    washEffect: {
        position: 'absolute',
        zIndex: 10,
    },

    // Sidebar Derecha
    sidebar: {
        width: 120,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderLeftWidth: 3,
        borderLeftColor: '#00B0FF',
        paddingVertical: 20,
        alignItems: 'center',
    },
    statsCard: {
        width: '90%',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 10,
        borderRadius: 15,
        marginBottom: 20,
        alignItems: 'center',
    },
    barLabel: { color: '#00B0FF', fontSize: 10, fontWeight: '900', marginBottom: 5 },
    barBackground: {
        width: '100%', height: 18, backgroundColor: '#222',
        borderRadius: 9, borderWidth: 1.5, borderColor: '#FFF', overflow: 'hidden',
    },
    barFill: { position: 'absolute', height: '100%', backgroundColor: '#00B0FF' },
    barText: { 
        textAlign: 'center', color: '#FFF', fontSize: 9, fontWeight: 'bold', 
        textShadowColor: '#000', textShadowRadius: 2, lineHeight: 15 
    },

    inventoryContainer: {
        flex: 1,
        width: '100%',
    },
    inventoryTitle: {
        color: '#FFF', fontSize: 10, fontWeight: 'bold', 
        textAlign: 'center', marginBottom: 10, letterSpacing: 1 
    },
    scrollItems: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    itemSlot: {
        marginBottom: 15,
    },
    draggableItem: {
        width: 75, height: 85,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#00B0FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemEmoji: { fontSize: 32 },
    itemTitle: { color: '#FFF', fontSize: 8, fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' },
    quantityBadge: {
        position: 'absolute', top: -5, right: -5,
        backgroundColor: '#FF4D4D', paddingHorizontal: 5,
        borderRadius: 8, borderWidth: 1, borderColor: '#FFF',
    },
    quantityText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

    emptyCard: {
        width: 70, height: 70, backgroundColor: 'rgba(255,214,0,0.2)',
        borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#FFD600',
        alignItems: 'center', justifyContent: 'center'
    },
    emptyText: { fontSize: 24 },
    emptySubText: { color: '#FFD600', fontSize: 8, fontWeight: 'bold' }
});