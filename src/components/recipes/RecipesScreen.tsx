import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Recipe, RecipeCategory } from '../../types';
import { RECIPE_CATEGORIES } from '../../data/initialRecipes';
import { RecipeDetailModal } from './RecipeDetailModal';
import { RecipeEditorModal } from './RecipeEditorModal';
import { RecipeHistoryModal } from './RecipeHistoryModal';
import { PinAuthModal } from '../PinAuthModal';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Clock, 
  Scale, 
  ChevronRight, 
  ArrowLeft,
  X,
  Lock,
  ShieldCheck,
  LogOut,
  Maximize2,
  Edit3
} from 'lucide-react';
import { motion } from 'motion/react';
import { playTapSound } from '../../utils/audio';
import { SoundToggleButton } from '../SoundToggleButton';

export const RecipesScreen: React.FC = () => {
  const {
    setCurrentScreen,
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    isRecipesAdmin,
    authenticateRole,
    logoutRole,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'all'>('all');

  // Modal states
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [historyRecipe, setHistoryRecipe] = useState<Recipe | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pinActionDescription, setPinActionDescription] = useState('');

  // All recipes for Golodnyy Turist (unified collection)
  const currentRestaurantRecipes = recipes;

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return currentRestaurantRecipes.filter(r => {
      if (selectedCategory !== 'all' && r.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesDesc = (r.description || '').toLowerCase().includes(q);
        const matchesIng = (r.ingredients || []).some(i => i.name.toLowerCase().includes(q));
        return matchesTitle || matchesDesc || matchesIng;
      }
      return true;
    });
  }, [currentRestaurantRecipes, selectedCategory, searchQuery]);

  const [saveToast, setSaveToast] = useState<string | null>(null);

  const handleAddNewRecipe = () => {
    playTapSound();
    setEditingRecipe(null);
    setIsEditorOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    playTapSound();
    setEditingRecipe(recipe);
    setIsEditorOpen(true);
    setViewingRecipe(null);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    setPendingAction(() => () => {
      deleteRecipe(recipeId);
    });
    setPinActionDescription('Для удаления технологической карты требуется пароль администратора (060926).');
    setIsPinModalOpen(true);
  };

  const handleSaveRecipe = (recipeData: Partial<Recipe>, changeNote?: string) => {
    const dishTitle = recipeData.title || (editingRecipe ? editingRecipe.title : 'Блюдо');
    if (editingRecipe) {
      const saved = updateRecipe(
        editingRecipe.id,
        {
          ...recipeData,
          restaurantId: 'golodnyy_turist',
        },
        changeNote
      );
      setSaveToast(`Техкарта «${dishTitle}» сохранена и обновлена!`);
      if (saved && viewingRecipe && viewingRecipe.id === editingRecipe.id) {
        setViewingRecipe(saved);
      }
    } else {
      addRecipe({
        ...recipeData,
        restaurantId: 'golodnyy_turist',
      } as any);
      setSaveToast(`Новая техкарта «${dishTitle}» создана и синхронизирована!`);
    }
    setTimeout(() => {
      setSaveToast(null);
    }, 4000);
    setIsEditorOpen(false);
    setEditingRecipe(null);
  };

  return (
    <div className="w-full min-h-full flex-1 flex flex-col justify-between pb-24 select-none">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[#FAF7EE]/95 backdrop-blur-md border-b border-[#E2D8C3] shadow-xs">
        <div className="w-full px-3 py-2.5 flex items-center justify-between gap-2">
          {/* Back to Home Screen */}
          <button
            onClick={() => {
              playTapSound();
              setCurrentScreen('splash');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-xs hover:bg-stone-50 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Вернуться на главную"
          >
            <ArrowLeft className="w-4 h-4 text-stone-500" />
            <span className="hidden sm:inline">Главная</span>
            <span className="sm:hidden">Назад</span>
          </button>

          {/* Center Brand Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950">
            <span className="text-base">🧭</span>
            <span className="text-xs sm:text-sm font-black tracking-tight">
              Голодный Турист • {recipes.length} техкарт
            </span>
          </div>

          {/* Admin & Sound tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            <SoundToggleButton />

            {isRecipesAdmin ? (
              <button
                onClick={() => {
                  playTapSound();
                  logoutRole('recipes');
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-full border border-amber-300 transition-all cursor-pointer"
                title="Режим шеф-повара активен. Нажмите для выхода"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Шеф-повар</span>
                <LogOut className="w-3 h-3 text-amber-700" />
              </button>
            ) : (
              <button
                onClick={() => {
                  playTapSound();
                  setPendingAction(null);
                  setPinActionDescription('Для входа в режим редактирования техкарт введите пароль (060926).');
                  setIsPinModalOpen(true);
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 px-2.5 py-1.5 rounded-full border border-stone-200 shadow-xs transition-all cursor-pointer"
                title="Войти как шеф-повар / редактор"
              >
                <Lock className="w-3 h-3 text-stone-400" />
                <span className="hidden sm:inline">Редактор</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-3xl mx-auto px-3.5 sm:px-6 pt-3 flex-1 flex flex-col">
        {/* Banner with Restaurant Name & Add Button */}
        <div className="bg-[#FFFDF8] rounded-3xl border-2 border-[#D9C4A0] shadow-sm p-4 sm:p-5 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-2xl shadow-xs shrink-0 overflow-hidden">
                <img 
                  src="/Logo_Golodnyy_Turist.png" 
                  alt="Голодный Турист" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-[#2A1E17] tracking-tight leading-tight">
                  Ресторан «Голодный Турист»
                </h1>
                <p className="text-[11px] sm:text-xs text-stone-600 font-medium">
                  Технологические карты блюд, раскладка и эталоны подачи
                </p>
              </div>
            </div>

            {isRecipesAdmin && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAddNewRecipe}
                className="px-3 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-amber-200" />
                <span className="hidden sm:inline">Новая техкарта</span>
                <span className="sm:hidden">Создать</span>
              </motion.button>
            )}
          </div>

          {/* Search bar */}
          <div className="mt-3 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск блюд ресторана «Голодный Турист»..."
              className="w-full pl-9 pr-8 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs sm:text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips Bar */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                playTapSound();
                setSelectedCategory('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#2A1E17] text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
            >
              Все ({currentRestaurantRecipes.length})
            </button>
            {RECIPE_CATEGORIES.map(cat => {
              const count = currentRestaurantRecipes.filter(r => r.category === cat.id).length;
              if (count === 0 && selectedCategory !== cat.id) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    playTapSound();
                    setSelectedCategory(cat.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-800 text-white shadow-xs font-extrabold'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="opacity-75 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recipes Grid */}
        <div className="flex-1">
          {filteredRecipes.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#E2D8C3] text-stone-500 my-4 space-y-2">
              <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-700">Блюд не найдено</p>
              <p className="text-xs text-stone-500">
                Попробуйте изменить поисковый запрос или выбрать другую категорию
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredRecipes.map((recipe) => {
                const catMeta = RECIPE_CATEGORIES.find(c => c.id === recipe.category);
                const hasPhoto = Boolean(recipe.mainPhoto && !imageErrors[recipe.id]);

                return (
                  <motion.div
                    key={recipe.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      playTapSound();
                      setViewingRecipe(recipe);
                    }}
                    className="group bg-[#FFFDF8] rounded-3xl border border-[#E2D8C3] shadow-xs hover:shadow-md p-3.5 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Dish Photo / Banner */}
                      <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-[#FAF6ED] border border-[#E2D8C3] mb-2.5">
                        {hasPhoto ? (
                          <img
                            src={recipe.mainPhoto}
                            alt={recipe.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                            onError={() => {
                              setImageErrors(prev => ({ ...prev, [recipe.id]: true }));
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FAF5EB] via-[#F4EDE0] to-[#EBE2CF] p-3 text-center select-none">
                            <span className="text-3xl mb-1 drop-shadow-xs">{catMeta?.icon || '🍽️'}</span>
                            <span className="text-xs font-black text-stone-800 tracking-tight line-clamp-1">{recipe.title}</span>
                            <span className="text-[10px] font-bold text-amber-900/80 mt-0.5">
                              Голодный Турист • Техкарта
                            </span>
                          </div>
                        )}

                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="bg-white/95 backdrop-blur-xs text-stone-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                            {catMeta?.icon} {catMeta?.label}
                          </span>
                        </div>

                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          {hasPhoto && (
                            <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <Maximize2 className="w-3 h-3 text-amber-400" />
                            </span>
                          )}
                          <span className="bg-white/90 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                            v{recipe.currentVersion}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-black text-sm sm:text-base text-[#2A1E17] group-hover:text-amber-800 transition-colors line-clamp-1">
                            {recipe.title}
                          </h3>
                        </div>

                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {recipe.description || 'Классическая рецептура и пошаговая технология приготовления блюда.'}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="mt-3 pt-2.5 border-t border-stone-200/70 flex items-center justify-between text-[11px] text-stone-600">
                      <div className="flex items-center gap-2.5">
                        {recipe.yieldWeight && (
                          <span className="flex items-center gap-1 font-semibold text-stone-700">
                            <Scale className="w-3 h-3 text-stone-400" />
                            <span>{recipe.yieldWeight}</span>
                          </span>
                        )}
                        {recipe.prepTime && (
                          <span className="flex items-center gap-1 font-semibold text-stone-700">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>{recipe.prepTime}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-amber-800 font-bold group-hover:translate-x-0.5 transition-transform">
                        <span>Смотреть</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Save Success Toast */}
      {saveToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#2A1E17] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-amber-500/30">
          <span className="text-amber-300">✓</span>
          <span>{saveToast}</span>
        </div>
      )}

      {/* Detail / Visualizer Modal */}
      <RecipeDetailModal
        isOpen={Boolean(viewingRecipe)}
        recipe={viewingRecipe}
        onClose={() => setViewingRecipe(null)}
        isRecipesAdmin={isRecipesAdmin}
        onRequestAdmin={() => {
          setPendingAction(null);
          setPinActionDescription('Для редактирования техкарт введите PIN-код администратора.');
          setIsPinModalOpen(true);
        }}
        onEdit={handleEditRecipe}
        onUpdateRecipe={(id, updates, changeNote) => {
          const saved = updateRecipe(id, updates, changeNote);
          setViewingRecipe(prev => prev && prev.id === id ? (saved || { ...prev, ...updates }) : prev);
        }}
        onDelete={handleDeleteRecipe}
        onViewHistory={(r) => setHistoryRecipe(r)}
      />

      {/* Editor Modal */}
      <RecipeEditorModal
        isOpen={isEditorOpen}
        initialRecipe={editingRecipe}
        defaultRestaurantId="golodnyy_turist"
        onClose={() => {
          setIsEditorOpen(false);
          setEditingRecipe(null);
        }}
        onSave={handleSaveRecipe}
      />

      {/* History Modal */}
      <RecipeHistoryModal
        isOpen={Boolean(historyRecipe)}
        recipe={historyRecipe}
        onClose={() => setHistoryRecipe(null)}
      />

      {/* PIN Authentication Modal */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingAction(null);
        }}
        targetRole="recipes"
        actionDescription={pinActionDescription}
        onSuccess={() => {
          authenticateRole('060926', 'recipes');
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
      />
    </div>
  );
};
