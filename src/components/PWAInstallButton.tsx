import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (compact) {
      return (
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
          title="Установить приложение на телефон"
        >
          <img src="/Logo_Golodnyy_Turist.png" alt="Голодный Турист" className="w-4 h-4 rounded-full object-cover" />
          <Download className="w-3.5 h-3.5" />
          <span>Установить</span>
        </button>
      );
    }

    return (
      <div className="w-full bg-[#FFFDF8] border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img 
            src="/Logo_Golodnyy_Turist.png" 
            alt="Логотип «Голодный Турист»" 
            className="w-10 h-10 rounded-xl object-contain shadow-xs border border-amber-200 shrink-0" 
          />
          <div className="min-w-0">
            <h4 className="text-xs font-black text-stone-900 leading-tight truncate">
              Установить «Голодный Турист»
            </h4>
            <p className="text-[11px] text-stone-600 truncate mt-0.5">
              Быстрый доступ прямо с экрана телефона
            </p>
          </div>
        </div>
        <button
          onClick={install}
          className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Установить</span>
        </button>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        {compact ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 border border-stone-300 text-stone-700 text-[11px] font-semibold hover:bg-stone-100 cursor-pointer"
          >
            <Share className="w-3 h-3 text-amber-700" />
            <span>На экран</span>
          </button>
        ) : (
          <div className="w-full bg-[#FFFDF8] border border-amber-200/80 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src="/Logo_Golodnyy_Turist.png" 
                alt="Логотип «Голодный Турист»" 
                className="w-8 h-8 rounded-lg object-contain border border-amber-200 shrink-0" 
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-stone-800 block truncate">
                  Добавить на экран «Домой» (iOS)
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 shrink-0 cursor-pointer"
            >
              Инструкция
            </button>
          </div>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-3xl bg-[#FFFDF8] border-2 border-[#D9C4A0] p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <img 
                    src="/Logo_Golodnyy_Turist.png" 
                    alt="Голодный Турист" 
                    className="w-12 h-12 rounded-2xl object-contain shadow-sm border border-stone-200" 
                  />
                  <div>
                    <h3 className="text-base font-black text-stone-900">Установка на iPhone / iPad</h3>
                    <p className="text-xs text-stone-600">Иконка приложения на рабочий стол</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full hover:bg-stone-200 text-stone-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 bg-[#F8F3E6] rounded-2xl p-3.5 text-xs text-stone-800 border border-[#E8DFC8]">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg border border-stone-200 shrink-0 mt-0.5">
                    <Share className="w-4 h-4 text-sky-600" />
                  </div>
                  <p>
                    <strong>Шаг 1:</strong> Нажмите кнопку <strong>«Поделиться»</strong> (значок со стрелочкой вверх) в нижней панели Safari.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg border border-stone-200 shrink-0 mt-0.5">
                    <PlusSquare className="w-4 h-4 text-amber-700" />
                  </div>
                  <p>
                    <strong>Шаг 2:</strong> Прокрутите вниз и выберите <strong>«На экран "Домой"»</strong> (Add to Home Screen).
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-3 bg-[#2A1E17] text-white rounded-xl font-bold text-xs hover:bg-[#3E2C22] active:scale-95 transition-all cursor-pointer"
              >
                Понятно
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
