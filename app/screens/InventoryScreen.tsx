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
import { petService } from "../services/petService";

// Obtenemos dimensiones para cálculos dinámicos
const { width } = Dimensions.get("window");

export default function InventoryScreen() {
  const [inventory, setInventory] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    const pet = await petService.getPetData();
    setInventory(pet?.inventory || {});
    setLoading(false);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const useItem = async (category: string, item: string) => {
    // Lógica de aplicación de efectos
    if (category === "food") await petService.updatePetStats({ hunger: 100 });
    if (category === "rest") await petService.updatePetStats({ energy: 100 });
    if (category === "clean") await petService.updatePetStats({ cleanliness: 100 });

    await petService.removeItem(category, item, 1); //
    loadInventory();
  };

  // Convertimos el objeto de inventario en una lista plana para el Grid
  const renderData = Object.keys(inventory).flatMap(category => 
    Object.keys(inventory[category]).map(item => ({
      category,
      name: item,
      quantity: inventory[category][item]
    }))
  );

  const renderItem = ({ item }: any) => (
    <Pressable 
      style={styles.itemCard} 
      onPress={() => useItem(item.category, item.name)}
    >
      <Text style={styles.itemIcon}>
        {item.category === "food" ? "🍎" : item.category === "rest" ? "💤" : "🧼"}
      </Text>
      <Text style={styles.itemText}>{item.name}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>x{item.quantity}</Text>
      </View>
    </Pressable>
  );

  return (
    <ImageBackground
      source={require("../assets/images/background_lobby.png")} //
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🎒 MI INVENTARIO</Text>
      </View>

      <FlatList
        data={renderData}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.category}-${item.name}`}
        numColumns={4} // En horizontal, 4 columnas es ideal
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tienes objetos aún...</Text>
        }
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: 20 
  },
  header: {
    paddingHorizontal: 30,
    marginBottom: 10,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "900",
    color: "#FFD600", 
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10 
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center'
  },
  itemCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    width: (width / 4) - 30, // Ajuste responsivo para 4 columnas
    margin: 10,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#444',
    elevation: 5
  },
  itemIcon: {
    fontSize: 35,
    marginBottom: 5
  },
  itemText: { 
    color: "#333", 
    fontSize: 12, 
    fontWeight: "bold",
    textAlign: "center"
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4D4D',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFF'
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold'
  },
  emptyText: {
    color: "#FFF",
    marginTop: 50,
    fontSize: 18,
    fontStyle: "italic"
  }
});