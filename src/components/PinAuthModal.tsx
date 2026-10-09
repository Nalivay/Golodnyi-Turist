import React, { useState, useEffect } from 'react';
import { X, Lock, KeyRound, AlertCircle, CheckCircle2, ShieldCheck, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { playTapSound, playSuccessSound, playErrorSound } from '../utils/audio';

export type AuthTargetRole = 'recipes' | 'orders' | 'owner';

interface PinAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: AuthTargetRole;
  onSuccess: () => void;
  actionDescription?: string;
}

export const PinAuthModal: React.FC<PinAuthModalProps> = ({
  isOpen,
  onClose,
  targetRole,
  onSuccess,
  actionDescription,
}) => {
  const { authenticateRole } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const roleMeta = {
    recipes: {
      title: 'Редактирование техкарт',
      subtitle: 'Требуется пароль администратора техкарт',
      badge: 'Администратор техкарт',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      expectedPins: ['060926', '8899', 'owner2026', 'owner'],
      inputPlaceholder: 'Введите пароль или PIN (060926)',
    },
    orders: {
      title: 'Отправка заказов',
      subtitle: 'Требуется пароль ответственного за заказы',
      badge: 'Ответственный за заказы',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      expectedPins: ['260906', '8899', 'owner2026', 'owner'],
      inputPlaceholder: 'Введите пароль или PIN (260906)',
    },
    owner: {
      title: 'Доступ владельца приложения',
      subtitle: 'Конфиденциальные настройки каналов отправки',
      badge: 'Владелец системы',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      expectedPins: ['8899', 'owner2026', 'owner'],
      inputPlaceholder: 'Введите пароль или PIN владельца',
    },
  }[targetRole];

  const handleDigitClick = (digit: string) => {
    playTapSound();
    if (pin.length < 12) {
      setError('');
      setPin(prev => prev + digit);
    }
  };

  const handleDeleteDigit = () => {
    playTapSound();
    setError('');
    setPin(prev => prev.slice(0, -1));
  };

  const handleVerify = (pinToTest?: string) => {
    const value = (pinToTest !== undefined ? pinToTest : pin).trim();
    if (!value) {
      playErrorSound();
      setError('Пожалуйста, введите пароль или код доступа');
      return;
    }

    setIsSubmitting(true);

    // Verify against secret expected values
    const isValid = roleMeta.expectedPins.some(
      p => p.toLowerCase() === value.toLowerCase()
    );

    if (isValid) {
      playSuccessSound();
      setError('');
      // Authenticate role in app state and persist to localStorage on this device
      authenticateRole(value, targetRole);
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 200);
    } else {
      playErrorSound();
      setIsSubmitting(false);
      setError('Неверный код доступа. Попробуйте еще раз.');
      setPin('');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-sm bg-[#FFFDF8] rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#E2D8C3] flex flex-col overflow-hidden select-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border mb-1 ${roleMeta.badgeColor}`}>
                {roleMeta.badge}
              </span>
              <h3 className="text-base font-black text-stone-900 leading-tight">
                {roleMeta.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          <div className="bg-[#FAF6EC] border border-[#E5DCBE] rounded-2xl p-3 text-center space-y-1">
            <p className="text-xs text-stone-800 font-semibold leading-relaxed">
              {actionDescription || 'Для выполнения этого действия требуется подтверждение полномочий.'}
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-800 font-medium pt-1 border-t border-amber-200/60">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Защита от несанкционированного изменения персоналом кухни</span>
            </div>
          </div>

          {/* Masked PIN Display & Input */}
          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div className="relative">
              <input
                id="pin-auth-input"
                type="password"
                inputMode="numeric"
                autoFocus
                value={pin}
                onChange={(e) => {
                  setError('');
                  setPin(e.target.value);
                }}
                placeholder={roleMeta.inputPlaceholder}
                className="w-full text-center tracking-[0.35em] text-xl font-mono font-black py-3 px-4 bg-white rounded-2xl border-2 border-stone-300 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400/20 text-stone-900 shadow-inner"
              />
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 justify-center text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-200"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Visual Numeric Keypad for fast touch usage */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitClick(digit)}
                  className="py-3 bg-white hover:bg-stone-100 active:bg-amber-100 active:scale-95 text-stone-900 font-black text-lg rounded-2xl border border-stone-200 shadow-xs transition-all cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin('')}
                className="py-3 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-600 font-bold text-xs rounded-2xl transition-all cursor-pointer"
              >
                Очистить
              </button>
              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="py-3 bg-white hover:bg-stone-100 active:bg-amber-100 active:scale-95 text-stone-900 font-black text-lg rounded-2xl border border-stone-200 shadow-xs transition-all cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDeleteDigit}
                className="py-3 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-black text-sm rounded-2xl transition-all cursor-pointer"
              >
                ⌫
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-3 rounded-2xl border border-stone-300 text-stone-700 font-bold text-xs sm:text-sm hover:bg-stone-100 active:scale-98 transition-all"
              >
                Отмена
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !pin}
                className="flex-[1.5] py-3 px-4 rounded-2xl bg-[#2A1E17] hover:bg-stone-800 active:scale-98 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Подтвердить</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
