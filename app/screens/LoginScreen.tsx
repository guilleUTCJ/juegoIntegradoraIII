import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudio } from '../hooks/AudioContext';
import { login, register } from '../services/authService';

export default function LoginScreen({ navigation }: any) {

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / 375, height / 812);

  const styles = getStyles(scale, width);

  const { playMusic } = useAudio();
  const [isRegister,setIsRegister] = useState(false);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');

  const handleLogin = async () => {
    playMusic();
    try{
      await login(email,password);
      navigation.replace("Home");
    }catch(e){
      console.log("Login error",e);
    }
  };

  const handleRegister = async () => {
    playMusic();
    try{
      await register(email,password);
      navigation.replace("Home");
    }catch(e){
      console.log("Register error",e);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground 
          source={require('../assets/images/background_start.jpg')} 
          style={styles.background}
        >

          <StatusBar hidden/>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
            
            <View style={[styles.formCard,{marginTop:insets.top+20}]}>

              <Text style={styles.title}>
                {isRegister ? '¡ÚNETE A LA PELEA!' : 'BIENVENIDO'}
              </Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>EMAIL</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Tu correo..."
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>CONTRASEÑA</Text>

                <TextInput
                  style={styles.input}
                  placeholder="********"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <Pressable
                style={({pressed})=>[
                  styles.primaryBtn,
                  pressed && styles.pressedBtn
                ]}
                onPress={isRegister ? handleRegister : handleLogin}
              >
                <Text style={styles.btnText}>
                  {isRegister ? 'CREAR CUENTA' : 'ENTRAR'}
                </Text>
              </Pressable>

              <Pressable
                onPress={()=>setIsRegister(!isRegister)}
                style={styles.switchBtn}
              >
                <Text style={styles.switchText}>
                  {isRegister
                    ? '¿Ya tienes cuenta? Inicia sesión'
                    : '¿Eres nuevo? Regístrate aquí'}
                </Text>
              </Pressable>

            </View>

          </ScrollView>

        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// 🎯 estilos dinámicos
const getStyles = (scale: number, width: number) => StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:'#000'
  },

  background:{
    flex:1,
    padding:20 * scale
  },

  scrollContainer:{
    flexGrow:1,
    justifyContent:'center',
    alignItems:'center'
  },

  formCard:{
    backgroundColor:'#fff',
    width:'100%',
    maxWidth: width > 600 ? 500 : 400,
    borderRadius:30 * scale,
    borderWidth:4,
    borderColor:'#000',
    padding:20 * scale,
    alignItems:'center',
    alignSelf:'center',

    shadowColor:"#000",
    shadowOffset:{width:0,height:10},
    shadowOpacity:0.3,
    shadowRadius:5
  },

  title:{
    fontSize:24 * scale,
    color:'#FF3D00',
    marginBottom:20 * scale,
    textAlign:'center',
    fontWeight:'bold'
  },

  inputWrapper:{
    width:'100%',
    marginBottom:12 * scale
  },

  label:{
    fontSize:12 * scale,
    color:'#333',
    marginBottom:5,
    marginLeft:5,
    fontWeight:'bold'
  },

  input:{
    backgroundColor:'#EEE',
    borderRadius:15 * scale,
    borderWidth:2,
    borderColor:'#CCC',
    paddingHorizontal:12 * scale,
    paddingVertical:10 * scale,
    fontSize:14 * scale,
    color:'#000'
  },

  primaryBtn:{
    backgroundColor:'#FFCC00',
    width:'100%',
    paddingVertical:12 * scale,
    borderRadius:20 * scale,
    borderWidth:3,
    borderColor:'#000',
    borderBottomWidth:6,
    borderBottomColor:'#CC9900',
    marginTop:10 * scale,
    alignItems:'center'
  },

  pressedBtn:{
    transform:[{translateY:3}],
    borderBottomWidth:2
  },

  btnText:{
    fontSize:18 * scale,
    color:'#FFF',
    fontWeight:'bold',
    textShadowColor:'rgba(0,0,0,0.5)',
    textShadowOffset:{width:1,height:1},
    textShadowRadius:2
  },

  switchBtn:{
    marginTop:15 * scale
  },

  switchText:{
    color:'#555',
    fontSize:11 * scale,
    fontWeight:'bold',
    textDecorationLine:'underline'
  }

});