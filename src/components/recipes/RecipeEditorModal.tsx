import React, { useState, useEffect, useRef } from 'react';
import { Recipe, RecipeCategory, RecipeIngredient, RestaurantId } from '../../types';
import { RECIPE_CATEGORIES, getCanonicalRestaurantId } from '../../data/initialRecipes';
import { COMMON_UNITS } from '../../data/initialData';
import { 
  X, 
  Plus, 
  Trash2, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Check, 
  ChefHat, 
  Scale, 
  Clock, 
  Sparkles, 
  AlertTriangle,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { playTapSound, playSuccessSound, playErrorSound } from '../../utils/audio';
import { compressImageFile } from '../../utils/imageCompressor';

interface RecipeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipeData: Partial<Recipe>, changeNote?: string) => void;
  initialRecipe?: Recipe | null;
  defaultRestaurantId?: RestaurantId;
}

const SAMPLE_PHOTO_PRESETS = [
  { label: '🥘 Чахохбили', url: '/assets/chahohbili.jpg' },
  { label: '🍆 Рулетики из баклажана', url: '/assets/ruletiki_baklazhan.jpg' },
  { label: '🥧 Хачапури по-аджарски', url: '/assets/khachapuri.jpg' },
  { label: '🥬 Долма с говядиной', url: '/assets/dolma.jpg' },
  { label: '🥟 Хинкали кавказские', url: '/assets/hinkali.jpg' },
  { label: '🥔 Драники со сметаной', url: '/assets/draniki_minsk.jpg' },
  { label: '🥟 Пельмени классические', url: '/assets/pelmeni_classic.jpg' },
  { label: '🥟 Пельмени жареные', url: '/assets/zharenye_pelmeni.jpg' },
  { label: '🥩 Гуляш с гречкой', url: '/assets/gulyash_grechka.jpg' },
  { label: '🥔 Пюре с котлетами', url: '/assets/pure_kotlety.jpg' },
  { label: '🥣 Холодник свекольный', url: '/assets/holodnik_soup.jpg' },
  { label: '🥞 Блинчики с творогом', url: '/assets/blinchiki_tvorog.jpg' },
  { label: '🥗 Оливье праздничный', url: '/assets/olivie_salad.jpg' },
  { label: '🥗 Сельдь под шубой', url: '/assets/shuba_salad.jpg' },
  { label: '🍤 Креветки темпура', url: '/assets/krevetki_tempura.jpg' },
];

