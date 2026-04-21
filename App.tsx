import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { AudioProvider } from "./app/hooks/AudioContext";
import HomeScreen from "./app/screens/HomeScreen";
import LoginScreen from "./app/screens/LoginScreen";
import ProfileScreen from "./app/screens/ProfileScreen";
import SplashScreen from "./app/screens/SplashScreen";
import StartScreen from "./app/screens/StartScreen";

// Importamos las nuevas pantallas desarrolladas
import BathroomScreen from "./app/screens/BathroomScreen";
import BattleScreen from "./app/screens/BattleScreen";
import BattleScreenScenario from "./app/screens/BattleScreenScenario";
import BedroomScreen from "./app/screens/BedroomScreen";
import InventoryScreen from "./app/screens/InventoryScreen";
import ShopScreen from "./app/screens/ShopScreen";
const Stack = createNativeStackNavigator();

export default function App() {

  return (
    <AudioProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>

          <Stack.Screen
            name="Splash"
            component={SplashScreen}
          />

          <Stack.Screen
            name="Start"
            component={StartScreen}
          />

          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />

          <Stack.Screen
            name="BedroomScreen"
            component={BedroomScreen}
          />

          <Stack.Screen
            name="Home"
            component={HomeScreen}
          />

          <Stack.Screen 
          name="ShopScreen" 
          component={ShopScreen} 
          />

          {/* Nueva ruta para el cuidado de la mascota */}

          <Stack.Screen
            name="BathroomScreen"
            component={BathroomScreen}
          />
          {/* Nueva ruta para el combate PvP */}
          <Stack.Screen
            name="BattleScreen"
            component={BattleScreen}
          />

          <Stack.Screen
            name="BattleScreenScenario"
            component={BattleScreenScenario}
          />

          <Stack.Screen
            name="InventoryScreen"
            component={InventoryScreen}
          />

          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
          />

        </Stack.Navigator>
      </NavigationContainer>
    </AudioProvider>
  );
}