import { useCallback, useEffect, useRef, useState } from 'react';

const AUDIO_SRC = '/audio/ambient.mp3';
const STORAGE_KEY = 'gn:ambientAudioEnabled';

export function useAmbientAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = 'none';
    audio.addEventListener('error', () => setAvailable(false));
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    localStorage.setItem(STORAGE_KEY, String(enabled));

    if (enabled) {
      audio.play().catch(() => setEnabled(false));
    } else {
      audio.pause();
    }
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);

  return { enabled, toggle, available };
}
