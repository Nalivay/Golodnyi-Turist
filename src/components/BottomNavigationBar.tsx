import React from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingCart, UtensilsCrossed, History, BookOpen } from 'lucide-react';
import { playTapSound } from '../utils/audio';

export const BottomNavigationBar: React.FC = () => {
  const { 
    currentScreen, 
    setCurrentScreen, 
    activeRestaurantsCountToday, 
    selectedRestaurant,
    setSelectedRestaurant,
    setRecipeRestaurant,
  } = useApp();

  // Badge numeral: ①, ②
  const getBadgeNumeral = (count: number) => {
    if (count === 1) return '①';
    if (count === 2) return '②';
    return '';
  };

  const badgeStr = getBadgeNumeral(activeRestaurantsCountToday);
  const hasActiveOrders = activeRestaurantsCountToday > 0;

  const handleGoOrder = () => {
    playTapSound();
    setSelectedRestaurant('golodnyy_turist');
    setCurrentScreen('order');
  };

  const handleGoFulfill = () => {
    playTapSound();
    setCurrentScreen('fulfill');
  };

  const handleGoRecipes = () => {
    playTapSound();
    setSelectedRestaurant('golodnyy_turist');
    setRecipeRestaurant('golodnyy_turist');
    setCurrentScreen('recipes');
  };

  const handleGoHistory = () => {
    playTapSound();
    setCurrentScreen('history');
  };

  return (
    <nav 
      aria-label="Нижняя навигация" 
      className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none px-2 sm:px-4 pb-2"
    >
      <div className="w-full max-w-xl bg-[#FFFDF8]/95 backdrop-blur-md border border-[#E2D8C3] shadow-2xl rounded-2xl sm:rounded-3xl p-1.5 flex items-center justify-between gap-1 pointer-events-auto">
        {/* Tab 1: Создание заказа / Рестораны */}
        <button
          id="nav-btn-order"
          onClick={handleGoOrder}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer select-none ${
            currentScreen === 'choice' || currentScreen === 'order' || currentScreen === 'paper_view'
              ? 'bg-[#2A1E17] text-[#FAF7EE] shadow-sm font-bold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 font-semibold'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs leading-none">
            Заявка
          </span>
        </button>

        {/* Tab 2: 🛒 Выполнить заказ (Центральная кнопка для закупщика) */}
        <button
          id="nav-btn-fulfill"
          onClick={handleGoFulfill}
          className={`flex-[1.2] flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl sm:rounded-2xl transition-all cursor-pointer select-none text-center ${
            currentScreen === 'fulfill'
              ? 'bg-[#15803D] text-white shadow-md font-extrabold ring-2 ring-[#15803D]/30'
              : hasActiveOrders
              ? 'bg-[#1E7238] hover:bg-[#15803D] text-white shadow-md active:scale-98 font-black'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 font-semibold'
          }`}
          title={
            hasActiveOrders
              ? `Актуальные заказы на сегодня (${activeRestaurantsCountToday})`
              : 'Закупка на сегодня'
          }
        >
          <ShoppingCart className={`w-4 h-4 ${hasActiveOrders ? 'text-amber-300' : 'text-stone-600'}`} />
          <div className="flex items-center gap-0.5 leading-none">
            <span className="text-[10px] sm:text-xs tracking-tight font-bold">
              Закупка
            </span>
            {badgeStr && (
              <span className="text-xs sm:text-sm font-black text-amber-300 leading-none ml-0.5">
                {badgeStr}
              </span>
            )}
          </div>
        </button>

        {/* Tab 3: 📋 Техкарты */}
        <button
          id="nav-btn-recipes"
          onClick={handleGoRecipes}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer select-none ${
            currentScreen === 'recipes' || currentScreen === 'recipe_detail'
              ? 'bg-amber-800 text-white shadow-sm font-bold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 font-semibold'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs leading-none">Техкарты</span>
        </button>

        {/* Tab 4: История */}
        <button
          id="nav-btn-history"
          onClick={handleGoHistory}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer select-none ${
            currentScreen === 'history'
              ? 'bg-[#2A1E17] text-[#FAF7EE] shadow-sm font-bold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 font-semibold'
          }`}
        >
          <History className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs leading-none">История</span>
        </button>
      </div>
    </nav>
  );
};