export const RecipeEditorModal: React.FC<RecipeEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecipe,
  defaultRestaurantId,
}) => {
  const isEditing = Boolean(initialRecipe);

  const [restaurantId, setRestaurantId] = useState<RestaurantId>(
    initialRecipe ? getCanonicalRestaurantId(initialRecipe) : (defaultRestaurantId || 'golodnyy_turist')
  );
  const [category, setCategory] = useState<RecipeCategory>('mains');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mainPhoto, setMainPhoto] = useState('');
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [yieldWeight, setYieldWeight] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [technology, setTechnology] = useState('');
  const [plating, setPlating] = useState('');
  const [importantNotes, setImportantNotes] = useState('');
  const [chefTip, setChefTip] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [formError, setFormError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialRecipe) {
      setRestaurantId(getCanonicalRestaurantId(initialRecipe));
      setCategory(initialRecipe.category || 'mains');
      setTitle(initialRecipe.title || '');
      setDescription(initialRecipe.description || '');
      setMainPhoto(initialRecipe.mainPhoto || '');
      setExtraPhotos(initialRecipe.extraPhotos || []);
      setIngredients(
        initialRecipe.ingredients && initialRecipe.ingredients.length > 0
          ? initialRecipe.ingredients
          : [{ id: `ing-${Date.now()}`, name: '', quantity: '', unit: 'г' }]
      );
      setYieldWeight(initialRecipe.yieldWeight || '');
      setPrepTime(initialRecipe.prepTime || '');
      setTechnology(initialRecipe.technology || '');
      setPlating(initialRecipe.plating || '');
      setImportantNotes(initialRecipe.importantNotes || '');
      setChefTip(initialRecipe.chefTip || '');
      setChangeNote('');
      setFormError('');
    } else {
      setRestaurantId('golodnyy_turist');
      setCategory('mains');
      setTitle('');
      setDescription('');
      setMainPhoto(SAMPLE_PHOTO_PRESETS[0].url);
      setExtraPhotos([]);
      setIngredients([
        { id: `ing-1`, name: '', quantity: '', unit: 'г' },
        { id: `ing-2`, name: '', quantity: '', unit: 'г' },
        { id: `ing-3`, name: '', quantity: '', unit: 'г' },
      ]);
      setYieldWeight('300 г');
      setPrepTime('30 минут');
      setTechnology('');
      setPlating('');
      setImportantNotes('');
      setChefTip('');
      setChangeNote('');
      setFormError('');
    }
  }, [initialRecipe, isOpen, defaultRestaurantId]);

  if (!isOpen) return null;

  const handleAddIngredientRow = () => {
    playTapSound();
    setIngredients(prev => [
      ...prev,
      { id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: '', quantity: '', unit: 'г' }
    ]);
  };

  const handleIngredientChange = (id: string, field: keyof RecipeIngredient, val: any) => {
    setIngredients(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: val };
    }));
  };

  const handleRemoveIngredient = (id: string) => {
    playTapSound();
    setIngredients(prev => prev.filter(item => item.id !== id));
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      setIsCompressing(true);
      const compressed = await compressImageFile(file, 1200, 0.82);
      setMainPhoto(compressed);
    } catch (e) {
      console.error('Error processing photo:', e);
      setFormError('Не удалось обработать фотографию.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleExtraPhotoUpload = async (file: File) => {
    try {
      setIsCompressing(true);
      const compressed = await compressImageFile(file, 1200, 0.82);
      setExtraPhotos(prev => [...prev, compressed]);
    } catch (e) {
      console.error('Error processing extra photo:', e);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveExtraPhoto = (idx: number) => {
    playTapSound();
    setExtraPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      playErrorSound();
      setFormError('Пожалуйста, укажите название блюда');
      return;
    }

    const validIngredients = ingredients.filter(i => i.name.trim().length > 0);
    if (validIngredients.length === 0) {
      playErrorSound();
      setFormError('Добавьте хотя бы один ингредиент в рецептуру');
      return;
    }

    const payload: Partial<Recipe> = {
      title: title.trim(),
      restaurantId,
      category,
      description: description.trim(),
      mainPhoto: mainPhoto.trim(),
      extraPhotos,
      ingredients: validIngredients,
      yieldWeight: yieldWeight.trim() || '300 г',
      prepTime: prepTime.trim() || '30 минут',
      technology: technology.trim() || 'Приготовление согласно стандартам предприятия.',
      plating: plating.trim() || 'Подача на сервировочном блюде согласно эталонному фото.',
      importantNotes: importantNotes.trim(),
      chefTip: chefTip.trim(),
      published: true,
    };

    playSuccessSound();
    onSave(payload, changeNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl bg-[#FFFDF8] rounded-3xl border border-[#E2D8C3] shadow-2xl max-h-[94vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-[#FFFDF8] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-600 text-white shadow-sm">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full">
                  Шеф-повар / Редактор техкарт
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Синхронизация с телефонами
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#2A1E17] leading-tight mt-0.5">
                {isEditing ? `Редактирование: ${initialRecipe?.title}` : 'Создание технологической карты'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Restaurant badge */}
          <div>
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
              Ресторан
            </label>
            <div className="flex items-center gap-2.5 p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-xl">🧭</span>
              <div>
                <span className="font-black text-xs text-amber-950 block">Ресторан «Голодный Турист»</span>
                <span className="text-[11px] text-stone-600">Техкарта добавляется в общее меню заведения</span>
              </div>
            </div>
          </div>

          {/* Category selection chips */}
          <div>
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
              Категория блюда *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {RECIPE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { playTapSound(); setCategory(cat.id); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-amber-600 text-white shadow-xs font-black'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dish Name */}
          <div>
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1">
              Название блюда *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Чахохбили по-домашнему"
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1">
              Краткое описание блюда
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткая характеристика вкуса, аромата, используемого мяса или овощей..."
              className="w-full px-3.5 py-2 bg-white rounded-xl border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
          </div>

          {/* Photo Management Section */}
          <div className="space-y-3 bg-[#FAF6EC] p-4 rounded-2xl border border-[#E5DCBE]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-700" />
                <span>Фотография готового блюда (раскладка)</span>
              </label>
              {isCompressing && (
                <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Сжатие фото...</span>
                </span>
              )}
            </div>

            {/* Photo Preview & Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {mainPhoto ? (
                <div className="relative w-28 h-24 rounded-2xl overflow-hidden border-2 border-amber-500 shrink-0 bg-stone-100 shadow-sm group">
                  <img
                    src={mainPhoto}
                    alt={title || 'Фото блюда'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => { playTapSound(); setMainPhoto(''); }}
                    className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md cursor-pointer transition-colors"
                    title="Удалить фото"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-28 h-24 rounded-2xl border-2 border-dashed border-stone-300 shrink-0 bg-stone-50 flex flex-col items-center justify-center text-stone-400 p-2 text-center">
                  <ImageIcon className="w-6 h-6 mb-1 text-stone-300" />
                  <span className="text-[10px] font-bold">Нет фото</span>
                </div>
              )}

              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{mainPhoto ? 'Заменить фото' : 'Сделать фото / Загрузить'}</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                      e.target.value = '';
                    }}
                  />

                  {mainPhoto && (
                    <button
                      type="button"
                      onClick={() => setMainPhoto('')}
                      className="px-2.5 py-2 text-stone-500 hover:text-red-600 text-xs font-bold rounded-xl border border-stone-200 bg-white transition-colors"
                    >
                      Очистить
                    </button>
                  )}
                </div>

                {/* Direct URL input if needed */}
                <input
                  type="text"
                  value={mainPhoto}
                  onChange={(e) => setMainPhoto(e.target.value)}
                  placeholder="Или вставьте ссылку / путь к фото (/assets/...)"
                  className="w-full px-3 py-1.5 bg-white rounded-xl border border-stone-300 text-[11px] text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Quick Sample Photos */}
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                Быстрые фото-шаблоны из меню ресторана:
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {SAMPLE_PHOTO_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { playTapSound(); setMainPhoto(preset.url); }}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                      mainPhoto === preset.url
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Extra Photos Gallery */}
            <div className="pt-2 border-t border-[#E5DCBE]/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-stone-700 uppercase tracking-wider">
                  Дополнительные фото (этапы / подача):
                </span>
                <button
                  type="button"
                  onClick={() => extraFileInputRef.current?.click()}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100/90 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  + Добавить доп. фото
                </button>
                <input
                  ref={extraFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleExtraPhotoUpload(file);
                    e.target.value = '';
                  }}
                />
              </div>

              {extraPhotos.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {extraPhotos.map((photo, idx) => (
                    <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-stone-300 shrink-0 bg-stone-100 group">
                      <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraPhoto(idx)}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full cursor-pointer opacity-90 hover:opacity-100"
                        title="Удалить"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-stone-400 italic">Нет дополнительных фото</p>
              )}
            </div>
          </div>

          {/* Yield and Prep Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-amber-800" />
                <span>Выход порции *</span>
              </label>
              <input
                type="text"
                value={yieldWeight}
                onChange={(e) => setYieldWeight(e.target.value)}
                placeholder="Например: 320 г или 240/50 г"
                className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-800" />
                <span>Время приготовления</span>
              </label>
              <input
                type="text"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="Например: 25 минут"
                className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Dynamic Ingredients Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-stone-800 uppercase tracking-wider">
                Рецептура и сырье (Ингредиенты) *
              </label>
              <button
                type="button"
                onClick={handleAddIngredientRow}
                className="flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить ингредиент</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {ingredients.map((ing, idx) => (
                <div key={ing.id} className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[11px] font-mono text-stone-400 w-5 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => handleIngredientChange(ing.id, 'name', e.target.value)}
                    placeholder="Наименование продукта"
                    className="flex-1 px-2.5 py-1.5 bg-white rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500 min-w-0"
                  />
                  <input
                    type="text"
                    value={ing.quantity}
                    onChange={(e) => handleIngredientChange(ing.id, 'quantity', e.target.value)}
                    placeholder="Кол-во"
                    className="w-16 sm:w-20 px-2 py-1.5 bg-white rounded-xl border border-stone-300 text-xs font-bold text-center text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500 shrink-0"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => handleIngredientChange(ing.id, 'unit', e.target.value)}
                    className="w-16 sm:w-20 px-1.5 py-1.5 bg-white rounded-xl border border-stone-300 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shrink-0"
                  >
                    {COMMON_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(ing.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg shrink-0 cursor-pointer"
                      title="Удалить строку"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cooking Technology */}
          <div>
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1">
              Пошаговая технология приготовления *
            </label>
            <textarea
              rows={4}
              required
              value={technology}
              onChange={(e) => setTechnology(e.target.value)}
              placeholder="1. Первичная обработка сырья...&#10;2. Тепловая обработка...&#10;3. Доведение до вкуса..."
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-normal"
            />
          </div>

          {/* Plating / Presentation */}
          <div>
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1">
              Оформление и раскладка на тарелке *
            </label>
            <textarea
              rows={2}
              value={plating}
              onChange={(e) => setPlating(e.target.value)}
              placeholder="Правила сервировки, посуда подачи, декорирование зеленью/соусом..."
              className="w-full px-3.5 py-2 bg-white rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-normal"
            />
          </div>

          {/* Important Notes / Warnings */}
          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-1">
            <label className="block text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Особые правила / Контрольные точки</span>
            </label>
            <input
              type="text"
              value={importantNotes}
              onChange={(e) => setImportantNotes(e.target.value)}
              placeholder="Например: Сыр подавать исключительно горячим. Соблюдать температуру фритюра 180°C."
              className="w-full px-3 py-2 bg-white rounded-xl border border-amber-300 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600 font-medium"
            />
          </div>

          {/* Chef Tip */}
          <div className="p-3 bg-sky-50/80 rounded-2xl border border-sky-200/80 space-y-1">
            <label className="block text-xs font-black text-sky-900 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-700" />
              <span>Секрет или совет шеф-повара</span>
            </label>
            <input
              type="text"
              value={chefTip}
              onChange={(e) => setChefTip(e.target.value)}
              placeholder="Например: Свежий базилик добавлять вместе с кинзой строго перед снятием с огня."
              className="w-full px-3 py-2 bg-white rounded-xl border border-sky-300 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-sky-600 font-medium"
            />
          </div>

          {/* Change note for version history when editing */}
          {isEditing && (
            <div className="p-3 bg-stone-100 rounded-2xl border border-stone-200 space-y-1">
              <label className="block text-xs font-black text-stone-700 uppercase tracking-wider">
                Комментарий к изменению (сохраняется в историю версий)
              </label>
              <input
                type="text"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Что изменили? (например: обновлена раскладка по фото, скорректирован вес мяса)"
                className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-600"
              />
            </div>
          )}

          {/* Footer Submit Bar */}
          <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-stone-500">
              ⚡ Изменения сохраняются в облаке и сразу обновятся на всех телефонах
            </p>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Отмена
              </button>

              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isEditing ? 'Сохранить изменения' : 'Создать техкарту'}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
