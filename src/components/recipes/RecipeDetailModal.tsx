import React, { useState, useRef } from 'react';
import { Recipe } from '../../types';
import { RECIPE_CATEGORIES } from '../../data/initialRecipes';
import { 
  X, 
  Clock, 
  Scale, 
  ChefHat, 
  AlertTriangle, 
  Sparkles, 
  Printer, 
  Edit3, 
  Trash2, 
  History,
  CheckCircle2,
  Utensils,
  Lock,
  Upload,
  ZoomIn,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSuccessSound } from '../../utils/audio';
import { compressImageFile } from '../../utils/imageCompressor';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  isRecipesAdmin: boolean;
  onRequestAdmin: () => void;
  onEdit: (recipe: Recipe) => void;
  onUpdateRecipe?: (id: string, updates: Partial<Recipe>, changeNote?: string) => void;
  onDelete: (recipeId: string) => void;
  onViewHistory: (recipe: Recipe) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  isOpen,
  onClose,
  isRecipesAdmin,
  onRequestAdmin,
  onEdit,
  onUpdateRecipe,
  onDelete,
  onViewHistory,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !recipe) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedUrl = await compressImageFile(file, 1200, 0.82);
      if (compressedUrl && onUpdateRecipe) {
        onUpdateRecipe(recipe.id, { mainPhoto: compressedUrl }, 'Обновлено фото раскладки блюда');
        setImageError(false);
        playSuccessSound();
      }
    } catch (err) {
      console.error('Failed to compress image:', err);
    }
  };

  const categoryInfo = RECIPE_CATEGORIES.find(c => c.id === recipe.category) || {
    id: 'other',
    label: 'Блюдо',
    icon: '🍽️'
  };

  const allPhotos = [recipe.mainPhoto, ...(recipe.extraPhotos || [])].filter(Boolean);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Технологическая карта: ${recipe.title}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #222; margin: 0; padding: 20px; line-height: 1.5; font-size: 13px; }
            .header { border-bottom: 2px solid #222; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0 0 6px 0; }
            .meta { font-size: 12px; color: #555; }
            .badge { display: inline-block; background: #eee; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 6px; }
            .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 18px 0 8px 0; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
            th { background: #f8f8f8; font-weight: bold; }
            .qty { text-align: right; font-weight: bold; }
            .box { background: #fafafa; border: 1px solid #e0e0e0; padding: 10px; border-radius: 6px; margin-top: 10px; }
            .warning { background: #fff9e6; border: 1px solid #ffe58f; padding: 10px; border-radius: 6px; margin-top: 10px; }
            .tip { background: #e6f7ff; border: 1px solid #91d5ff; padding: 10px; border-radius: 6px; margin-top: 10px; }
            .footer { margin-top: 30px; font-size: 10px; color: #888; text-align: right; border-top: 1px solid #eee; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${recipe.title}</div>
              <div class="meta">
                <span class="badge">Категория: ${categoryInfo.label}</span>
                <span class="badge">Версия: ${recipe.currentVersion}</span>
                <span class="badge">Выход: ${recipe.yieldWeight}</span>
                <span class="badge">Время: ${recipe.prepTime}</span>
              </div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #777;">
              Ресторан<br>«Голодный Турист»
            </div>
          </div>

          <p><strong>Описание:</strong> ${recipe.description}</p>

          <div class="section-title">Состав и нормы расхода сырья</div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">№</th>
                <th>Наименование сырья / полуфабриката</th>
                <th class="qty" style="width: 90px;">Количество</th>
                <th style="width: 70px;">Ед. изм.</th>
              </tr>
            </thead>
            <tbody>
              ${recipe.ingredients.map((ing, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${ing.name}</td>
                  <td class="qty">${ing.quantity}</td>
                  <td>${ing.unit}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">Технология приготовления</div>
          <div style="white-space: pre-line;">${recipe.technology}</div>

          <div class="section-title">Оформление и правила подачи</div>
          <p>${recipe.plating}</p>

          ${recipe.importantNotes ? `
            <div class="warning">
              <strong>⚠️ ВАЖНО:</strong> ${recipe.importantNotes}
            </div>
          ` : ''}

          ${recipe.chefTip ? `
            <div class="tip">
              <strong>👨‍🍳 СОВЕТ ШЕФА:</strong> ${recipe.chefTip}
            </div>
          ` : ''}

          <div class="footer">
            Технологическая карта создана в приложении «Голодный Турист» • Дата печати: ${new Date().toLocaleDateString('ru-RU')}
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-2xl bg-[#FFFDF8] rounded-3xl border border-[#E2D8C3] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-[#FFFDF8] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">{categoryInfo.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full">
                  {categoryInfo.label}
                </span>
                <span className="text-[11px] font-black text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                  версия {recipe.currentVersion}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#2A1E17] truncate mt-0.5">
                {recipe.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePrint}
              className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all"
              title="Печать техкарты"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Hidden File Input for uploading photos */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Main Dish Photo with Gallery or Culinary Card */}
          {allPhotos.length > 0 && !imageError ? (
            <div className="space-y-2">
              <div 
                onClick={() => setIsPhotoZoomed(true)}
                className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-stone-900 border border-[#E2D8C3] shadow-sm cursor-zoom-in group"
                title="Нажмите, чтобы открыть фото раскладки на весь экран"
              >
                <img
                  src={allPhotos[selectedPhotoIndex] || recipe.mainPhoto}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    setImageError(true);
                  }}
                />
                
                {/* Fullscreen hover badge */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="bg-black/75 backdrop-blur-xs text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Maximize2 className="w-4 h-4 text-amber-400" />
                    <span>Посмотреть на весь экран</span>
                  </div>
                </div>

                {onUpdateRecipe && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="absolute top-2.5 left-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer z-10"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Сменить фото</span>
                  </button>
                )}
                <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 z-10">
                  <span>Выход: {recipe.yieldWeight}</span>
                </div>
                <div className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-amber-200 text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 z-10">
                  <ZoomIn className="w-3 h-3 text-amber-300" />
                  <span>Нажмите для увеличения раскладки</span>
                </div>
              </div>

              {/* Extra photo thumbnails if present */}
              {allPhotos.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {allPhotos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        selectedPhotoIndex === idx ? 'border-amber-600 scale-105 shadow-xs' : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-r from-[#FAF5EB] via-[#F4EDE0] to-[#EBE2CF] border border-[#E2D8C3] rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100/90 text-amber-900 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                  {categoryInfo.icon || '🍽️'}
                </div>
                <div>
                  <div className="font-black text-stone-900 text-sm sm:text-base leading-tight">{recipe.title}</div>
                  <div className="text-amber-950/70 text-xs font-semibold mt-0.5">Технологическая карта кухни</div>
                </div>
              </div>
              {onUpdateRecipe && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Прикрепить фото</span>
                </button>
              )}
            </div>
          )}

          {/* Key Metrics: Yield & Prep Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#FAF4E5] rounded-2xl border border-[#E5DCBE] flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 block">
                  Выход блюда
                </span>
                <span className="text-sm sm:text-base font-black text-stone-900">
                  {recipe.yieldWeight}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#FAF4E5] rounded-2xl border border-[#E5DCBE] flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 block">
                  Время готовки
                </span>
                <span className="text-sm sm:text-base font-black text-stone-900">
                  {recipe.prepTime}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {recipe.description && (
            <div className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-white p-3.5 rounded-2xl border border-stone-200">
              <span className="font-extrabold text-stone-900 block mb-1">Описание:</span>
              {recipe.description}
            </div>
          )}

          {/* Ingredients Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#2A1E17] flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-800" />
                <span>Ингредиенты и раскладка</span>
              </h3>
              <span className="text-xs font-bold text-stone-500">
                {recipe.ingredients.length} поз.
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2D8C3] overflow-hidden shadow-xs">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F8F3E5] border-b border-[#E2D8C3] text-stone-700 font-extrabold">
                    <th className="py-2.5 px-3 text-left">Ингредиент</th>
                    <th className="py-2.5 px-3 text-right">Кол-во</th>
                    <th className="py-2.5 px-3 text-left">Ед. изм.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {recipe.ingredients.map((ing, idx) => (
                    <tr key={ing.id || idx} className="hover:bg-stone-50">
                      <td className="py-2.5 px-3 font-semibold text-stone-900">
                        {ing.name}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-amber-950 font-mono">
                        {ing.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600 font-semibold">
                        {ing.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cooking Technology */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#2A1E17] flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-amber-800" />
              <span>Пошаговая технология приготовления</span>
            </h3>
            <div className="bg-white p-4 rounded-2xl border border-[#E2D8C3] text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-line shadow-xs">
              {recipe.technology}
            </div>
          </div>

          {/* Plating / Presentation */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#2A1E17] flex items-center gap-1.5">
              <span>🍽️</span>
              <span>Подача и оформление</span>
            </h3>
            <div className="bg-white p-4 rounded-2xl border border-[#E2D8C3] text-xs sm:text-sm text-stone-800 leading-relaxed shadow-xs">
              {recipe.plating}
            </div>
          </div>

          {/* Important Notes */}
          {recipe.importantNotes && (
            <div className="p-4 bg-amber-50/90 border-2 border-amber-300/80 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 text-amber-900 font-black text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>ВАЖНО (Особые правила / Аллергены):</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed font-medium pl-6">
                {recipe.importantNotes}
              </p>
            </div>
          )}

          {/* Chef Tip */}
          {recipe.chefTip && (
            <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 text-sky-900 font-black text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Совет шеф-повара:</span>
              </div>
              <p className="text-xs text-sky-950 leading-relaxed font-medium pl-6">
                {recipe.chefTip}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-stone-200 bg-[#FAF7EE] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(recipe)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Редактировать рецептуру, описание и фото"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Редактировать техкарту</span>
            </button>

            {recipe.history && recipe.history.length > 0 && (
              <button
                type="button"
                onClick={() => onViewHistory(recipe)}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold border border-stone-300 transition-all cursor-pointer"
                title="История версий рецепта"
              >
                <History className="w-3.5 h-3.5" />
                <span>Версии ({recipe.history.length})</span>
              </button>
            )}

            {isRecipesAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Вы уверены, что хотите удалить техкарту «${recipe.title}»?`)) {
                    onDelete(recipe.id);
                    onClose();
                  }
                }}
                className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-all"
                title="Удалить техкарту"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold active:scale-98 transition-all"
          >
            Закрыть
          </button>
        </div>
      </motion.div>

      {/* Fullscreen High-Resolution Image Zoom Modal */}
      <AnimatePresence>
        {isPhotoZoomed && (allPhotos[selectedPhotoIndex] || recipe.mainPhoto) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPhotoZoomed(false)}
            className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 cursor-zoom-out select-none"
          >
            {/* Top Toolbar */}
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="flex items-center justify-between gap-3 text-white max-w-5xl mx-auto w-full z-10"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{categoryInfo.icon || '🍽️'}</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">{recipe.title}</h3>
                  <p className="text-xs text-amber-300 font-medium">Эталонная подача и раскладка • Выход: {recipe.yieldWeight}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPhotoZoomed(false)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
                >
                  <X className="w-4 h-4" />
                  <span>Закрыть (Esc)</span>
                </button>
              </div>
            </div>

            {/* Central Full-Size Image Container */}
            <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                src={allPhotos[selectedPhotoIndex] || recipe.mainPhoto}
                alt={recipe.title}
                className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
                referrerPolicy="no-referrer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Bottom Plating Guidelines / Tips */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl mx-auto w-full bg-stone-900/90 border border-stone-700/80 rounded-2xl p-3 sm:p-4 text-center text-xs text-stone-200 shadow-xl backdrop-blur-md"
            >
              <div className="text-amber-400 font-bold mb-1 flex items-center justify-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                <span>Правило раскладки на тарелке:</span>
              </div>
              <p className="text-stone-300 text-[11px] leading-relaxed line-clamp-2 sm:line-clamp-none">
                {recipe.plating || 'Выложить строго в соответствии с эталонным снимком сервировки.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
