import React from 'react';
import { motion } from 'motion/react';
import { UniversalAppLogo } from './Logos';
import { useApp } from '../context/AppContext';
import { ArrowRight, UtensilsCrossed, Cloud } from 'lucide-react';
import { WHITE_LABEL_CONFIG } from '../config/whiteLabel.config';

export const SplashScreen: React.FC = () => {
  const { setCurrentScreen, setSelectedRestaurant, setRecipeRestaurant, isDatabaseConnected, connectedEmail, openDatabaseConnectModal } = useApp();

  const handleNext = () => {
    if (!isDatabaseConnected) {
      openDatabaseConnectModal();
    }
    setSelectedRestaurant('golodnyy_turist');
    setCurrentScreen('order');
  };

  const handleOpenRecipes = () => {
    setSelectedRestaurant('golodnyy_turist');
    setRecipeRestaurant('golodnyy_turist');
    setCurrentScreen('recipes');
  };

  const restaurantsListText = 'Ресторан «Голодный Турист»';

  return (
    <div className="min-h-screen bg-[#FAF7EE] flex flex-col items-center justify-between p-6 select-none relative overflow-hidden max-w-md mx-auto">
      {/* Background subtle paper ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF8] via-[#FAF7EE] to-[#F3ECD9] pointer-events-none" />

      {/* Top Header info */}
      <header className="w-full flex items-center justify-between pt-3 z-10 gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 bg-[#EFE8D6] px-3 py-1 rounded-full border border-[#E2D8C3]">
          <UtensilsCrossed className="w-3.5 h-3.5 text-stone-600" />
          <span>{WHITE_LABEL_CONFIG.appBrand.tagline}</span>
        </div>

        {/* Database Status Button */}
        {isDatabaseConnected ? (
          <button
            onClick={openDatabaseConnectModal}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EFE8D6] hover:bg-[#E5DCB8] text-stone-800 rounded-full border border-[#E2D8C3] text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
            title="Общая база подключена. Нажмите для смены аккаунта"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="max-w-[130px] truncate">{connectedEmail || 'База онлайн'}</span>
            <span className="text-[10px] text-stone-500 font-semibold underline">Сменить</span>
          </button>
        ) : (
          <button
            onClick={openDatabaseConnectModal}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-full border border-amber-300 text-[11px] font-black transition-all cursor-pointer shadow-2xs animate-pulse"
            title="Нажмите для подключения к общей базе"
          >
            <Cloud className="w-3.5 h-3.5 text-amber-700" />
            <span>Подключить базу</span>
          </button>
        )}
      </header>

      {/* Center: General Main Logo & Title */}
      <main className="flex-1 flex flex-col items-center justify-center text-center z-10 py-6 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Main Common Logo */}
          <div className="relative mb-5">
            <UniversalAppLogo 
              customUrl={WHITE_LABEL_CONFIG.appBrand.customMainLogoUrl} 
              className="w-64 h-64 sm:w-72 sm:h-72 filter drop-shadow-xl" 
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="space-y-1.5"
          >
            <h1 className="text-2xl sm:text-3xl font-black text-[#2A1E17] tracking-tight">
              {WHITE_LABEL_CONFIG.appBrand.name}
            </h1>
            <p className="text-sm font-semibold text-stone-600">
              {WHITE_LABEL_CONFIG.appBrand.subtitle}
            </p>
            <p className="text-xs text-stone-600 max-w-[280px] mx-auto pt-1 leading-relaxed">
              {WHITE_LABEL_CONFIG.appBrand.description}
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Bottom Action: "Далее" and "📋 Техкарты" Buttons */}
      <footer className="w-full flex flex-col items-center gap-2.5 pb-4 z-10">
        <motion.button
          id="btn-next-to-restaurants"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="w-full py-3.5 px-6 bg-[#2A1E17] hover:bg-[#3E2C22] active:bg-[#201610] text-[#FFFDF8] rounded-2xl font-black text-base shadow-lg shadow-stone-900/15 flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-[#3E2C22]"
        >
          <span>Заявки на продукты</span>
          <ArrowRight className="w-5 h-5 text-amber-300" />
        </motion.button>

        <motion.button
          id="btn-open-recipes"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenRecipes}
          className="w-full py-3 px-6 bg-[#FFFDF8] hover:bg-[#FAF5E6] active:bg-[#F3EBD4] text-[#2A1E17] rounded-2xl font-black text-sm shadow-md border-2 border-[#D9C4A0] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span className="text-base">📋</span>
          <span>Техкарты</span>
        </motion.button>

        <p className="text-[11px] font-medium text-stone-600 text-center pt-0.5">
          {restaurantsListText}
        </p>
      </footer>
    </div>
  );
};
