import React from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { petService } from "../services/petService";

export default function ShopScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const buyItem = async (type: string) => {
    if (type === "food") {
      await petService.updatePetStats({ hunger: 100 });
    }
    if (type === "bed") {
      await petService.updatePetStats({ energy: 100 });
    }
    if (type === "bath") {
      await petService.updatePetStats({ cleanliness: 100 });
    }
  };

  const Item = ({ emoji, title, desc, onPress }: any) => (
    <Pressable style={styles.item} onPress={onPress}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{desc}</Text>
      <View style={styles.button}>
        <Text style={styles.buttonText}>COMPRAR</Text>
      </View>
    </Pressable>
  );

  return (
    <ImageBackground
      source={require("../assets/images/background_lobby.png")}
      style={styles.container}
      imageStyle={{ opacity: 0.9 }}
    >
      <View style={[styles.header, { marginTop: insets.top }]}>
        <Text style={styles.headerText}>🛒 TIENDA</Text>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>⬅ VOLVER</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        <Item
          emoji="🍖"
          title="COMIDA"
          desc="+100 HAMBRE"
          onPress={() => buyItem("food")}
        />

        <Item
          emoji="🛏"
          title="CAMA"
          desc="+100 ENERGÍA"
          onPress={() => buyItem("bed")}
        />

        <Item
          emoji="🚿"
          title="BAÑO"
          desc="+100 LIMPIEZA"
          onPress={() => buyItem("bath")}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20
  },

  headerText: {
    fontSize: 28,
    color: "#FFF",
    fontFamily: "monospace",
    letterSpacing: 2
  },

  back: {
    color: "#FFD600",
    fontSize: 16,
    fontFamily: "monospace"
  },

  grid: {
    flex: 1,
    justifyContent: "center",
    gap: 20
  },

  item: {
    backgroundColor: "#1B1B1B",
    borderWidth: 4,
    borderColor: "#000",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8
  },

  emoji: {
    fontSize: 40,
    marginBottom: 10
  },

  title: {
    fontSize: 18,
    color: "#FFF",
    fontFamily: "monospace"
  },

  desc: {
    fontSize: 12,
    color: "#AAA",
    marginBottom: 10,
    fontFamily: "monospace"
  },

  button: {
    backgroundColor: "#FF3D00",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 3,
    borderColor: "#000"
  },

  buttonText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "monospace",
    letterSpacing: 1
  }
});