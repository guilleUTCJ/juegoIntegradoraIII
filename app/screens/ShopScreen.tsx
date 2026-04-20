import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { petService } from "../services/petService";

const { width } = Dimensions.get("window");

const SHOP_ITEMS = [
  { id: "1", emoji: "🍎", title: "MANZANA", price: 50, category: "food", key: "apple" },
  { id: "2", emoji: "🍗", title: "CARNE", price: 150, category: "food", key: "meat" },
  { id: "3", emoji: "🍞", title: "PAN", price: 30, category: "food", key: "bread" },
  { id: "4", emoji: "🧼", title: "JABÓN", price: 80, category: "clean", key: "soap" },
  { id: "5", emoji: "🍉", title: "SANDÍA", price: 60, category: "food", key: "watermelon" },
  { id: "6", emoji: "🥛", title: "LECHE", price: 40, category: "food", key: "milk" },
  { id: "7", emoji: "🍕", title: "PIZZA", price: 200, category: "food", key: "pizza" },
  { id: "8", emoji: "🍣", title: "SUSHI", price: 300, category: "food", key: "sushi" },
  { id: "9", emoji: "🧴", title: "CHAMPÚ", price: 120, category: "clean", key: "shampoo" },
  { id: "10", emoji: "🧽", title: "ESPONJA", price: 45, category: "clean", key: "sponge" },
  { id: "11", emoji: "🪥", title: "CEPILLO", price: 50, category: "clean", key: "toothbrush" },
  { id: "12", emoji: "🛁", title: "BURBUJAS", price: 150, category: "clean", key: "bubbles" }
];

export default function ShopScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [gold, setGold] = useState(0);
  
  const [quantities, setQuantities] = useState<{ [key: string]: number }>(
    SHOP_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: 1 }), {})
  );

  useEffect(() => {
    loadGold();
  }, []);

  const loadGold = async () => {
    const data = await petService.getPetData();
    if (data) setGold(data.gold);
  };

  const updateQuantity = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  const buyItem = async (item: typeof SHOP_ITEMS[0]) => {
    const qty = quantities[item.id] || 1;
    const totalCost = item.price * qty;

    if (gold < totalCost) {
      Alert.alert("Oro insuficiente", `Necesitas 💰 ${totalCost} para comprar ${qty} unidades.`);
      return;
    }

    const newGold = gold - totalCost;
    await petService.updatePetStats({ gold: newGold });
    await petService.addItem(item.category, item.key, qty);

    setGold(newGold);
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));

    Alert.alert("¡Compra exitosa!", `Añadido: ${qty}x ${item.title}`);
  };

  const renderShopItem = ({ item }: { item: typeof SHOP_ITEMS[0] }) => {
    const currentQty = quantities[item.id] || 1;
    const totalCost = item.price * currentQty;
    const canAfford = gold >= totalCost;

    return (
      <View style={styles.card}>
        {/* Etiqueta de Categoría (opcional pero visualmente atractivo) */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {item.category === 'food' ? 'Comida' : 'Limpieza'}
          </Text>
        </View>

        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.priceText}>💰 {item.price} c/u</Text>

        {/* SELECTOR DE CANTIDAD */}
        <View style={styles.quantityContainer}>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.id, -1)}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </Pressable>

          <Text style={styles.qtyNumber}>{currentQty}</Text>

          <Pressable
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.id, 1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </Pressable>
        </View>

        {/* BOTÓN DE COMPRA */}
        <Pressable
          style={[styles.buyButton, !canAfford && styles.buyDisabled]}
          onPress={() => buyItem(item)}
        >
          <Text style={styles.buyButtonText}>
            {canAfford ? `PAGAR 💰 ${totalCost}` : `FALTAN 💰 ${totalCost - gold}`}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require("../assets/images/background_lobby.png")}
      style={styles.container}
    >
      {/* HEADER REORGANIZADO */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        
        {/* Botón Atrás (Izquierda) */}
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>⬅️</Text>
        </Pressable>

        {/* Título y Oro (Centro) */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🛒 LA TIENDITA</Text>
          <View style={styles.goldBadge}>
            <Text style={styles.goldStatus}>💰 {gold}</Text>
          </View>
        </View>

        {/* Botón Mochila (Derecha) */}
        <Pressable
          style={styles.inventoryBtn}
          onPress={() => navigation.navigate("InventoryScreen")}
        >
          <Text style={styles.inventoryBtnIcon}>🎒</Text>
          <Text style={styles.inventoryBtnText}>MOCHILA</Text>
        </Pressable>
        
      </View>

      <FlatList
        data={SHOP_ITEMS}
        renderItem={renderShopItem}
        keyExtractor={(item) => item.id}
        numColumns={4}
        contentContainerStyle={styles.scrollContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#333'
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 45,
    height: 45,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#555'
  },
  backIcon: { fontSize: 20, marginLeft: -2 },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: "900", 
    color: "#FFF",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10 
  },
  goldBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FFD600'
  },
  goldStatus: { 
    color: "#FFD600", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  inventoryBtn: {
    backgroundColor: "#FFD600",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B8860B',
    elevation: 5
  },
  inventoryBtnIcon: { fontSize: 18, marginBottom: -2 },
  inventoryBtnText: { color: "#000", fontWeight: "900", fontSize: 10 },
  
  scrollContainer: { 
    padding: 15,
    paddingBottom: 40 
  },
  row: { 
    justifyContent: "space-evenly" 
  },
  card: {
    backgroundColor: "rgba(25, 30, 40, 0.95)", // Un azul/gris oscuro más elegante
    width: (width / 4) - 25,
    margin: 8,
    padding: 12,
    paddingTop: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#4A5568",
    alignItems: "center",
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  categoryBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFF'
  },
  categoryText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  emoji: { 
    fontSize: 40, 
    marginBottom: 5 
  },
  itemTitle: { 
    color: "#FFF", 
    fontSize: 12, 
    fontWeight: "bold",
    textAlign: 'center',
    marginBottom: 2
  },
  priceText: { 
    color: "#FFD600", 
    fontSize: 11, 
    fontWeight: '600',
    marginBottom: 10 
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
    width: '100%',
    marginBottom: 12,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    backgroundColor: '#4A5568',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  qtyBtnText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold',
    marginTop: -2 
  },
  qtyNumber: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  buyButton: {
    backgroundColor: "#22C55E", // Verde vibrante
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16A34A'
  },
  buyDisabled: { 
    backgroundColor: "#EF4444", // Rojo si no te alcanza
    borderColor: "#B91C1C",
    opacity: 0.8 
  },
  buyButtonText: { 
    color: "#FFF", 
    fontSize: 10, 
    fontWeight: "900" 
  }
});