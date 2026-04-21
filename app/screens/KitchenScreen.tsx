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

const FOOD_CATALOG = [
    { id: "1", emoji: "🍎", title: "MANZANA",  category: "food", key: "apple",      recoveryValue: 15 },
    { id: "2", emoji: "🍗", title: "CARNE",    category: "food", key: "meat",       recoveryValue: 40 },
    { id: "3", emoji: "🍞", title: "PAN",      category: "food", key: "bread",      recoveryValue: 10 },
    { id: "5", emoji: "🍉", title: "SANDÍA",   category: "food", key: "watermelon", recoveryValue: 20 },
    { id: "6", emoji: "🥛", title: "LECHE",    category: "food", key: "milk",       recoveryValue: 15 },
    { id: "7", emoji: "🍕", title: "PIZZA",    category: "food", key: "pizza",      recoveryValue: 35 },
    { id: "8", emoji: "🍣", title: "SUSHI",    category: "food", key: "sushi",      recoveryValue: 50 }
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
            onPanResponderRelease: (_, gesture) => {
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

export default function KitchenScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [petStats, setPetStats] = useState<any>(null);
    const [foodItems, setFoodItems] = useState<any[]>([]);

    const eatAnim = useRef(new Animated.Value(0)).current;
    const barWidthAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadKitchenData();
    }, []);

    // Animar la barra de hambre cuando cambie
    useEffect(() => {
        if (petStats) {
            Animated.timing(barWidthAnim, {
                toValue: petStats.hunger || 0,
                duration: 500,
                useNativeDriver: false,
            }).start();
        }
    }, [petStats?.hunger]);

    const loadKitchenData = async () => {
        const pet = await petService.getPetData();
        if (!pet) return;
        setPetStats(pet);

        const inventory = pet.inventory || {};
        const foodCategory = inventory["food"] || {};

        const itemsArray = Object.keys(foodCategory)
            .map(key => {
                const catalogInfo = FOOD_CATALOG.find(i => i.key === key);
                return {
                    key,
                    quantity: foodCategory[key],
                    emoji: catalogInfo?.emoji || "🍽️",
                    title: catalogInfo?.title || key,
                    recoveryValue: catalogInfo?.recoveryValue || 10
                };
            })
            .filter(item => item.quantity > 0);

        setFoodItems(itemsArray);
    };

    const handleFeed = async (item: any) => {
        if (!petStats) return;

        Animated.sequence([
            Animated.timing(eatAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(eatAnim, { toValue: 0, duration: 800, delay: 500, useNativeDriver: true })
        ]).start();

        const newHunger = Math.min(100, (petStats.hunger || 0) + item.recoveryValue);

        // Optimistic update
        setPetStats({ ...petStats, hunger: newHunger });

        await petService.updatePetStats({ hunger: newHunger });
        await petService.removeItem("food", item.key, 1);

        loadKitchenData();
    };

    return (
        <ImageBackground
            source={require("../assets/images/background_kitchen.jpg")}
            style={styles.container}
        >
            <View style={[styles.mainLayout, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

                {/* BOTÓN VOLVER */}
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>⬅️</Text>
                </Pressable>

                {/* ZONA IZQUIERDA: La Mascota */}
                <View style={styles.petContainer}>
                    <View style={styles.petWrapper}>
                        <Image
                            source={require("../assets/sprites/0.png")}
                            style={styles.petImage}
                            resizeMode="contain"
                        />

                        {/* Efecto de comida sobre la mascota */}
                        <Animated.View style={[styles.eatEffect, { opacity: eatAnim, transform: [{ scale: eatAnim }] }]}>
                            <Text style={{ fontSize: 80 }}>✨🍽️✨</Text>
                        </Animated.View>
                    </View>
                </View>

                {/* SIDEBAR DERECHA */}
                <View style={styles.sidebar}>

                    {/* Barra de Hambre */}
                    <View style={styles.statsCard}>
                        <Text style={styles.barLabel}>HAMBRE</Text>
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
                            <Text style={styles.barText}>{Math.round(petStats?.hunger || 0)}%</Text>
                        </View>
                    </View>

                    {/* Inventario de Comida */}
                    <View style={styles.inventoryContainer}>
                        <Text style={styles.inventoryTitle}>DESPENSA</Text>
                        <ScrollView
                            contentContainerStyle={styles.scrollItems}
                            showsVerticalScrollIndicator={false}
                        >
                            {foodItems.length > 0 ? (
                                foodItems.map((item) => (
                                    <View key={item.key} style={styles.itemSlot}>
                                        <DraggableItem item={item} onUseItem={handleFeed} />
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
    container: { flex: 1, backgroundColor: '#1a0f00' },
    mainLayout: {
        flex: 1,
        flexDirection: 'row',
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
    eatEffect: {
        position: 'absolute',
        zIndex: 10,
    },

    // Sidebar Derecha
    sidebar: {
        width: 120,
        backgroundColor: 'rgba(26, 15, 0, 0.85)',
        borderLeftWidth: 3,
        borderLeftColor: '#FF9800',
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
    barLabel: { color: '#FF9800', fontSize: 10, fontWeight: '900', marginBottom: 5 },
    barBackground: {
        width: '100%', height: 18, backgroundColor: '#222',
        borderRadius: 9, borderWidth: 1.5, borderColor: '#FFF', overflow: 'hidden',
    },
    barFill: { position: 'absolute', height: '100%', backgroundColor: '#FF9800' },
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
        borderColor: '#FF9800',
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
        width: 70, height: 70, backgroundColor: 'rgba(255,152,0,0.2)',
        borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#FF9800',
        alignItems: 'center', justifyContent: 'center'
    },
    emptyText: { fontSize: 24 },
    emptySubText: { color: '#FF9800', fontSize: 8, fontWeight: 'bold' }
});