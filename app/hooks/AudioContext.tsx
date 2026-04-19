import { useAudioPlayer } from 'expo-audio';
import React, { createContext, useContext, useEffect } from 'react';

const AudioContext = createContext<any>({});

export const AudioProvider = ({ children }: any) => {
  // Cargamos el reproductor globalmente
  const player = useAudioPlayer(require('../assets/sfx/lobby_music.mp3'));

  useEffect(() => {
    player.loop = true;
    player.volume = 0.5;
  }, [player]);

  const playMusic = () => {
    if (!player.playing) {
      player.play();
    }
  };

  const pauseMusic = () => {
    player.pause();
  };

  return (
    <AudioContext.Provider value={{ playMusic, pauseMusic, player }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);