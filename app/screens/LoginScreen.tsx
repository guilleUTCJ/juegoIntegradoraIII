import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ImageBackground,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudio } from '../hooks/AudioContext';
import { login, register } from '../services/authService';

export default function LoginScreen({ navigation }: any) {

  const insets = useSafeAreaInsets();
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
                pressed && {transform:[{translateY:4}],borderBottomWidth:2}
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

        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:'#000'
  },

  background:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    padding:20
  },

  formCard:{
    backgroundColor:'#fff',
    width:'100%',
    maxWidth:400,
    borderRadius:30,
    borderWidth:5,
    borderColor:'#000',
    padding:25,
    alignItems:'center',
    shadowColor:"#000",
    shadowOffset:{width:0,height:10},
    shadowOpacity:0.3,
    shadowRadius:5
  },

  title:{
    fontSize:28,
    color:'#FF3D00',
    marginBottom:25,
    textAlign:'center',
    fontWeight:'bold'
  },

  inputWrapper:{
    width:'100%',
    marginBottom:15
  },

  label:{
    fontSize:14,
    color:'#333',
    marginBottom:5,
    marginLeft:5,
    fontWeight:'bold'
  },

  input:{
    backgroundColor:'#EEE',
    borderRadius:15,
    borderWidth:3,
    borderColor:'#CCC',
    paddingHorizontal:15,
    paddingVertical:12,
    fontSize:16,
    color:'#000'
  },

  primaryBtn:{
    backgroundColor:'#FFCC00',
    width:'100%',
    paddingVertical:15,
    borderRadius:20,
    borderWidth:4,
    borderColor:'#000',
    borderBottomWidth:8,
    borderBottomColor:'#CC9900',
    marginTop:10,
    alignItems:'center'
  },

  btnText:{
    fontSize:24,
    color:'#FFF',
    fontWeight:'bold',
    textShadowColor:'rgba(0,0,0,0.5)',
    textShadowOffset:{width:1,height:1},
    textShadowRadius:2
  },

  switchBtn:{
    marginTop:20
  },

  switchText:{
    color:'#555',
    fontSize:12,
    fontWeight:'bold',
    textDecorationLine:'underline'
  }

});