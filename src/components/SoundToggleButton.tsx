import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../utils/audio';

export const SoundToggleButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [enabled, setEnabled] = useState(() => soundManager.getSoundEnabled());

  useEffect(() => {
    // Keep local component state in sync
    setEnabled(soundManager.getSoundEnabled());
  }, []);

  const handleToggle = () => {
    const next = soundManager.toggleSound();
    setEnabled(next);
  };

  return (
    <button
      id="btn-toggle-sound"
      type="button"
      onClick={handleToggle}
      className={`p-2 rounded-full border transition-all cursor-pointer shadow-xs active:scale-95 ${
        enabled
          ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
          : 'bg-stone-100 border-stone-300 text-stone-400 hover:bg-stone-200'
      } ${className}`}
      title={enabled ? 'Звуки включены (нажмите для выключения)' : 'Звуки выключены (нажмите для включения)'}
      aria-label="Переключить звуковые эффекты"
    >
      {enabled ? (
        <Volume2 className="w-4 h-4 text-amber-800" />
      ) : (
        <VolumeX className="w-4 h-4 text-stone-500" />
      )}
    </button>
  );
};
