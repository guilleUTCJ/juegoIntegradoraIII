// hooks/useFloatingAnimation.ts
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export const useFloatingAnimation = () => {
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, { toValue: -12, duration: 1800, useNativeDriver: true }),
                Animated.timing(floatAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return floatAnim;
};