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
  { id: '1', emoji: "🍎", title: "MANZANA", price: 50, category: "food", key: "apple" },
  { id: '2', emoji: "🍗", title: "CARNE", price: 150, category: "food", key: "meat" },
  { id: '3', emoji: "🛏", title: "CAMA", price: 500, category: "rest", key: "bed" },
  { id: '4', emoji: "🧼", title: "JABÓN", price: 80, category: "clean", key: "soap" },
];

export default function ShopScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [gold, setGold] = useState(0);
  // Estado para controlar las cantidades de cada item por su ID
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
    // Actualizar en Firebase
    await petService.updatePetStats({ gold: newGold });
    await petService.addItem(item.category, item.key, qty);
    
    setGold(newGold);
    // Reiniciar contador a 1 tras la compra
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
    
    Alert.alert("¡Compra exitosa!", `Añadido: ${qty}x ${item.title}`);
  };

  const renderShopItem = ({ item }: { item: typeof SHOP_ITEMS[0] }) => {
    const currentQty = quantities[item.id] || 1;

    return (
      <View style={styles.card}>
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

        <Pressable 
          style={[styles.buyButton, gold < (item.price * currentQty) && styles.buyDisabled]} 
          onPress={() => buyItem(item)}
        >
          <Text style={styles.buyButtonText}>
            PAGAR 💰 {item.price * currentQty}
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
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <View>
          <Text style={styles.headerTitle}>🛒 TIENDA</Text>
          <Text style={styles.goldStatus}>DISPONIBLE: 💰 {gold}</Text>
        </View>
        
        <Pressable 
          style={styles.inventoryBtn} 
          onPress={() => navigation.navigate("InventoryScreen")}
        >
          <Text style={styles.inventoryBtnText}>🎒 VER MOCHILA</Text>
        </Pressable>
      </View>

      <FlatList
        data={SHOP_ITEMS}
        renderItem={renderShopItem}
        keyExtractor={(item) => item.id}
        numColumns={4}
        contentContainerStyle={styles.scrollContainer}
        columnWrapperStyle={styles.row}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingBottom: 15
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#FFF" },
  goldStatus: { color: "#FFD600", fontWeight: "bold", fontSize: 16 },
  inventoryBtn: {
    backgroundColor: "#FFD600",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inventoryBtnText: { color: "#000", fontWeight: "bold", fontSize: 12 },
  scrollContainer: { padding: 15 },
  row: { justifyContent: "center" },
  card: {
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    width: (width / 4) - 30,
    margin: 8,
    padding: 12,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#444",
    alignItems: "center",
  },
  emoji: { fontSize: 35, marginBottom: 5 },
  itemTitle: { color: "#FFF", fontSize: 11, fontWeight: "bold" },
  priceText: { color: "#AAA", fontSize: 10, marginVertical: 4 },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 10,
    marginVertical: 10,
    padding: 2,
  },
  qtyBtn: {
    width: 25,
    height: 25,
    backgroundColor: '#444',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  qtyBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  qtyNumber: {
    color: '#FFD600',
    paddingHorizontal: 12,
    fontWeight: 'bold',
    fontSize: 16
  },
  buyButton: { 
    backgroundColor: "#4CAF50", 
    paddingVertical: 8, 
    borderRadius: 10,
    width: '100%',
    alignItems: 'center'
  },
  buyDisabled: { backgroundColor: "#888", opacity: 0.5 },
  buyButtonText: { color: "#FFF", fontSize: 9, fontWeight: "bold" }
});