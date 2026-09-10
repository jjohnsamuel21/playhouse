import { useAmbientAudio } from '../hooks/useAmbientAudio';

export default function AmbientAudioToggle() {
  const { enabled, toggle, available } = useAmbientAudio();

  if (!available) return null;

  return (
    <button
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Mute ambient music' : 'Play ambient music'}
      className={`fixed bottom-6 right-6 z-20 w-11 h-11 rounded-full border border-white/10 bg-gray-900/70 backdrop-blur flex items-center justify-center text-lg transition-shadow ${
        enabled ? 'animate-glow-pulse shadow-glow shadow-neon-violet/50' : ''
      }`}
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  );
}
