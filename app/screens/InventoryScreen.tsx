import React, { useEffect, useState } from "react";
import {
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

const ITEM_CATALOG = [
  { id: "1", emoji: "🍎", title: "MANZANA", price: 50, category: "food", key: "apple", recoveryValue: 15 },
  { id: "2", emoji: "🍗", title: "CARNE", price: 150, category: "food", key: "meat", recoveryValue: 40 },
  { id: "3", emoji: "🍞", title: "PAN", price: 30, category: "food", key: "bread", recoveryValue: 10 },
  { id: "4", emoji: "🧼", title: "JABÓN", price: 80, category: "clean", key: "soap", recoveryValue: 30 },
  { id: "5", emoji: "🍉", title: "SANDÍA", price: 60, category: "food", key: "watermelon", recoveryValue: 20 },
  { id: "6", emoji: "🥛", title: "LECHE", price: 40, category: "food", key: "milk", recoveryValue: 15 },
  { id: "7", emoji: "🍕", title: "PIZZA", price: 200, category: "food", key: "pizza", recoveryValue: 50 },
  { id: "8", emoji: "🍣", title: "SUSHI", price: 300, category: "food", key: "sushi", recoveryValue: 80 },
  { id: "9", emoji: "🧴", title: "CHAMPÚ", price: 120, category: "clean", key: "shampoo", recoveryValue: 50 },
  { id: "10", emoji: "🧽", title: "ESPONJA", price: 45, category: "clean", key: "sponge", recoveryValue: 20 },
  { id: "11", emoji: "🪥", title: "CEPILLO", price: 50, category: "clean", key: "toothbrush", recoveryValue: 25 },
  { id: "12", emoji: "🛁", title: "BURBUJAS", price: 150, category: "clean", key: "bubbles", recoveryValue: 100 }
];

export default function InventoryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [inventory, setInventory] = useState<any>({});
  const [petStats, setPetStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    const pet = await petService.getPetData();
    setInventory(pet?.inventory || {});
    setPetStats(pet);
    setLoading(false);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const useItem = async (category: string, itemKey: string) => {
    const itemData = ITEM_CATALOG.find(i => i.key === itemKey);
    if (!itemData || !petStats) return; 

    const recovery = itemData.recoveryValue || 10;

    if (category === "food") {
      const newHunger = Math.min(100, (petStats.hunger || 0) + recovery);
      await petService.updatePetStats({ hunger: newHunger });
    } else if (category === "rest") {
      const newEnergy = Math.min(100, (petStats.energy || 0) + recovery);
      await petService.updatePetStats({ energy: newEnergy });
    } else if (category === "clean") {
      const newCleanliness = Math.min(100, (petStats.cleanliness || 0) + recovery);
      await petService.updatePetStats({ cleanliness: newCleanliness });
    }

    await petService.removeItem(category, itemKey, 1);
    loadInventory();
  };

  const renderData = Object.keys(inventory).flatMap(category => 
    Object.keys(inventory[category]).map(itemKey => ({
      category,
      key: itemKey,
      quantity: inventory[category][itemKey]
    }))
  ).filter(item => item.quantity > 0);

  const renderItem = ({ item }: any) => {
    const catalogData = ITEM_CATALOG.find(i => i.key === item.key);
    const emoji = catalogData?.emoji || "📦";
    const title = catalogData?.title || item.key.toUpperCase();
    const recovery = catalogData?.recoveryValue || 10;

    // Traducir categoría para el badge
    const getCategoryName = (cat: string) => {
      if (cat === 'food') return 'COMIDA';
      if (cat === 'clean') return 'LIMPIEZA';
      if (cat === 'rest') return 'DESCANSO';
      return 'OBJETO';
    };

    return (
      <Pressable 
        style={styles.card} 
        onPress={() => useItem(item.category, item.key)}
      >
        {/* Etiqueta de Categoría estilo tienda */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {getCategoryName(item.category)}
          </Text>
        </View>

        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.itemTitle}>{title}</Text>
        
        {/* Etiqueta de cantidad recuperada */}
        <View style={styles.recoveryContainer}>
          <Text style={styles.recoveryText}>+{recovery}</Text>
        </View>

        {/* Badge de cantidad */}
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>x{item.quantity}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <ImageBackground
      source={require("../assets/images/background_lobby.png")} 
      style={styles.container}
    >
      {/* HEADER REORGANIZADO ESTILO TIENDA */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {/* Botón Atrás */}
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>⬅️</Text>
        </Pressable>

        {/* Título Central */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🎒 Inventario</Text>
        </View>

        {/* Espaciador invisible para mantener el título centrado */}
        <View style={{ width: 45 }} />
      </View>

      <FlatList
        data={renderData}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.category}-${item.key}`}
        numColumns={4} 
        contentContainerStyle={styles.scrollContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🕸️</Text>
            <Text style={styles.emptyText}>Tu mochila está vacía...</Text>
          </View>
        }
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
  scrollContainer: { 
    padding: 15,
    paddingBottom: 40 
  },
  row: { 
    justifyContent: "space-evenly" 
  },
  card: {
    backgroundColor: "rgba(25, 30, 40, 0.95)", // Mismo azul oscuro de la tienda
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
    backgroundColor: '#3B82F6', // Azul brillante
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
    fontSize: 11, 
    fontWeight: "bold",
    textAlign: 'center',
    marginBottom: 4
  },
  recoveryContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)', // Verde transparente
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22C55E'
  },
  recoveryText: {
    color: "#4ADE80", // Verde vibrante
    fontSize: 10,
    fontWeight: "900",
  },
  quantityBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFD600',
    elevation: 5
  },
  quantityText: {
    color: '#FFD600',
    fontSize: 11,
    fontWeight: 'bold'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 10,
    opacity: 0.8
  },
  emptyText: {
    color: "#AAA",
    fontSize: 18,
    fontStyle: "italic",
    fontWeight: "bold"
  }
});