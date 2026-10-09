import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Plus, 
  AlertCircle, 
  HelpCircle, 
  Check, 
  ArrowRight, 
  X,
  Radio,
  Loader2
} from 'lucide-react';
import { Product, ProductCategory, RestaurantId } from '../types';
import { 
  VoiceParseResult, 
  PendingClarification, 
  parseVoiceTranscriptLocally, 
  speakResponse 
} from '../utils/voiceOrderParser';
import { playSuccessSound, playTapSound } from '../utils/audio';

interface VoiceOrderBarProps {
  products: Product[];
  selectedRestaurant: RestaurantId;
  currentCategory: ProductCategory | 'all';
  onNavigateCategory: (cat: ProductCategory | 'all') => void;
  onAddItem: (productId: string, quantity: number, unit?: string, product?: Product) => void;
  onOpenAddProduct: (suggestedName?: string) => void;
  isVoiceActive: boolean;
  onToggleVoiceActive: () => void;
}

export const VoiceOrderBar: React.FC<VoiceOrderBarProps> = ({
  products,
  selectedRestaurant,
  currentCategory,
  onNavigateCategory,
  onAddItem,
  onOpenAddProduct,
  isVoiceActive,
  onToggleVoiceActive,
}) => {
  // Session & Recognition States
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  
  const [lastFeedback, setLastFeedback] = useState<{
    type: 'success' | 'clarification' | 'unknown_product' | 'info' | 'error';
    message: string;
    suggestedProduct?: string;
  } | null>(null);

  const [pendingClarification, setPendingClarification] = useState<PendingClarification | null>(null);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);

  // References to prevent stale closures and manage speech lifecycle
  const isSessionActiveRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  
  const currentCatalogRef = useRef<Product[]>([]);
  const currentCategoryRef = useRef<ProductCategory | 'all'>('all');
  const pendingClarificationRef = useRef<PendingClarification | null>(null);
  const isVoiceMutedRef = useRef<boolean>(false);

  // Filter catalog for current restaurant
  const currentCatalog = React.useMemo(() => {
    return products.filter(
      p => !p.restaurants || p.restaurants.length === 0 || p.restaurants.includes(selectedRestaurant)
    );
  }, [products, selectedRestaurant]);

  // Keep refs in sync
  useEffect(() => {
    currentCatalogRef.current = currentCatalog;
  }, [currentCatalog]);

  useEffect(() => {
    currentCategoryRef.current = currentCategory;
  }, [currentCategory]);

  useEffect(() => {
    pendingClarificationRef.current = pendingClarification;
  }, [pendingClarification]);

  useEffect(() => {
    isVoiceMutedRef.current = isVoiceMuted;
  }, [isVoiceMuted]);

  // Clean up recognition and timers on unmount
  useEffect(() => {
    return () => {
      isSessionActiveRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };
  }, []);

  /**
   * Automatically start continuous recognition instance if session is active
   */
  const startRecognitionInstance = useCallback(() => {
    if (!isSessionActiveRef.current) return;
    if (isProcessingRef.current || isSpeakingRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setLastFeedback({
        type: 'error',
        message: 'Голосовой ввод не поддерживается в этом браузере. Рекомендуем Google Chrome или Safari.',
      });
      setIsSessionActive(false);
      isSessionActiveRef.current = false;
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (!isSessionActiveRef.current) {
          try { recognition.abort(); } catch {}
          return;
        }
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        if (!isSessionActiveRef.current || isProcessingRef.current || isSpeakingRef.current) {
          return;
        }

        let interimText = '';
        let finalPhrase = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            finalPhrase += text;
          } else {
            interimText += text;
          }
        }

        const candidateText = (finalPhrase || interimText).trim();
        if (candidateText) {
          setSpokenTranscript(candidateText);
        }

        // If recognition finalized this chunk
        if (finalPhrase.trim()) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          executeProcessTranscript(finalPhrase.trim());
          return;
        }

        // If user is dictating interim results, debounce natural pauses
        if (interimText.trim()) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (
              isSessionActiveRef.current && 
              !isProcessingRef.current && 
              !isSpeakingRef.current &&
              interimText.trim()
            ) {
              executeProcessTranscript(interimText.trim());
            }
          }, 950);
        }
      };

      recognition.onerror = (event: any) => {
        // Natural silence or pauses between dictating items -> ignore and keep session alive!
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }

        console.warn('Speech recognition warning:', event.error);
        if (event.error === 'not-allowed') {
          isSessionActiveRef.current = false;
          setIsSessionActive(false);
          setIsListening(false);
          setLastFeedback({
            type: 'error',
            message: 'Доступ к микрофону заблокирован. Разрешите микрофон в настройках браузера.',
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If the session is still active and not currently handling response/TTS:
        // Automatically restart listening so pauses never stop the session!
        if (isSessionActiveRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (isSessionActiveRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
              startRecognitionInstance();
            }
          }, 120);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Recognition start error:', err);
      // Retry in 500ms if session is active
      if (isSessionActiveRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (isSessionActiveRef.current) startRecognitionInstance();
        }, 500);
      }
    }
  }, []);

  /**
   * Process recognized speech phrase through AI endpoint with local fallback
   */
  const executeProcessTranscript = async (text: string) => {
    const phrase = text.trim();
    if (!phrase) return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);
    setIsListening(false);

    // Stop recognition during AI parsing & TTS response to avoid self-hearing
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      let result: VoiceParseResult | null = null;

      // 1. Try server endpoint
      try {
        const response = await fetch('/api/voice-order-parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: phrase,
            catalog: currentCatalogRef.current,
            activeCategory: currentCategoryRef.current,
            pendingClarification: pendingClarificationRef.current,
          }),
        });

        if (response.ok) {
          result = await response.json();
        }
      } catch (networkErr) {
        console.warn('Backend parse call failed, using local parser:', networkErr);
      }

      // 2. Local parser fallback if server failed
      if (!result || !result.type) {
        result = parseVoiceTranscriptLocally(
          phrase,
          currentCatalogRef.current,
          currentCategoryRef.current,
          pendingClarificationRef.current
        );
      }

      // 3. Dispatch action based on parse result
      let spokenText = '';

      if (result.type === 'add_item' && result.productId && result.quantity) {
        const matchedProduct = currentCatalogRef.current.find(p => p.id === result!.productId);
        onAddItem(result.productId, result.quantity, result.unit || undefined, matchedProduct);
        playSuccessSound();

        spokenText = result.spokenResponse || `Принято. ${result.productName} — ${result.quantity} ${result.unit || 'кг'}.`;
        setLastFeedback({
          type: 'success',
          message: spokenText,
        });
        setPendingClarification(null);
      } else if (result.type === 'navigation' && result.department) {
        onNavigateCategory(result.department);
        playTapSound();

        spokenText = result.spokenResponse || 'Отдел открыт.';
        setLastFeedback({
          type: 'info',
          message: spokenText,
        });
      } else if (result.type === 'unknown_product') {
        const newName = result.suggestedNewProductName || phrase;
        spokenText = 'Такого товара нет в списке. Добавить товар?';
        setLastFeedback({
          type: 'unknown_product',
          message: spokenText,
          suggestedProduct: newName,
        });
      } else if (result.type === 'clarification') {
        spokenText = result.clarificationQuestion || result.spokenResponse || 'Уточните количество';
        setLastFeedback({
          type: 'clarification',
          message: spokenText,
        });

        if (result.productId) {
          setPendingClarification({
            productId: result.productId,
            productName: result.productName || 'Товар',
            unit: result.unit || 'кг',
            timestamp: Date.now(),
          });
        }
      } else {
        spokenText = result.spokenResponse || 'Команда не понята. Диктуйте товар.';
        setLastFeedback({
          type: 'info',
          message: spokenText,
        });
      }

      // 4. Speak confirmation / question via TTS
      // REQUIREMENT: After voice confirmation, microphone automatically continues listening!
      const resumeContinuousListening = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        isProcessingRef.current = false;
        setIsProcessing(false);
        setSpokenTranscript('');

        if (isSessionActiveRef.current) {
          startRecognitionInstance();
        }
      };

      if (!isVoiceMutedRef.current && spokenText) {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
        speakResponse(spokenText, () => {
          resumeContinuousListening();
        });
      } else {
        // If voice TTS is muted, wait briefly for UI feedback then resume listening
        setTimeout(() => {
          resumeContinuousListening();
        }, 500);
      }
    } catch (err) {
      console.error('Error processing voice phrase:', err);
      // Clean recovery to continue listening
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      isProcessingRef.current = false;
      setIsProcessing(false);
      setSpokenTranscript('');
      if (isSessionActiveRef.current) {
        startRecognitionInstance();
      }
    }
  };

  /**
   * Start continuous voice session on initial user tap
   */
  const startContinuousSession = () => {
    playTapSound();
    isSessionActiveRef.current = true;
    setIsSessionActive(true);
    setLastFeedback({
      type: 'info',
      message: 'Непрерывная сессия активна. Назовите товар или отдел.',
    });
    setSpokenTranscript('');
    startRecognitionInstance();
  };

  /**
   * Stop continuous voice session completely (Requirement 6: ⏹ «Стоп»)
   */
  const stopContinuousSession = () => {
    playTapSound();
    isSessionActiveRef.current = false;
    isProcessingRef.current = false;
    isSpeakingRef.current = false;

    setIsSessionActive(false);
    setIsListening(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    setSpokenTranscript('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    setLastFeedback({
      type: 'info',
      message: 'Голосовая сессия завершена. Вы можете продолжить вручную или снова включить 🎤.',
    });
  };

  /**
   * Quick simulate voice input for testing or when clicking example chips
   */
  const handleQuickDictation = (text: string) => {
    if (!isSessionActiveRef.current) {
      isSessionActiveRef.current = true;
      setIsSessionActive(true);
    }
    setSpokenTranscript(text);
    executeProcessTranscript(text);
  };

  return (
    <div className="w-full mb-3 select-none">
      {/* Voice Assistant Widget */}
      <div className={`rounded-2xl border-2 transition-all shadow-md overflow-hidden ${
        isSessionActive
          ? isListening
            ? 'bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border-red-500 shadow-red-200/50'
            : isSpeaking
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border-emerald-500 shadow-emerald-200/50'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-400 shadow-amber-200/50'
          : 'bg-[#FFFDF8] border-amber-300/80 shadow-stone-200/60'
      }`}>
        {/* Main Bar Row */}
        <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2">
          {/* Left section: Mic or Stop Button & Status */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Primary Action Button (Mic when idle, Pulsing Mic when active) */}
            <button
              id="btn-voice-record"
              type="button"
              onClick={isSessionActive ? stopContinuousSession : startContinuousSession}
              className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md ${
                isSessionActive
                  ? isListening
                    ? 'bg-red-600 text-white scale-105 shadow-red-500/40 ring-4 ring-red-400/40'
                    : 'bg-amber-600 text-white shadow-amber-500/30'
                  : 'bg-gradient-to-tr from-amber-900 to-amber-700 hover:from-amber-800 hover:to-amber-600 text-white active:scale-95'
              }`}
              title={isSessionActive ? 'Нажмите, чтобы остановить сессию' : 'Нажмите 🎤 один раз для непрерывного ввода'}
            >
              {isSessionActive && isListening ? (
                <>
                  <Mic className="w-6 h-6 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                </>
              ) : isSessionActive ? (
                <Loader2 className="w-6 h-6 animate-spin text-amber-100" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            {/* Prompt / Live State Text */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  isSessionActive ? 'bg-amber-200 text-amber-950 font-black' : 'bg-amber-100 text-amber-900'
                }`}>
                  {isSessionActive ? 'Непрерывный режим' : 'Голосовой ввод'}
                </span>

                {isSessionActive && isListening && (
                  <span className="text-[11px] font-bold text-red-600 flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                    Слушаю...
                  </span>
                )}

                {isSessionActive && isProcessing && (
                  <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin inline-block" />
                    Обрабатываю...
                  </span>
                )}

                {isSessionActive && isSpeaking && (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 animate-pulse">
                    <Volume2 className="w-3 h-3 inline-block" />
                    Подтверждение...
                  </span>
                )}
              </div>

              {/* Spoken phrase or helpful live guidance */}
              <div className="text-xs sm:text-[13px] font-bold text-stone-800 truncate mt-0.5">
                {spokenTranscript ? (
                  <span className="italic text-stone-900 font-extrabold">«{spokenTranscript}»</span>
                ) : isSessionActive ? (
                  isListening ? (
                    <span className="text-red-700 font-medium">Диктуйте следующий товар... (паузы не отключают микрофон)</span>
                  ) : (
                    <span className="text-stone-600">Сессия активна...</span>
                  )
                ) : (
                  <span className="text-stone-600">Нажмите 🎤 для непрерывного ввода заказов</span>
                )}
              </div>
            </div>
          </div>

          {/* Right controls: Stop button (Req 6) + TTS Mute + Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* REQUIREMENT 6: Dedicated Stop Button ⏹ «Стоп» to terminate continuous session */}
            {isSessionActive && (
              <button
                type="button"
                onClick={stopContinuousSession}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs shadow-md transition-all cursor-pointer shrink-0"
                title="Полностью завершить голосовую сессию"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Стоп</span>
              </button>
            )}

            {/* TTS Mute Toggle */}
            <button
              type="button"
              onClick={() => setIsVoiceMuted(!isVoiceMuted)}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              title={isVoiceMuted ? 'Включить голосовой ответ ИИ' : 'Отключить голосовой ответ ИИ'}
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-emerald-700" />}
            </button>

            {/* Close Bar */}
            <button
              type="button"
              onClick={() => {
                if (isSessionActive) stopContinuousSession();
                onToggleVoiceActive();
              }}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Закрыть голосовую панель"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Action & Feedback Banner */}
        <AnimatePresence>
          {lastFeedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`px-3 py-2 border-t text-xs flex items-center justify-between gap-2 ${
                lastFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold'
                  : lastFeedback.type === 'unknown_product'
                  ? 'bg-amber-100/90 border-amber-300 text-amber-950 font-bold'
                  : lastFeedback.type === 'clarification'
                  ? 'bg-sky-50 border-sky-200 text-sky-950 font-bold'
                  : lastFeedback.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-900 font-bold'
                  : 'bg-stone-100 border-stone-200 text-stone-800 font-medium'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {lastFeedback.type === 'success' && <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />}
                {lastFeedback.type === 'unknown_product' && <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />}
                {lastFeedback.type === 'clarification' && <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />}
                <span className="leading-tight">{lastFeedback.message}</span>
              </div>

              {/* Requirement: If unknown product -> show "Добавить товар" button */}
              {lastFeedback.type === 'unknown_product' && (
                <button
                  type="button"
                  onClick={() => onOpenAddProduct(lastFeedback.suggestedProduct)}
                  className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 active:scale-95 text-white rounded-lg text-[11px] font-black shrink-0 transition-transform shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Добавить товар</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Voice Hints & Example Chips (Clicking them also tests continuous flow!) */}
        <div className="px-2.5 py-1.5 bg-[#FAF4E6] border-t border-amber-200/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px] text-stone-600">
          <span className="font-extrabold text-amber-900 shrink-0">
            {isSessionActive ? 'Быстрый тест (непрерывно):' : 'Примеры речи:'}
          </span>
          <button
            type="button"
            onClick={() => handleQuickDictation('Огурцы полкило')}
            className="px-2 py-0.5 rounded-full bg-white hover:bg-amber-100 border border-stone-200 hover:border-amber-300 font-semibold shrink-0 cursor-pointer transition-colors"
          >
            «Огурцы полкило»
          </button>
          <button
            type="button"
            onClick={() => handleQuickDictation('Помидоры два килограмма')}
            className="px-2 py-0.5 rounded-full bg-white hover:bg-amber-100 border border-stone-200 hover:border-amber-300 font-semibold shrink-0 cursor-pointer transition-colors"
          >
            «Помидоры два килограмма»
          </button>
          <button
            type="button"
            onClick={() => handleQuickDictation('Картошки пять кило')}
            className="px-2 py-0.5 rounded-full bg-white hover:bg-amber-100 border border-stone-200 hover:border-amber-300 font-semibold shrink-0 cursor-pointer transition-colors"
          >
            «Картошки пять кило»
          </button>
          <button
            type="button"
            onClick={() => handleQuickDictation('Две пачки салфеток')}
            className="px-2 py-0.5 rounded-full bg-white hover:bg-amber-100 border border-stone-200 hover:border-amber-300 font-semibold shrink-0 cursor-pointer transition-colors"
          >
            «Две пачки салфеток»
          </button>
          <button
            type="button"
            onClick={() => handleQuickDictation('Открой овощной отдел')}
            className="px-2 py-0.5 rounded-full bg-white hover:bg-amber-100 border border-stone-200 hover:border-amber-300 font-semibold shrink-0 cursor-pointer transition-colors"
          >
            «Открой овощной отдел»
          </button>
          <button
            type="button"
            onClick={() => handleQuickDictation('Теперь давай мясное')}
            className="px-2 py-0.5 rounded-full bg-white hover:bg-amber-100 border border-stone-200 hover:border-amber-300 font-semibold shrink-0 cursor-pointer transition-colors"
          >
            «Теперь давай мясное»
          </button>
          <button
            type="button"
            onClick={() => handleQuickDictation('Перейдём в бакалею')}
            className="px-2 py-0.5 rounded-full bg-white hover:bg-amber-100 border border-stone-200 hover:border-amber-300 font-semibold shrink-0 cursor-pointer transition-colors"
          >
            «Перейдём в бакалею»
          </button>
        </div>
      </div>
    </div>
  );
};
