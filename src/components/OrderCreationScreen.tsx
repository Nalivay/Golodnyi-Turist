import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LogoGolodnyyTurist } from './Logos';
import { AddProductModal } from './AddProductModal';
import { OrderPreviewModal } from './OrderPreviewModal';
import { DatabaseConnectModal } from './DatabaseConnectModal';
import { COMMON_UNITS, PRODUCT_CATEGORIES } from '../data/initialData';
import { formatOrderMessage, copyOrderToClipboard } from '../services/deliveryService';
import { Product, SavedOrder, OrderItem, ProductCategory } from '../types';
import { PinAuthModal } from './PinAuthModal';
import { calculateOrderTotalSum } from '../utils/orderPricing';
import { sortOrderItems } from '../utils/orderSorting';
import { playTapSound, playSendOrderSound } from '../utils/audio';
import { 
  Search, 
  Plus, 
  Minus, 
  Send, 
  ArrowLeft, 
  History, 
  Trash2, 
  Check, 
  Copy,
  SlidersHorizontal, 
  FileText,
  X,
  Lock,
  ShieldCheck,
  LogOut,
  AlertCircle,
  Mic
} from 'lucide-react';
import { isOrderToday } from '../utils/orderFulfillment';
import { VoiceOrderBar } from './VoiceOrderBar';

