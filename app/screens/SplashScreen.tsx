import { useEffect } from "react";
import { Text, View } from "react-native";

export default function SplashScreen({ navigation }: any){

  useEffect(() => {

    setTimeout(() => {
      navigation.replace("Start");
    }, 3000);

  }, []);

  return(
    <View style={{
      flex:1,
      backgroundColor:"#000",
      justifyContent:"center",
      alignItems:"center"
    }}>
      <Text style={{color:"white",fontSize:28}}>
        Loading...
      </Text>
    </View>
  );
}