import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { AudioProvider } from "./app/hooks/AudioContext";
import HomeScreen from "./app/screens/HomeScreen";
import LoginScreen from "./app/screens/LoginScreen";
import ProfileScreen from "./app/screens/ProfileScreen";
import SplashScreen from "./app/screens/SplashScreen";
import StartScreen from "./app/screens/StartScreen";
const Stack = createNativeStackNavigator();

export default function App(){

  return(
    <AudioProvider>
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown:false }}>

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
          name="Home" 
          component={HomeScreen} 
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