export const OrderCreationScreen: React.FC = () => {
  const {
    selectedRestaurant,
    setSelectedRestaurant,
    setCurrentScreen,
    products,
    addProduct,
    updateProduct,
    setProductUnitPrice,
    deleteProduct,
    orderItems,
    setOrderItemQuantity,
    updateOrderItemUnit,
    updateOrderItemSum,
    removeOrderItem,
    clearCurrentOrder,
    currentDateString,
    currentTimeString,
    orders,
    saveOrder,
    setActiveOrderForView,
    getCurrentFormattedDateTime,
    getNextOrderNumber,
    isOrdersAdmin,
    authenticateRole,
    logoutRole,
    editingOrderId,
    cancelEditingOrder,
    isDatabaseConnected,
    connectedEmail,
    disconnectDatabase,
    isVoiceOrderMode,
    setIsVoiceOrderMode,
  } = useApp();

  const restaurantName = 'Голодный Турист';
  const brandColor = '#D97706';
  const brandBorderColor = 'border-amber-600';
  const indicator = '🧭';

  // Database Connection modal state
  const [isDatabaseConnectModalOpen, setIsDatabaseConnectModalOpen] = useState(false);
  const [pendingPostConnectAction, setPendingPostConnectAction] = useState<(() => void) | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Order confirmation review modal state
  const [isReviewConfirmOpen, setIsReviewConfirmOpen] = useState(false);

  // Mandatory Customer / Sender Name state
  const [customerName, setCustomerName] = useState(() => {
    try {
      return localStorage.getItem('armminsk_customer_name') || '';
    } catch (e) {
      return '';
    }
  });
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameInputError, setNameInputError] = useState('');

  // PIN Auth modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pinActionDesc, setPinActionDesc] = useState('');

  const [addProductPresetName, setAddProductPresetName] = useState('');
  const [justAddedNotification, setJustAddedNotification] = useState<string | null>(null);

  const [isCopiedCurrent, setIsCopiedCurrent] = useState(false);
  const [copiedTodayOrderId, setCopiedTodayOrderId] = useState<string | null>(null);

  // Quick price setting modal state (direct 1-click price entry without PIN)
  const [quickPriceProduct, setQuickPriceProduct] = useState<Product | null>(null);
  const [quickPriceInput, setQuickPriceInput] = useState<string>('');

  const todayOrderForThisRestaurant = useMemo(() => {
    return orders.find(o => o.restaurantId === selectedRestaurant && isOrderToday(o));
  }, [orders, selectedRestaurant]);

  const handleCopyCurrentOrder = () => {
    const finalCustomerName = customerName.trim();
    const { date, time } = getCurrentFormattedDateTime();
    const existingOrder = editingOrderId ? orders.find(o => o.id === editingOrderId) : null;
    const nextOrderNumber = existingOrder?.orderNumber || getNextOrderNumber(selectedRestaurant);
    const orderDate = existingOrder?.date || date;
    const orderTime = existingOrder?.time || time;
    const orderTimestamp = existingOrder?.timestamp || Date.now();

    const tempOrder: SavedOrder = {
      id: editingOrderId || 'temp',
      restaurantId: selectedRestaurant,
      restaurantName,
      indicator,
      customerName: finalCustomerName || undefined,
      date: orderDate,
      time: orderTime,
      timestamp: orderTimestamp,
      orderNumber: nextOrderNumber,
      items: selectedItemsList,
      totalPositions: selectedItemsList.length,
      status: 'draft',
      sentChannels: ['telegram'],
      messageText: '',
    };

    copyOrderToClipboard(tempOrder, products);
    setIsCopiedCurrent(true);
    setTimeout(() => setIsCopiedCurrent(false), 2500);
  };

  const handleProtectedAdminAction = (action: () => void, description: string) => {
    if (isOrdersAdmin) {
      action();
    } else {
      setPendingAction(() => action);
      setPinActionDesc(description);
      setIsPinModalOpen(true);
    }
  };

  const selectedItemsList = useMemo(() => {
    const list = (Object.values(orderItems) as OrderItem[]).filter((item) => {
      if (!item) return false;
      const q = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity));
      return !isNaN(q) && q > 0;
    });
    return sortOrderItems(list, products, selectedRestaurant);
  }, [orderItems, products, selectedRestaurant]);

  const selectedCount = selectedItemsList.length;

  // Filtered products list - supports search by name, category filter, and aliases (e.g. честнок -> чеснок)
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const item = orderItems[p.id];
      const hasActiveOrder = Boolean(item && (typeof item.quantity === 'number' ? item.quantity > 0 : parseFloat(String(item.quantity)) > 0));
      const inScope = !p.restaurants || p.restaurants.length === 0 || p.restaurants.includes(selectedRestaurant);

      if (!inScope && !hasActiveOrder) {
        return false;
      }

      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        if (!hasActiveOrder || !showOnlySelected) {
          return false;
        }
      }

      if (showOnlySelected && !hasActiveOrder) {
        return false;
      }

      if (!query) {
        return true;
      }

      const matchesName = p.name.toLowerCase().includes(query);
      const matchesAliases = p.aliases?.some(a => a.toLowerCase().includes(query));
      return matchesName || matchesAliases;
    });
  }, [products, searchQuery, showOnlySelected, selectedCategory, orderItems, selectedRestaurant]);

  const handleOpenAddProduct = (presetName?: string) => {
    handleProtectedAdminAction(() => {
      setEditingProduct(null);
      setAddProductPresetName(presetName || searchQuery || '');
      setIsAddModalOpen(true);
    }, '🔒 Добавление товаров в каталог доступно только администратору заказов.\nВведите PIN-код:');
  };

  const handleEditProduct = (prod: Product) => {
    handleProtectedAdminAction(() => {
      setEditingProduct(prod);
      setAddProductPresetName('');
      setIsAddModalOpen(true);
    }, '🔒 Редактирование карточки товара и цен доступно только администратору заказов.\nВведите PIN-код:');
  };

  const getProductUnit = (product: Product) => {
    return orderItems[product.id]?.unit || product.defaultUnit || 'кг';
  };

  const getProductSum = (product: Product) => {
    if (orderItems[product.id]?.sum !== undefined && orderItems[product.id]?.sum !== '') {
      return String(orderItems[product.id].sum);
    }
    return '';
  };

  const handleUnitChange = (product: Product, unit: string) => {
    updateProduct(product.id, {
      defaultUnit: unit,
    });
    if (orderItems[product.id]) {
      updateOrderItemUnit(product.id, unit);
    }
  };

  const handleOpenQuickPrice = (product: Product) => {
    const currentRestPrice = product.pricesByRestaurant?.[selectedRestaurant] || product.defaultPrice || '';
    setQuickPriceProduct(product);
    setQuickPriceInput(currentRestPrice);
  };

  const handleSaveQuickPrice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickPriceProduct) return;
    const cleanVal = quickPriceInput.trim().replace(',', '.');
    const numVal = parseFloat(cleanVal);
    if (!isNaN(numVal) && numVal >= 0) {
      setProductUnitPrice(quickPriceProduct.id, numVal, selectedRestaurant);
      // If not yet in order and numVal > 0, automatically select it with quantity 1
      if (!orderItems[quickPriceProduct.id] && numVal > 0) {
        setOrderItemQuantity(
          quickPriceProduct.id,
          1,
          getProductUnit(quickPriceProduct),
          undefined,
          numVal,
          quickPriceProduct
        );
      }
    }
    setQuickPriceProduct(null);
  };

  const handleSumChange = (product: Product, sumVal: string) => {
    const cleanStr = sumVal.trim().replace(',', '.');
    const existingItem = orderItems[product.id];
    const qty = existingItem 
      ? (typeof existingItem.quantity === 'number' ? existingItem.quantity : parseFloat(String(existingItem.quantity)) || 1)
      : 1;

    // 1. Update draft order item
    if (!existingItem) {
      setOrderItemQuantity(product.id, 1, getProductUnit(product), undefined, cleanStr, product);
    } else {
      updateOrderItemSum(product.id, cleanStr);
    }

    // 2. If valid number > 0 was entered, calculate unit price (per 1 kg, per 1 pc/pack) and persist to catalog!
    const numSum = parseFloat(cleanStr);
    if (!isNaN(numSum) && numSum > 0 && qty > 0) {
      const calculatedUnitPrice = Math.round((numSum / qty) * 100) / 100;
      setProductUnitPrice(product.id, calculatedUnitPrice, selectedRestaurant);
    }
  };

  const getQuantityStep = (product: Product): number => {
    const unit = getProductUnit(product);
    return unit === 'кг' ? 0.5 : 1;
  };

  const handleQuantityIncrement = (product: Product, delta: number) => {
    playTapSound();
    const current = orderItems[product.id]?.quantity || 0;
    const currentNum = typeof current === 'string' ? parseFloat(current) || 0 : current;
    const newQty = Math.max(0, Math.round((currentNum + delta) * 100) / 100);
    if (newQty === 0) {
      removeOrderItem(product.id);
    } else {
      const unitPrice = parseFloat(product.pricesByRestaurant?.[selectedRestaurant] || product.defaultPrice || '');
      const autoSum = !isNaN(unitPrice) && unitPrice > 0 ? Math.round(newQty * unitPrice * 100) / 100 : undefined;
      setOrderItemQuantity(
        product.id,
        newQty,
        getProductUnit(product),
        undefined,
        autoSum,
        product
      );
    }
  };

  const handleDirectQuantityChange = (product: Product, val: string) => {
    if (val === '') {
      removeOrderItem(product.id);
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      removeOrderItem(product.id);
    } else {
      const unitPrice = parseFloat(product.pricesByRestaurant?.[selectedRestaurant] || product.defaultPrice || '');
      const autoSum = !isNaN(unitPrice) && unitPrice > 0 ? Math.round(num * unitPrice * 100) / 100 : undefined;
      setOrderItemQuantity(
        product.id,
        num,
        getProductUnit(product),
        undefined,
        autoSum,
        product
      );
    }
  };

  const handleVoiceAddItem = (productId: string, quantity: number, unit?: string, fallbackProduct?: Product) => {
    const prod = products.find(p => p.id === productId) || fallbackProduct;
    const finalUnit = unit || prod?.defaultUnit || 'кг';
    const restPrice = prod?.pricesByRestaurant?.[selectedRestaurant] || prod?.defaultPrice || '';
    const numPrice = parseFloat(restPrice);
    const autoSum = !isNaN(numPrice) && numPrice > 0 ? Math.round(quantity * numPrice * 100) / 100 : undefined;

    setOrderItemQuantity(
      productId,
      quantity,
      finalUnit,
      undefined,
      autoSum,
      prod
    );
  };

  const handleVoiceNavigateCategory = (cat: ProductCategory | 'all') => {
    setSelectedCategory(cat);
  };

  const handleClearAll = () => {
    playTapSound();
    clearCurrentOrder();
  };

  const handleFinishOrder = () => {
    if (selectedItemsList.length === 0) {
      alert('Пожалуйста, укажите количество хотя бы для одного продукта');
      return;
    }
    // If phone is not connected to shared database yet, open database connection modal
    if (!isDatabaseConnected) {
      setPendingPostConnectAction(() => () => handleFinishOrder());
      setIsDatabaseConnectModalOpen(true);
      return;
    }
    // If sender/customer name is missing, immediately show popup asking for name
    if (!customerName.trim()) {
      setNameInput('');
      setNameInputError('');
      setIsNameModalOpen(true);
      return;
    }
    // Open mandatory pre-send review modal
    setIsReviewConfirmOpen(true);
  };

  const executeOrderSubmission = (nameOverride?: string) => {
    const finalCustomerName = (nameOverride || customerName).trim();
    if (!finalCustomerName) {
      setIsReviewConfirmOpen(false);
      setNameInput('');
      setNameInputError('');
      setIsNameModalOpen(true);
      return;
    }

    setIsReviewConfirmOpen(false);
    setIsNameModalOpen(false);

    const { date, time } = getCurrentFormattedDateTime();
    const existingOrder = editingOrderId ? orders.find(o => o.id === editingOrderId) : null;
    const nextOrderNumber = existingOrder?.orderNumber || getNextOrderNumber(selectedRestaurant);
    const orderDate = existingOrder?.date || date;
    const orderTime = existingOrder?.time || time;
    const orderTimestamp = existingOrder?.timestamp || Date.now();

    const orderData = {
      id: editingOrderId || undefined,
      restaurantId: selectedRestaurant,
      restaurantName,
      indicator,
      customerName: finalCustomerName,
      date: orderDate,
      time: orderTime,
      timestamp: orderTimestamp,
      orderNumber: nextOrderNumber,
      items: selectedItemsList,
      totalPositions: selectedItemsList.length,
      status: 'sent' as const,
      sentChannels: ['telegram' as const],
      messageText: '',
    };

    const formattedMessage = formatOrderMessage({
      ...orderData,
      id: editingOrderId || 'temp',
      timestamp: orderTimestamp,
    }, false, products);

    const saved = saveOrder({
      ...orderData,
      messageText: formattedMessage,
    });

    // Play signature "фиу + фанфары" audio feedback
    playSendOrderSound();

    setActiveOrderForView(saved);
    setCurrentScreen('paper_view');
  };

  const handleSendOrderClick = (nameOverride?: string) => {
    const finalCustomerName = (nameOverride || customerName).trim();
    if (!finalCustomerName) {
      setIsReviewConfirmOpen(false);
      setNameInput('');
      setNameInputError('');
      setIsNameModalOpen(true);
      return;
    }

    if (!isDatabaseConnected) {
      setPendingPostConnectAction(() => () => handleSendOrderClick(finalCustomerName));
      setIsDatabaseConnectModalOpen(true);
      return;
    }

    if (isOrdersAdmin) {
      executeOrderSubmission(finalCustomerName);
    } else {
      setIsReviewConfirmOpen(false);
      setIsNameModalOpen(false);
      setPendingAction(() => () => executeOrderSubmission(finalCustomerName));
      setPinActionDesc('🔒 Отправка доступна только ответственному за заказы.\nПароль вводится 1 раз на этом телефоне и сохраняется навсегда.');
      setIsPinModalOpen(true);
    }
  };

  const handleNameModalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = nameInput.trim();
    if (!clean) {
      setNameInputError('Пожалуйста, введите имя заказчика');
      return;
    }
    setNameInputError('');
    setCustomerName(clean);
    try {
      localStorage.setItem('armminsk_customer_name', clean);
    } catch (err) {}
    setIsNameModalOpen(false);

    // Right after entering name, proceed directly to sending or authorization
    handleSendOrderClick(clean);
  };

  const totalSum = useMemo(() => {
    return calculateOrderTotalSum(selectedItemsList, products, selectedRestaurant);
  }, [selectedItemsList, products, selectedRestaurant]);

  return (
    <div className="min-h-full flex-1 flex flex-col justify-between bg-[#FAF7EE] pb-24 select-none">
      {/* Top Header Navigation */}
      <div className="sticky top-0 z-30 bg-[#FAF7EE]/95 backdrop-blur-md border-b border-[#E2D8C3] shadow-xs">
        <div className="w-full px-3 py-2.5 flex items-center justify-between">
          <button
            onClick={() => setCurrentScreen('choice')}
            className="flex items-center gap-1 text-xs font-bold text-stone-700 bg-white px-2.5 py-1.5 rounded-full border border-stone-200 shadow-xs hover:bg-stone-50 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-stone-500" />
            <span>Назад</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-sm">{indicator}</span>
            <span 
              style={{ color: brandColor }}
              className="text-xs sm:text-sm font-black uppercase tracking-tight"
            >
              {restaurantName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isOrdersAdmin ? (
              <button
                onClick={() => logoutRole('orders')}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[11px] font-bold hover:bg-amber-200 active:scale-95 transition-all cursor-pointer"
                title="Режим администратора заказов активен. Нажмите для выхода"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Админ</span>
                <LogOut className="w-3 h-3 text-amber-700 ml-0.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setPendingAction(null);
                  setPinActionDesc('Вход в режим администратора заказов для управления товарами и ценами.');
                  setIsPinModalOpen(true);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-stone-100 text-stone-600 border border-stone-200 rounded-full text-[11px] font-semibold hover:bg-stone-200 active:scale-95 transition-all cursor-pointer"
                title="Войти как администратор заказов"
              >
                <Lock className="w-3 h-3 text-stone-500" />
                <span>Вход</span>
              </button>
            )}

            {/* Voice Mode Toggle Button */}
            <button
              id="btn-voice-mode-toggle"
              type="button"
              onClick={() => {
                playTapSound();
                setIsVoiceOrderMode(!isVoiceOrderMode);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer ${
                isVoiceOrderMode
                  ? 'bg-red-600 text-white shadow-red-200 ring-2 ring-red-400'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border border-[#E2D8C3]'
              }`}
              title={isVoiceOrderMode ? 'Голосовой режим активен (нажмите, чтобы скрыть)' : 'Включить голосовой режим'}
            >
              <Mic className={`w-3.5 h-3.5 ${isVoiceOrderMode ? 'animate-pulse text-white' : 'text-amber-800'}`} />
              <span>{isVoiceOrderMode ? '🎤 Голос' : '🎤 Голос'}</span>
            </button>

            <button
              onClick={() => setCurrentScreen('history')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-[#E2D8C3] text-xs font-bold text-stone-700 shadow-xs active:scale-95 hover:bg-stone-50 cursor-pointer"
              title="История заказов"
            >
              <History className="w-3.5 h-3.5 text-stone-500" />
              <span>История</span>
              {orders.length > 0 && (
                <span className="bg-stone-800 text-white text-[10px] px-1.5 rounded-full font-bold">
                  {orders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Database Connection Status Bar */}
        <div className="px-3 py-1 bg-[#F5EFE0]/80 border-t border-[#E2D8C3] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-stone-600 truncate min-w-0">
            {isDatabaseConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="font-medium text-stone-700 truncate">
                  База: <span className="font-semibold text-stone-900">{connectedEmail || 'подключена'}</span>
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse"></span>
                <span className="font-medium text-amber-900">База не подключена (окно появится при отправке)</span>
              </>
            )}
          </div>
          {isDatabaseConnected && (
            <button
              onClick={() => disconnectDatabase()}
              className="text-[10px] font-bold text-stone-500 hover:text-red-600 underline ml-2 shrink-0 cursor-pointer"
              title="Отключить устройство от базы для проверки окна входа"
            >
              Сменить / Выйти
            </button>
          )}
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 pt-3 flex-1">
        {/* Editing Order Mode Banner */}
        {editingOrderId && (
          <div className="mb-3 p-3 bg-amber-500 text-white rounded-2xl shadow-md flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0">✏️</span>
              <div className="min-w-0">
                <div className="font-extrabold text-xs sm:text-sm truncate">
                  Режим редактирования отправленного заказа
                </div>
                <div className="text-[11px] text-amber-100 font-medium">
                  Изменения сохранятся в этот же заказ без дубликатов (до 07:00 утра)
                </div>
              </div>
            </div>
            <button
              onClick={cancelEditingOrder}
              className="px-3 py-1.5 bg-black/20 hover:bg-black/30 active:scale-95 text-white rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer"
            >
              Отмена
            </button>
          </div>
        )}

        {/* Banner: Ready Order for Today with Copy & Open buttons */}
        {todayOrderForThisRestaurant && !editingOrderId && (
          <div className="mb-3 p-3 sm:p-3.5 bg-[#F0FDF4] border-2 border-emerald-400 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0">📋</span>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5 flex-wrap">
                  <span>Заказ на сегодня сформирован</span>
                  {todayOrderForThisRestaurant.orderNumber && (
                    <span className="font-mono text-xs text-[#A01B24] bg-white px-2 py-0.5 rounded border border-[#FED7D7]">
                      № {todayOrderForThisRestaurant.orderNumber}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-emerald-700">
                    ({todayOrderForThisRestaurant.totalPositions} поз., {todayOrderForThisRestaurant.time})
                  </span>
                </div>
                <div className="text-[11px] text-stone-600 font-medium">
                  Готов для закупки и отправки в чат Telegram
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  copyOrderToClipboard(todayOrderForThisRestaurant, products);
                  setCopiedTodayOrderId(todayOrderForThisRestaurant.id);
                  setTimeout(() => setCopiedTodayOrderId(null), 2500);
                }}
                className="flex-1 sm:flex-initial py-2 px-3 rounded-xl bg-sky-50 border border-sky-300 text-sky-900 font-extrabold text-xs hover:bg-sky-100 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Скопировать готовый заказ для Telegram"
              >
                {copiedTodayOrderId === todayOrderForThisRestaurant.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span className="text-emerald-700">Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-sky-700" />
                    <span>Скопировать заказ</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveOrderForView(todayOrderForThisRestaurant);
                  setCurrentScreen('paper_view');
                }}
                className="flex-1 sm:flex-initial py-2 px-3 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs hover:bg-stone-50 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                title="Открыть бланк готового заказа"
              >
                <span>Открыть заказ →</span>
              </button>
            </div>
          </div>
        )}

        {/* Paper Order Sheet Container */}
        <div className="bg-[#FFFDF8] rounded-3xl border border-[#E2D8C3] shadow-md p-3 sm:p-5 overflow-hidden">
          {/* Restaurant Banner Logo */}
          <div className="flex justify-center py-2">
            <LogoGolodnyyTurist className="w-24 h-24 sm:w-28 sm:h-28" />
          </div>

          {/* Automatic Date & Time Block */}
          <div className="mt-2.5 py-2 px-3 bg-[#F8F3E5] rounded-xl border border-[#E8DFC8] flex items-center justify-between text-xs font-bold text-stone-800">
            <div className="flex items-center gap-1">
              <span className="text-stone-500">Дата:</span>
              <span className="text-stone-900 font-extrabold">{currentDateString}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-stone-500">Время:</span>
              <span className="font-mono font-extrabold text-stone-900">{currentTimeString}</span>
            </div>
          </div>

          {/* Toast Notification Banner for Newly Added or Updated Product */}
          {justAddedNotification && (
            <div className="mt-2.5 p-3 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-200 shrink-0 stroke-[3]" />
                <span>{justAddedNotification}</span>
              </div>
              <button
                onClick={() => setJustAddedNotification(null)}
                className="text-emerald-200 hover:text-white ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Voice Order Assistant Bar */}
          {isVoiceOrderMode && (
            <VoiceOrderBar
              products={products}
              selectedRestaurant={selectedRestaurant}
              currentCategory={selectedCategory}
              onNavigateCategory={handleVoiceNavigateCategory}
              onAddItem={handleVoiceAddItem}
              onOpenAddProduct={handleOpenAddProduct}
              isVoiceActive={isVoiceOrderMode}
              onToggleVoiceActive={() => setIsVoiceOrderMode(false)}
            />
          )}

          {/* Search and Filter Row */}
          <div className="mt-3 flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или синонимам..."
                className="w-full pl-9 pr-7 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs sm:text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowOnlySelected(!showOnlySelected)}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                showOnlySelected
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <span>Выбранные ({selectedCount})</span>
            </button>
          </div>

          {/* Category Filter Chips */}
          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all border ${
                selectedCategory === 'all'
                  ? 'bg-amber-900 text-white border-amber-900 shadow-2xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              Все товары
            </button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all border flex items-center gap-1 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-900 text-white border-amber-900 shadow-2xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Table Header: Название гибкое (flex-1), Кол-во/Ед фиксированное (134px sm:155px), Сумма фиксированная (68px sm:80px) */}
          <div className="mt-3 flex items-center justify-between py-2 px-1 sm:px-2 bg-[#F3ECE0] rounded-xl text-[11px] font-bold uppercase tracking-wider text-stone-600 border border-[#E5DCBE]">
            <div className="flex-1 min-w-0 pl-1">
              Товар
            </div>
            <div className="w-[134px] sm:w-[155px] shrink-0 text-center">
              Кол-во / Ед.
            </div>
            <div className="w-[68px] sm:w-[80px] shrink-0 text-center pr-0.5">
              Сумма
            </div>
          </div>

          {/* Product Rows List with Dashed Separators */}
          <div className="divide-y divide-dashed divide-[#D5CBAF] min-h-[320px]">
            {filteredProducts.length === 0 ? (
              <div className="py-10 text-center px-3">
                {searchQuery.trim() ? (
                  <div className="max-w-sm mx-auto p-4 bg-amber-50/90 border border-amber-200 rounded-2xl shadow-xs">
                    <p className="text-xs font-bold text-stone-800">
                      Товар <span className="font-black text-amber-950">«{searchQuery.trim()}»</span> не найден в каталоге
                    </p>
                    <p className="text-[11px] text-stone-600 mt-1 mb-3">
                      Администратор может добавить его в каталог с помощью кнопки ниже (требуется PIN).
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddProduct(searchQuery.trim())}
                      className="w-full py-2.5 px-3 bg-[#2A1E17] hover:bg-[#3E2C22] active:scale-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-amber-300 stroke-[3]" />
                      <span>Добавить «{searchQuery.trim()}» в каталог</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-stone-500">
                      {showOnlySelected 
                        ? 'Нет выбранных продуктов. Укажите количество в списке.' 
                        : 'Продукты не найдены в этой категории.'}
                    </p>
                    {showOnlySelected && (
                      <button
                        onClick={() => setShowOnlySelected(false)}
                        className="mt-2 text-xs font-bold text-amber-800 underline"
                      >
                        Показать все продукты
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              filteredProducts.map((product) => {
                const item = orderItems[product.id];
                const isSelected = Boolean(item && Number(item.quantity) > 0);
                const currentQty = item ? item.quantity : '';
                const currentUnit = getProductUnit(product);
                const currentSum = getProductSum(product);
                const step = getQuantityStep(product);
                const restPrice = product.pricesByRestaurant?.[selectedRestaurant] || product.defaultPrice || '';
                const hasPrice = Boolean(restPrice && parseFloat(restPrice) > 0);
                const needsPriceConfirmation = !hasPrice || product.priceStatus === 'needs_confirmation';

                return (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between py-2 px-1 sm:px-1.5 transition-colors gap-1 sm:gap-2 ${
                      isSelected ? 'bg-amber-50/60 rounded-xl' : 'hover:bg-stone-50/60'
                    }`}
                  >
                    {/* [НАЗВАНИЕ ТОВАРА: гибкое flex-1, перенос строк, без вылезания] */}
                    <div className="flex-1 min-w-0 pr-1 flex items-center gap-1.5 text-left">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="text-base sm:text-lg select-none shrink-0 leading-none hover:scale-110 transition-transform cursor-pointer"
                        title="Редактировать карточку товара"
                      >
                        {product.icon || '📦'}
                      </button>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleEditProduct(product)}
                          className="font-bold text-stone-900 text-xs sm:text-[13px] leading-tight break-words whitespace-normal hover:text-amber-900 text-left cursor-pointer"
                          title="Редактировать карточку товара"
                        >
                          {product.name}
                        </button>
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          {needsPriceConfirmation ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenQuickPrice(product);
                              }}
                              className="text-[10px] font-bold text-amber-900 bg-amber-200/90 hover:bg-amber-300 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 cursor-pointer transition-transform active:scale-95 shadow-2xs"
                              title="Нажмите, чтобы ввести и сохранить цену товара"
                            >
                              ⚠️ {product.priceRangeNote || 'Указать цену'}
                            </button>
                          ) : hasPrice ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenQuickPrice(product);
                              }}
                              className="text-[10px] text-stone-600 hover:text-stone-900 hover:bg-stone-200/80 bg-stone-100 font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="Нажмите, чтобы изменить цену за 1 ед."
                            >
                              <span>{restPrice} ₽/{currentUnit}</span>
                              <span className="text-[9px] text-stone-400">✎</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenQuickPrice(product);
                              }}
                              className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 cursor-pointer transition-colors"
                              title="Нажмите, чтобы задать цену товара"
                            >
                              ＋ Указать цену
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* [КОЛИЧЕСТВО / ЕД.: 134px sm:155px shrink-0, никогда не наезжает на сумму] */}
                    <div className="w-[134px] sm:w-[155px] shrink-0 flex items-center justify-center gap-0.5 sm:gap-1">
                      {/* Узкая кнопка минус */}
                      <button
                        type="button"
                        onClick={() => handleQuantityIncrement(product, -step)}
                        className={`w-6 h-7.5 rounded-md flex items-center justify-center border transition-all shrink-0 p-0 ${
                          isSelected
                            ? 'bg-white border-stone-300 text-stone-800 shadow-2xs hover:bg-stone-100 active:scale-95'
                            : 'bg-stone-100 border-stone-200 text-stone-300 opacity-40 cursor-not-allowed'
                        }`}
                        disabled={!isSelected}
                        title={`Уменьшить на ${step}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      {/* Поле ввода количества */}
                      <input
                        type="number"
                        step="any"
                        min="0"
                        inputMode="decimal"
                        value={currentQty}
                        onChange={(e) => handleDirectQuantityChange(product, e.target.value)}
                        placeholder="0"
                        className={`w-10 sm:w-13 h-7.5 text-center font-bold text-xs sm:text-sm rounded-md border transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                          isSelected
                            ? 'bg-white border-amber-400 text-stone-900 shadow-2xs'
                            : 'bg-stone-50 border-stone-200 text-stone-400'
                        }`}
                      />

                      {/* Узкая кнопка плюс */}
                      <button
                        type="button"
                        onClick={() => handleQuantityIncrement(product, step)}
                        className="w-6 h-7.5 rounded-md bg-stone-900 hover:bg-stone-800 active:scale-95 text-white flex items-center justify-center shadow-2xs transition-all shrink-0 p-0"
                        title={`Увеличить на ${step}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      {/* Селектор единиц измерения - строгая ширина, без наложения на сумму */}
                      <select
                        value={currentUnit}
                        onChange={(e) => handleUnitChange(product, e.target.value)}
                        className="w-9 sm:w-11 h-7.5 text-[11px] font-bold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-md px-0.5 text-center focus:outline-none focus:border-amber-500 cursor-pointer shrink-0"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* [СУММА: 68px sm:80px shrink-0, гарантированное место, авто-расчет количество × цена] */}
                    <div className="w-[68px] sm:w-[80px] shrink-0 flex items-center justify-center pr-0.5">
                      <div className="relative w-full">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={currentSum}
                          onChange={(e) => handleSumChange(product, e.target.value)}
                          placeholder="—"
                          className={`w-full h-7.5 text-center font-bold text-xs sm:text-sm rounded-md border transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                            isSelected && currentSum
                              ? 'bg-white border-amber-400 text-stone-900 shadow-2xs'
                              : 'bg-stone-50 border-stone-200 text-stone-700'
                          }`}
                          title="Сумма (₽)"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Add Product Button */}
          <div className="mt-4 pt-3 border-t-2 border-stone-800 flex flex-col gap-2">
            <button
              onClick={() => handleOpenAddProduct()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-dashed border-amber-800/60 rounded-2xl font-black text-amber-900 text-xs sm:text-sm hover:bg-amber-50 active:scale-98 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-800 stroke-[3]" />
              <span>＋ Добавить новый товар в каталог и заказ</span>
            </button>
            <p className="text-[11px] text-center text-stone-500 font-medium">
              Каталог и цены сохраняются для ресторана «{restaurantName}»
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Send Bar for Mobile */}
      <div className="sticky bottom-[54px] sm:bottom-[60px] z-20 bg-[#FFFDF8]/95 backdrop-blur-md border-t border-[#E2D8C3] p-3 shadow-xl mt-4">
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">
                Выбрано:
              </div>
              <div className="text-lg font-black text-stone-900 leading-none">
                {selectedCount} <span className="text-xs font-bold text-stone-500">поз.</span>
              </div>
            </div>

            {totalSum > 0 && (
              <div className="pl-3 border-l border-stone-300">
                <div className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">
                  Сумма:
                </div>
                <div className="text-base sm:text-lg font-black text-stone-900 leading-none">
                  {totalSum.toLocaleString('ru-RU')} <span className="text-xs font-bold text-stone-500">₽</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {selectedCount > 0 && (
              <button
                onClick={handleClearAll}
                className="p-2.5 text-stone-500 hover:text-red-600 rounded-xl bg-stone-100 border border-stone-200 active:scale-95 transition-all cursor-pointer"
                title="Очистить выбранное"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleFinishOrder}
              disabled={selectedCount === 0}
              style={{ backgroundColor: brandColor }}
              className="py-3 px-5 sm:px-6 rounded-xl text-white font-extrabold text-sm shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Готово</span>
              {selectedCount > 0 && (
                <span className="bg-white/25 px-2 py-0.5 rounded-full text-xs font-black">
                  {selectedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialName={addProductPresetName}
        selectedRestaurant={selectedRestaurant}
        onSave={(newProd, quantity) => {
          if (editingProduct) {
            updateProduct(editingProduct.id, newProd);
            setJustAddedNotification(`✓ Товар «${newProd.name}» обновлен в каталоге`);
          } else {
            const added = addProduct(newProd, quantity);
            setJustAddedNotification(
              quantity && quantity > 0
                ? `✓ Товар «${added.name}» (${quantity} ${added.defaultUnit}) добавлен в заказ!`
                : `✓ Товар «${added.name}» сохранен в каталоге ресторана «Голодный Турист»!`
            );
          }
          setTimeout(() => setJustAddedNotification(null), 4000);
        }}
        onDelete={(id) => deleteProduct(id)}
        editingProduct={editingProduct}
      />

      <OrderPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        onProceedToSend={() => {
          setIsPreviewModalOpen(false);
          handleSendOrderClick();
        }}
      />

      {/* Mandatory Pre-Send Order Review Confirmation Modal */}
      {isReviewConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] rounded-3xl border-2 border-[#E2D8C3] max-w-md w-full shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div 
                style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0"
              >
                {indicator}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#2A1E17] leading-tight">
                  Проверьте заказ
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Убедитесь в правильности указанных позиций перед отправкой
                </p>
              </div>
            </div>

            {/* Order Summary Specs (Requirement 13) */}
            <div className="bg-[#F8F4EA] rounded-2xl p-3.5 border border-[#E8DFC8] space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500 font-medium">Ресторан:</span>
                <span className="font-extrabold text-stone-900 text-sm" style={{ color: brandColor }}>
                  {indicator} {restaurantName}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500 font-medium">Заказчик:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-stone-900">
                    {customerName.trim() || '—'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(customerName);
                      setNameInputError('');
                      setIsReviewConfirmOpen(false);
                      setIsNameModalOpen(true);
                    }}
                    className="text-[11px] text-amber-800 font-bold hover:underline cursor-pointer"
                  >
                    (изменить)
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500 font-medium">Дата:</span>
                <span className="font-bold text-stone-800">
                  {currentDateString}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500 font-medium">Время:</span>
                <span className="font-bold text-stone-800">
                  {currentTimeString}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-500 font-medium">Позиций:</span>
                <span className="font-black text-stone-900 bg-white px-2.5 py-0.5 rounded-full border border-stone-200">
                  {selectedCount}
                </span>
              </div>
            </div>

            {/* Quick preview of selected items */}
            <div className="max-h-44 overflow-y-auto rounded-xl border border-stone-200 bg-white divide-y divide-stone-100 p-1">
              {selectedItemsList.map((item, idx) => (
                <div key={item.productId || idx} className="p-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800 truncate pr-2">
                    {idx + 1}. {item.name}
                  </span>
                  <span className="font-mono font-black text-stone-900 shrink-0 bg-stone-100 px-2 py-0.5 rounded">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCopyCurrentOrder}
                className="w-full py-2.5 px-3 rounded-xl bg-sky-50 border border-sky-300 text-sky-900 font-extrabold text-xs sm:text-sm hover:bg-sky-100 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                title="Скопировать сформированный заказ для Telegram"
              >
                {isCopiedCurrent ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span className="text-emerald-700">Заказ скопирован для Telegram!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-sky-700" />
                    <span>Скопировать заказ</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReviewConfirmOpen(false)}
                  className="py-3 px-3 rounded-xl border border-stone-300 bg-white text-stone-700 font-bold text-xs hover:bg-stone-50 active:scale-95 transition-all cursor-pointer text-center"
                >
                  Вернуться
                </button>
                <button
                  type="button"
                  onClick={() => handleSendOrderClick()}
                  style={{ backgroundColor: brandColor }}
                  className="py-3 px-3 rounded-xl text-white font-black text-xs shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {!isOrdersAdmin ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                  <span>Отправить заказ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mandatory Customer Name */}
      {isNameModalOpen && (
        <div
          id="name-required-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsNameModalOpen(false);
          }}
        >
          <div className="bg-[#FFFDF8] rounded-3xl border-2 border-[#E2D8C3] max-w-sm w-full shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div 
                style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0"
              >
                👤
              </div>
              <div>
                <h3 className="text-lg font-black text-[#2A1E17] leading-tight">
                  Имя заказчика
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Пожалуйста, укажите имя того, кто отправляет заказ
                </p>
              </div>
            </div>

            <form onSubmit={handleNameModalSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Ваше имя / Имя ответственного <span className="text-red-600">*</span>
                </label>
                <input
                  id="order-customer-name-input"
                  type="text"
                  autoFocus
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (nameInputError) setNameInputError('');
                  }}
                  placeholder="Например: Арам, Иван, Анна..."
                  className={`w-full px-3.5 py-3 bg-white rounded-xl border-2 font-bold text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all ${
                    nameInputError ? 'border-red-500 bg-red-50/20' : 'border-stone-300 focus:border-amber-600'
                  }`}
                />
                {nameInputError && (
                  <p className="text-xs font-bold text-red-600 mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {nameInputError}
                  </p>
                )}
              </div>

              <div className="bg-[#F8F4EA] rounded-xl p-2.5 border border-[#E8DFC8] text-[11px] text-stone-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Ресторан:</span>
                  <span className="font-bold" style={{ color: brandColor }}>{indicator} {restaurantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Позиций в заказе:</span>
                  <span className="font-extrabold text-stone-900">{selectedCount}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNameModalOpen(false)}
                  className="py-3 px-3 rounded-xl border border-stone-300 bg-white text-stone-700 font-bold text-xs hover:bg-stone-50 active:scale-95 transition-all cursor-pointer text-center"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: brandColor }}
                  className="py-3 px-3 rounded-xl text-white font-black text-xs shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Отправить заказ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Authentication Modal for Orders Admin */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingAction(null);
        }}
        targetRole="orders"
        actionDescription={pinActionDesc || 'Для выполнения этой операции требуется доступ администратора заказов.'}
        onSuccess={() => {
          authenticateRole('260906', 'orders');
          setIsPinModalOpen(false);
          if (pendingAction) {
            const action = pendingAction;
            setPendingAction(null);
            action();
          }
        }}
      />

      {/* Database Connection Modal for First-time order submission */}
      <DatabaseConnectModal
        isOpen={isDatabaseConnectModalOpen}
        onClose={() => {
          setIsDatabaseConnectModalOpen(false);
          setPendingPostConnectAction(null);
        }}
        onSuccess={() => {
          setIsDatabaseConnectModalOpen(false);
          // If customerName is empty, prefill from saved email
          if (!customerName.trim()) {
            try {
              const savedEmail = localStorage.getItem('armminsk_user_email');
              if (savedEmail) {
                const namePart = savedEmail.split('@')[0];
                setCustomerName(namePart);
                localStorage.setItem('armminsk_customer_name', namePart);
              }
            } catch {}
          }
          if (pendingPostConnectAction) {
            const action = pendingPostConnectAction;
            setPendingPostConnectAction(null);
            action();
          } else {
            setIsReviewConfirmOpen(true);
          }
        }}
        restaurantName={restaurantName}
        indicator={indicator}
        brandColor={brandColor}
      />
    </div>
  );
};
