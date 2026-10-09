import React from 'react';
import { Recipe, RecipeVersion } from '../../types';
import { X, History, Clock, ArrowRight, Calendar, User, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface RecipeHistoryModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecipeHistoryModal: React.FC<RecipeHistoryModalProps> = ({
  recipe,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !recipe) return null;

  const historyList = recipe.history || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#FFFDF8] rounded-3xl border border-[#E2D8C3] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-[#FFFDF8] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <History className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full">
                История изменений
              </span>
              <h2 className="text-base sm:text-lg font-black text-[#2A1E17] leading-tight">
                {recipe.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Current Active Version Card */}
          <div className="p-4 bg-emerald-50/80 border-2 border-emerald-400/80 rounded-2xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Текущая активная версия: {recipe.currentVersion}
              </span>
              <span className="text-[11px] font-bold text-emerald-700">
                {recipe.updatedAt}
              </span>
            </div>
            <p className="text-xs text-stone-700 font-medium">
              Отображается обычным сотрудникам и поварам на кухне.
            </p>
          </div>

          <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 pt-2">
            Предыдущие редакции техкарты:
          </h3>

          {historyList.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500 font-medium bg-stone-50 rounded-2xl border border-stone-200">
              Предыдущих редакций пока нет. Это первая опубликованная версия.
            </div>
          ) : (
            <div className="space-y-3">
              {historyList.map((ver, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 bg-white rounded-2xl border border-[#E2D8C3] shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-amber-950 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      Версия {ver.version}
                    </span>
                    <span className="text-xs text-stone-500 flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {ver.updatedAt}
                    </span>
                  </div>

                  {ver.changeNote && (
                    <div className="text-xs font-semibold text-stone-800 bg-[#FAF6EC] p-2 rounded-xl border border-[#E5DCBE]">
                      <span className="text-stone-500 font-bold block text-[10px] uppercase">Изменения:</span>
                      {ver.changeNote}
                    </div>
                  )}

                  {ver.data && (
                    <div className="text-[11px] text-stone-600 space-y-1 pt-1 border-t border-stone-100">
                      <div><strong className="text-stone-800">Выход:</strong> {ver.data.yieldWeight} • <strong className="text-stone-800">Время:</strong> {ver.data.prepTime}</div>
                      {ver.data.ingredients && ver.data.ingredients.length > 0 && (
                        <div>
                          <strong className="text-stone-800">Ингредиенты ({ver.data.ingredients.length}):</strong>{' '}
                          {ver.data.ingredients.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-200 bg-[#FAF7EE] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold active:scale-98 transition-all"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </div>
  );
};
