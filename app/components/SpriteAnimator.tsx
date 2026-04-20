// app/components/SpriteAnimator.tsx
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface SpriteAnimatorProps {
  frames: any[]; // Arreglo de require('../ruta/imagen.png')
  fps?: number;
  loop?: boolean;
  onAnimationFinish?: () => void; // Útil para ataques que terminan
}

export const SpriteAnimator: React.FC<SpriteAnimatorProps> = ({ 
  frames, 
  fps = 10, 
  loop = true, 
  onAnimationFinish 
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    if (!frames || frames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrame((prevFrame) => {
        const nextFrame = prevFrame + 1;
        if (nextFrame >= frames.length) {
          if (!loop && onAnimationFinish) {
            onAnimationFinish();
            return prevFrame; // Se queda en el último frame si no hay loop
          }
          return 0; // Reinicia el bucle
        }
        return nextFrame;
      });
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [frames, fps, loop]);

  return (
    <View style={styles.container}>
      <Image 
        source={frames[currentFrame]} 
        style={styles.sprite} 
        contentFit="contain" // Mantiene la proporción del pixel art
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sprite: {
    width: '100%',
    height: '100%',
  }
});