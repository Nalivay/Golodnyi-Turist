import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Keyboard, X, Sparkles, Check } from 'lucide-react';
import { playTapSound } from '../utils/audio';

interface OrderModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'voice' | 'manual') => void;
  restaurantName?: string;
  indicator?: string;
}

export const OrderModeModal: React.FC<OrderModeModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  restaurantName,
  indicator,
}) => {
  if (!isOpen) return null;

  const handleSelect = (mode: 'voice' | 'manual') => {
    playTapSound();
    onSelectMode(mode);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="bg-[#FFFDF8] rounded-3xl border-2 border-[#E2D8C3] max-w-sm w-full shadow-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center pt-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full inline-flex items-center gap-1 mb-2">
              <Sparkles className="w-3 h-3 text-amber-700" />
              <span>Создание заявки</span>
              {indicator && <span>{indicator}</span>}
            </span>
            <h3 className="text-xl font-black text-[#2A1E17] tracking-tight">
              Выберите способ ввода
            </h3>
            <p className="text-xs text-stone-600 mt-1 max-w-[280px] mx-auto">
              {restaurantName ? `Для ${restaurantName}. ` : ''}
              Как вам удобнее составить список продуктов?
            </p>
          </div>

          {/* Mode Options */}
          <div className="space-y-2.5 pt-1">
            {/* 1. Voice Mode */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect('voice')}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white shadow-md flex items-center gap-3.5 text-left transition-all cursor-pointer border border-red-500/30 group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                <Mic className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm tracking-tight flex items-center gap-1.5">
                    🎤 Голосовой ввод
                  </span>
                  <span className="text-[10px] font-bold bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Рекомендуем
                  </span>
                </div>
                <p className="text-[11px] text-white/90 mt-0.5 leading-snug">
                  Диктуйте: «Помидоры полкило», «Картошки 5 кг». ИИ поймёт речь и подтвердит голосом.
                </p>
              </div>
            </motion.button>

            {/* 2. Manual Mode */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect('manual')}
              className="w-full p-4 rounded-2xl bg-white hover:bg-stone-50 border-2 border-stone-200 hover:border-stone-300 text-stone-800 shadow-2xs flex items-center gap-3.5 text-left transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 text-stone-700 group-hover:scale-105 transition-transform">
                <Keyboard className="w-6 h-6 text-stone-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm tracking-tight text-stone-900">
                  ⌨️ Только ручной ввод
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  Классический ввод: поиск по каталогу, кнопки плюс/минус и клавиатура.
                </p>
              </div>
            </motion.button>
          </div>

          <p className="text-[11px] text-center text-stone-500 font-medium pt-1">
            💡 Вы сможете говорить или добавлять товары руками в любой момент
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
