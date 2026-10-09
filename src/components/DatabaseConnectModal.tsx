import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Cloud, Mail, Zap, Check, X, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DatabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  restaurantName?: string;
  indicator?: string;
  brandColor?: string;
}

export const DatabaseConnectModal: React.FC<DatabaseConnectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  restaurantName,
  indicator,
  brandColor,
}) => {
  const { 
    loginWithGoogle, 
    connectWithEmail, 
    disconnectDatabase,
    isDatabaseConnected, 
    connectedEmail,
    selectedRestaurant,
  } = useApp();
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const activeName = restaurantName || 'Голодный Турист';
  const activeIndicator = indicator || '🧭';
  const activeColor = brandColor || '#D97706';

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailInput.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setErrorMessage('Пожалуйста, укажите корректный email (например, ivan@gmail.com)');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    try {
      await connectWithEmail(clean);
      setIsLoading(false);
      if (onSuccess) onSuccess();
      else onClose();
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Не удалось подключиться к базе';
      setErrorMessage(msg);
    }
  };

  const handleGoogleClick = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
      setIsLoading(false);
      if (onSuccess) onSuccess();
      else onClose();
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Не удалось войти через Google';
      setErrorMessage(msg);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await disconnectDatabase();
      setEmailInput('');
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#FFFDF8] rounded-3xl border-2 border-[#E2D8C3] max-w-sm w-full shadow-2xl p-5 sm:p-6 space-y-4 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div 
            style={{ backgroundColor: `${activeColor}15`, color: activeColor }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 border border-stone-200"
          >
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#2A1E17] leading-tight">
              Общая база данных
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-stone-600">
                {activeIndicator} Ресторан «{activeName}»
              </span>
            </div>
          </div>
        </div>

        {/* Current status if connected */}
        {isDatabaseConnected && connectedEmail ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2 text-xs text-emerald-950 animate-in fade-in">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Подключен аккаунт</div>
                <div className="font-extrabold truncate text-emerald-900">{connectedEmail}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-2.5 py-1.5 bg-white hover:bg-red-50 border border-emerald-300 hover:border-red-300 text-stone-700 hover:text-red-700 rounded-xl font-bold text-[11px] shrink-0 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              Сменить / Выйти
            </button>
          </div>
        ) : (
          <p className="text-xs text-stone-600 leading-relaxed">
            Чтобы этот телефон синхронизировал заявки и историю с закупщиком и ресторанами, введите свой Google email или войдите через Google:
          </p>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Option 1: One-Click Google Login */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-stone-50 border-2 border-stone-200 hover:border-stone-300 rounded-2xl font-black text-xs text-stone-800 shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Войти через Google в 1 клик</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="shrink-0 mx-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
            или введите Google email
          </span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        {/* Option 2: Email Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div>
            <div className="relative">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="например, ivan@gmail.com"
                disabled={isLoading}
                className="w-full pl-9 pr-3.5 py-3 bg-white rounded-xl border-2 border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-400/20 font-bold text-stone-900 text-xs sm:text-sm placeholder:font-normal placeholder:text-stone-400 focus:outline-none transition-all disabled:opacity-50"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
            <p className="text-[11px] text-stone-500 mt-1.5 flex items-center gap-1 leading-tight">
              <span>✨</span>
              <span>Письма не отправляются, пароль не нужен. Доступ активируется сразу.</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="py-3 px-3 rounded-xl border border-stone-300 bg-white text-stone-700 font-bold text-xs hover:bg-stone-50 active:scale-95 transition-all cursor-pointer text-center disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading || !emailInput.trim()}
              style={{ backgroundColor: activeColor }}
              className="py-3 px-3 rounded-xl text-white font-black text-xs shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {isLoading ? (
                <span>Подключение...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Готово</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
