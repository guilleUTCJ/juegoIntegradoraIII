import { LilitaOne_400Regular, useFonts } from '@expo-google-fonts/lilita-one';
import React, { useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    ImageBackground,
    Pressable,
    StyleSheet,
    View
} from "react-native";

import { useAudio } from '../hooks/AudioContext';
import { auth } from "../services/firebase";

export default function StartScreen({ navigation }: any) {

  const { playMusic } = useAudio();
  const [fontsLoaded] = useFonts({ LilitaOne_400Regular });
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {

    if (!fontsLoaded) return;

    playMusic();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim,{
          toValue:1,
          duration:1000,
          useNativeDriver:true
        }),
        Animated.timing(pulseAnim,{
          toValue:0.4,
          duration:1000,
          useNativeDriver:true
        })
      ])
    ).start();

  },[fontsLoaded]);

  useEffect(() => {

    const unsubscribe = auth.onAuthStateChanged(user => {

      if(user){
        navigation.replace("Home");
      }else{
        navigation.replace("Login");
      }

    });

    return unsubscribe;

  },[]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffc343" />
      </View>
    );
  }

  return (
    <Pressable style={styles.container}>
      <ImageBackground
        source={require("../assets/images/background_start.jpg")}
        resizeMode="cover"
        style={styles.background}
      >
        <Animated.Text 
          style={[
            styles.text,
            {
              opacity: pulseAnim,
              transform:[{
                scale:pulseAnim.interpolate({
                  inputRange:[0.4,1],
                  outputRange:[0.95,1.05]
                })
              }]
            }
          ]}
        >
          PRESIONA PARA COMENZAR
        </Animated.Text>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1
  },

  loadingContainer:{
    flex:1,
    backgroundColor:'#002b5c',
    justifyContent:'center',
    alignItems:'center'
  },

  background:{
    flex:1,
    justifyContent:"flex-end",
    alignItems:"center",
    paddingBottom:120
  },

  text:{
    top:70,
    color:"#ffc343",
    fontSize:32,
    fontFamily:"LilitaOne_400Regular",
    textAlign:'center',
    paddingHorizontal:20,
    textShadowColor:'#000',
    textShadowOffset:{width:3,height:3},
    textShadowRadius:1
  }
});