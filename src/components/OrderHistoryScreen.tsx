import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SavedOrder } from '../types';
import { openPrintableOrderWindow } from '../services/pdfService';
import { getOrderNumber } from '../utils/orderNumber';
import { copyOrderToClipboard } from '../services/deliveryService';
import { PinAuthModal } from './PinAuthModal';
import { 
  ArrowLeft, 
  Search, 
  RotateCcw, 
  FileText, 
  Printer, 
  Trash2, 
  Calendar, 
  Clock, 
  Filter,
  CheckCircle2,
  ChevronRight,
  X,
  User,
  Hash,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  LogOut,
  Edit3
} from 'lucide-react';
import { isOrderEditable, getOrderEditingStatus } from '../utils/orderEditing';
import { calculateOrderTotalSum, getItemSum } from '../utils/orderPricing';
import { sortOrderItems } from '../utils/orderSorting';

export const OrderHistoryScreen: React.FC = () => {
  const { 
    orders, 
    deleteOrder, 
    clearAllOrders,
    repeatOrder, 
    startEditingOrder,
    products,
    setCurrentScreen, 
    setActiveOrderForView,
    isOrdersAdmin,
    authenticateRole,
    logoutRole
  } = useApp();

  const [restaurantFilter, setRestaurantFilter] = useState<'all' | 'armenia' | 'minsk'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pin Auth Modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pinActionDesc, setPinActionDesc] = useState('');

  const handleProtectedAction = (action: () => void, description: string) => {
    if (isOrdersAdmin) {
      action();
    } else {
      setPendingAction(() => action);
      setPinActionDesc(description);
      setIsPinModalOpen(true);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Restaurant filter
      if (restaurantFilter !== 'all' && order.restaurantId !== restaurantFilter) {
        return false;
      }
      // Search query (matches order number, date, time, or product name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (order.orderNumber || getOrderNumber(order, orders)).toLowerCase();
        const matchesNum = num.includes(q);
        const matchesDate = order.date.toLowerCase().includes(q);
        const matchesRestaurant = order.restaurantName.toLowerCase().includes(q);
        const matchesProduct = order.items.some(i => i.name.toLowerCase().includes(q) || i.department.includes(q));
        return matchesNum || matchesDate || matchesRestaurant || matchesProduct;
      }
      return true;
    });
  }, [orders, restaurantFilter, searchQuery]);

  const handleOpenPaperView = (order: SavedOrder) => {
    setActiveOrderForView(order);
    setCurrentScreen('paper_view');
  };

  const handleCopyTelegram = async (order: SavedOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    await copyOrderToClipboard(order, products);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = (order: SavedOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    openPrintableOrderWindow(order, products);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleProtectedAction(() => {
      if (confirm('Удалить эту запись заказа из истории?')) {
        deleteOrder(id);
      }
    }, 'Для удаления записи заказа из истории требуется PIN-код администратора заказов.');
  };

  const handleClearAll = () => {
    handleProtectedAction(() => {
      if (confirm('Удалить ВСЕ заказы из истории? Это действие нельзя отменить.')) {
        clearAllOrders();
      }
    }, 'Для полной очистки истории заявок требуется PIN-код администратора заказов.');
  };

  const handleRepeatOrder = (order: SavedOrder) => {
    handleProtectedAction(() => {
      repeatOrder(order);
    }, 'Для повтора и редактирования прошлых заказов требуется PIN-код администратора заказов.');
  };

  return (
    <div className="min-h-full flex-1 flex flex-col justify-between bg-[#FAF7EE] pb-28 select-none">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FAF7EE]/95 backdrop-blur-md border-b border-[#E2D8C3] shadow-xs">
        <div className="w-full px-3 py-2.5 flex items-center justify-between">
          <button
            onClick={() => setCurrentScreen('order')}
            className="flex items-center gap-1 text-xs font-bold text-stone-700 bg-white px-2.5 py-1.5 rounded-full border border-stone-200 shadow-xs hover:bg-stone-50 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>

          <h2 className="text-sm font-black text-[#2A1E17]">
            История заявок
          </h2>

          <div className="flex items-center gap-2">
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
                  setPinActionDesc('Вход в режим администратора заказов для управления историей и повтором заказов.');
                  setIsPinModalOpen(true);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-stone-100 text-stone-600 border border-stone-200 rounded-full text-[11px] font-semibold hover:bg-stone-200 active:scale-95 transition-all cursor-pointer"
                title="Войти как администратор заказов"
              >
                <Lock className="w-3 h-3 text-stone-500" />
                <span>Вход</span>
              </button>
            )}

            {orders.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full border border-red-200 transition-colors cursor-pointer"
                title="Очистить историю"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить</span>
              </button>
            )}
            <span className="text-xs font-bold bg-[#EFE8D6] text-stone-700 px-2 py-0.5 rounded-full">
              {orders.length}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-3 border border-[#E2D8C3] shadow-xs space-y-3">
          {/* Restaurant Header */}
          <div className="flex items-center justify-between p-2.5 bg-[#F5EFE3] rounded-xl text-xs font-black text-amber-950">
            <div className="flex items-center gap-2">
              <span className="text-base">🧭</span>
              <span>Ресторан «Голодный Турист»</span>
            </div>
            <span className="bg-white/80 px-2 py-0.5 rounded-md text-[11px] font-bold text-stone-700">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'заказ' : 'заказов'}
            </span>
          </div>

          {/* Search field */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по дате, названию продукта или отделу..."
              className="w-full pl-9 pr-8 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs sm:text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-[#E2D8C3] p-8">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-800 text-2xl mb-3">
              📋
            </div>
            <h3 className="text-base font-extrabold text-stone-800">
              {orders.length === 0 ? 'История заказов пуста' : 'Заказы не найдены'}
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
              {orders.length === 0
                ? 'Сформируйте и отправьте первую заявку, и она автоматически сохранится здесь'
                : 'Попробуйте изменить условия поиска или фильтр по ресторану'}
            </p>
            {orders.length === 0 && (
              <button
                onClick={() => setCurrentScreen('order')}
                className="mt-4 px-5 py-2.5 bg-stone-900 text-white text-xs font-extrabold rounded-xl shadow-xs"
              >
                Создать первую заявку
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const brandColor = '#D97706';
              const isExpanded = expandedOrderId === order.id;
              const orderNum = order.orderNumber || getOrderNumber(order, orders);
              const orderTotalSum = order.totalSum !== undefined && order.totalSum > 0
                ? order.totalSum
                : calculateOrderTotalSum(order.items, products, order.restaurantId);
              const now = new Date();
              const isEditable = isOrderEditable(order, now);
              const editStatus = getOrderEditingStatus(order, now);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-[#E0D6BE] shadow-xs overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Order Summary Card Header */}
                  <div
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className="p-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-mono text-xs font-black text-[#A01B24] bg-[#FFF3F3] px-2 py-0.5 rounded-md border border-[#FED7D7]">
                          № {orderNum}
                        </span>
                        <span className="text-base leading-none">{order.indicator}</span>
                        <span 
                          style={{ color: brandColor }}
                          className="font-black text-sm uppercase tracking-wide"
                        >
                          {order.restaurantName}
                        </span>
                        <span className="text-xs font-extrabold text-stone-800 bg-[#FAF4E5] px-2 py-0.5 rounded-md border border-[#E5DCBE]">
                          {order.totalPositions} позиций
                        </span>
                        {orderTotalSum > 0 && (
                          <span className="text-xs font-black text-amber-950 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300">
                            💰 {orderTotalSum.toLocaleString('ru-RU')} ₽
                          </span>
                        )}
                        {order.isEdited && (
                          <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200" title={`Отредактировано в ${order.updatedAt}`}>
                            ✏️ Изменён {order.updatedAt ? `в ${order.updatedAt}` : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {order.fulfillmentStatus === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                            🟢 Выполнен
                          </span>
                        ) : order.fulfillmentStatus === 'in_progress' || order.fulfillmentStatus === 'partially_completed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                            🟡 В работе
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                            ⚪ Создан
                          </span>
                        )}
                        <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 font-medium">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{order.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span className="font-mono">{order.time}</span>
                        </div>
                        {order.completedAt && (
                          <div className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Завершён: {order.completedAt}
                          </div>
                        )}
                        {order.customerName && (
                          <div className="flex items-center gap-1 text-stone-700 font-bold bg-[#F4EEDF] px-2 py-0.5 rounded-md border border-[#E5DBBF]">
                            <User className="w-3 h-3 text-stone-500" />
                            <span>{order.customerName}</span>
                          </div>
                        )}
                      </div>

                      {order.sentChannels && order.sentChannels.length > 0 && (
                        <div className="flex items-center gap-1">
                          {order.sentChannels.map((ch) => (
                            <span 
                              key={ch} 
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                ch === 'telegram' 
                                  ? 'bg-sky-50 text-sky-800 border border-sky-200' 
                                  : 'text-stone-600 bg-stone-100'
                              }`}
                            >
                              {ch === 'telegram' ? '✈️ Telegram' : ch}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Preview product icons row */}
                    <div className="mt-3 flex items-center gap-1.5 overflow-x-auto py-1">
                      {order.items.slice(0, 8).map((item, i) => (
                        <span key={i} className="text-lg bg-stone-50 p-1 rounded border border-stone-200 shrink-0" title={`${item.name} (${item.quantity} ${item.unit})`}>
                          {item.icon || '📦'}
                        </span>
                      ))}
                      {order.items.length > 8 && (
                        <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded">
                          +{order.items.length - 8}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details Section */}
                  {isExpanded && (
                    <div className="border-t border-[#E8DFC8] bg-[#FFFDF9] p-4">
                      {/* Products table in order */}
                      <div className="divide-y divide-dashed divide-[#D5CBAF] pb-3 text-xs">
                        {sortOrderItems(order.items || [], products, order.restaurantId).map((item, idx) => {
                          const prod = products.find(p => p.id === item.productId || p.name === item.name);
                          const itemSum = getItemSum(item, prod, order.restaurantId);
                          return (
                            <div key={idx} className="py-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{item.icon || '📦'}</span>
                                <span className="font-bold text-stone-900">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3">
                                <span className="font-extrabold text-stone-800">
                                  {item.quantity} {item.unit}
                                </span>
                                {itemSum > 0 && (
                                  <span className="font-mono font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 text-[11px]">
                                    {itemSum} ₽
                                  </span>
                                )}
                                <span className="text-stone-500 font-semibold bg-stone-100 px-1.5 py-0.5 rounded">
                                  отд. {item.department}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total positions count and Grand Total Sum */}
                      <div className="my-3 p-3 bg-amber-50/90 rounded-xl border border-amber-200/90 flex items-center justify-between">
                        <div className="text-xs font-bold text-stone-700">
                          Позиций: <span className="text-stone-900 font-black">{order.items?.length || 0}</span>
                        </div>
                        <div className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                          <span>💰 ИТОГО:</span>
                          <span className="text-amber-950 text-base font-extrabold">{orderTotalSum.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      </div>

                      {/* Edit Button: Active until 07:00 AM, grey and inactive afterwards */}
                      <div className="mb-3">
                        {isEditable ? (
                          <button
                            onClick={() => startEditingOrder(order)}
                            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                            title={`Редактирование доступно до ${editStatus.deadlineText}`}
                          >
                            <Edit3 className="w-4 h-4 stroke-[2.5]" />
                            <span>✏️ Редактировать заказ</span>
                            <span className="text-[11px] opacity-90 font-medium">({editStatus.deadlineText})</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2.5 px-4 rounded-xl bg-stone-100 border border-stone-200 text-stone-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed select-none"
                            title="Редактирование закрыто в 07:00 утра следующего дня"
                          >
                            <Edit3 className="w-4 h-4 text-stone-400" />
                            <span>✏️ Редактировать заказ</span>
                            <span className="text-[11px] text-stone-400 font-medium">(закрыто в 07:00)</span>
                          </button>
                        )}
                      </div>

                      {/* Action buttons bar */}
                      <div className="pt-3 border-t border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Copy for Telegram button (Requirement 17) */}
                        <button
                          onClick={(e) => handleCopyTelegram(order, e)}
                          className="py-2.5 px-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 font-extrabold text-xs hover:bg-sky-100 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Скопировать заказ для отправки в Telegram"
                        >
                          {copiedId === order.id ? (
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

                        {/* Repeat Order Button */}
                        <button
                          onClick={() => handleRepeatOrder(order)}
                          style={{ backgroundColor: brandColor }}
                          className="py-2.5 px-3 rounded-xl text-white font-extrabold text-xs shadow-xs hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Создать новый заказ с теми же продуктами"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Повторить</span>
                        </button>

                        {/* Open Paper Sheet */}
                        <button
                          onClick={() => handleOpenPaperView(order)}
                          className="py-2.5 px-3 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs hover:bg-stone-50 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-800" />
                          <span>Бланк</span>
                        </button>

                        {/* Print / PDF */}
                        <button
                          onClick={(e) => handlePrint(order, e)}
                          className="py-2.5 px-3 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs hover:bg-stone-50 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>PDF / Печать</span>
                        </button>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={(e) => handleDelete(order.id, e)}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Удалить запись</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

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
          setIsPinModalOpen(false);
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
      />
    </div>
  );
};
