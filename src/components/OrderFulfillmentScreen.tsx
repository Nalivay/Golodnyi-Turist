import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  buildCombinedProductList, 
  getOrderProgress, 
  formatHeaderDate, 
  parseQuantity, 
  isOrderToday,
  CombinedProductItem 
} from '../utils/orderFulfillment';
import { SavedOrder, RestaurantId, Product } from '../types';
import { playTapSound, playToggleSound, playSuccessSound } from '../utils/audio';
import { sortOrderItems, groupOrderItemsByDepartment } from '../utils/orderSorting';
import { 
  ShoppingCart, 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Check, 
  PartyPopper, 
  Layers, 
  UtensilsCrossed, 
  Clock, 
  AlertCircle,
  RotateCcw,
  Search,
  Sparkles
} from 'lucide-react';

export const OrderFulfillmentScreen: React.FC = () => {
  const { 
    orders, 
    products,
    setCurrentScreen, 
    toggleOrderItemPurchased, 
    toggleCombinedItemPurchased, 
    completeOrderFulfillment,
    reopenOrderFulfillment,
    completeAllTodayOrders,
    reopenAllTodayOrders,
  } = useApp();

  // Search inside items
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation modal state for single order
  const [orderToConfirmComplete, setOrderToConfirmComplete] = useState<SavedOrder | null>(null);
  // Confirmation modal state for entire combined order
  const [confirmCompleteAllModal, setConfirmCompleteAllModal] = useState(false);

  // Today's orders (active and completed)
  const todayDate = useMemo(() => new Date(), []);
  
  const todayOrders = useMemo(() => {
    return orders.filter(o => isOrderToday(o, todayDate));
  }, [orders, todayDate]);

  // Separate active (uncompleted) vs completed
  const activeOrders = useMemo(() => {
    return todayOrders.filter(o => o.fulfillmentStatus !== 'completed');
  }, [todayOrders]);

  const completedOrders = useMemo(() => {
    return todayOrders.filter(o => o.fulfillmentStatus === 'completed');
  }, [todayOrders]);

  // Distinct restaurants active today
  const activeRestaurantIds = useMemo(() => {
    const set = new Set<RestaurantId>();
    activeOrders.forEach(o => set.add(o.restaurantId));
    return Array.from(set);
  }, [activeOrders]);

  // All restaurants with orders today (active or completed)
  const allRestaurantIdsToday = useMemo(() => {
    const set = new Set<RestaurantId>();
    todayOrders.forEach(o => set.add(o.restaurantId));
    return Array.from(set);
  }, [todayOrders]);

  // Single unified fulfillment list for Golodnyy Turist
  const allCompletedToday = todayOrders.length > 0 && activeOrders.length === 0;

  // Combined product list across active orders (or all today orders if all completed)
  const combinedProducts = useMemo(() => {
    const sourceOrders = activeOrders.length > 0 ? activeOrders : todayOrders;
    return buildCombinedProductList(sourceOrders);
  }, [activeOrders, todayOrders]);

  // Overall metrics across all active orders today
  const overallMetrics = useMemo(() => {
    const targetOrders = activeOrders.length > 0 ? activeOrders : todayOrders;
    let totalItems = 0;
    let purchasedItems = 0;

    targetOrders.forEach(order => {
      (order.items || []).forEach(item => {
        if (parseQuantity(item.quantity) > 0) {
          totalItems++;
          if (item.purchased) {
            purchasedItems++;
          }
        }
      });
    });

    const percent = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;
    const isComplete = totalItems > 0 && purchasedItems === totalItems;
    return { totalItems, purchasedItems, percent, isComplete };
  }, [activeOrders, todayOrders]);

  // Filtered combined products by search
  const filteredCombinedProducts = useMemo(() => {
    if (!searchQuery.trim()) return combinedProducts;
    const q = searchQuery.toLowerCase().trim();
    return combinedProducts.filter(p => 
      p.name.toLowerCase().includes(q)
    );
  }, [combinedProducts, searchQuery]);

  return (
    <div className="w-full flex-1 flex flex-col pb-28 select-none">
      {/* Top App Header */}
      <header className="sticky top-0 z-20 bg-[#FFFDF8]/95 backdrop-blur-md border-b border-[#E2D8C3] px-3.5 sm:px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCurrentScreen('choice')}
              className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full border border-[#E2D8C3] text-stone-700 active:scale-95 transition-all cursor-pointer"
              title="Назад"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#15803D]" />
                <h1 className="text-base sm:text-lg font-black text-[#2A1E17] leading-none">
                  Выполнить заказ
                </h1>
              </div>
              <p className="text-[11px] font-bold text-stone-500 mt-0.5">
                Сегодня, {formatHeaderDate(todayDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeRestaurantIds.length > 0 && (
              <span className="bg-[#15803D] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs">
                {activeRestaurantIds.length === 1 ? '1 ресторан' : '2 ресторана'}
              </span>
            )}
            {allCompletedToday && (
              <span className="bg-[#15803D] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> Выполнено
              </span>
            )}
          </div>
        </div>

        {/* Global Progress Bar (if orders exist today) */}
        {todayOrders.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-[#EAE2CE]">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-1.5">
              <span>
                {allRestaurantIdsToday.length === 1 
                  ? '1 ресторан' 
                  : `${allRestaurantIdsToday.length} ресторана`} · {overallMetrics.totalItems} позиций
              </span>
              <span className="font-extrabold text-[#15803D]">
                Куплено: {overallMetrics.purchasedItems} из {overallMetrics.totalItems} ({overallMetrics.percent}%)
              </span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#15803D] to-[#22C55E] rounded-full transition-all duration-300"
                style={{ width: `${overallMetrics.percent}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 sm:p-4 space-y-4">
        {/* State: No Orders Created Today */}
        {todayOrders.length === 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2D8C3] shadow-xs text-center space-y-4 my-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <ShoppingCart className="w-8 h-8 opacity-70" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#2A1E17]">
                На сегодня пока нет активных заказов
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-sm mx-auto">
                Повар кухни сформирует заказ в приложении, и позиции автоматически появятся в этом разделе для закупки.
              </p>
            </div>
            <button
              onClick={() => setCurrentScreen('choice')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2A1E17] text-[#FAF7EE] text-xs font-black rounded-2xl shadow-sm hover:bg-stone-800 transition-all cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Перейти к составлению заказа</span>
            </button>
          </div>
        )}

        {/* State: All orders completed celebration banner */}
        {allCompletedToday && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl flex-shrink-0">
              <PartyPopper className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-emerald-900 leading-tight">
                🎉 Все заказы на сегодня выполнены
              </h3>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                Все необходимые продукты закуплены и успешно распределены по ресторанам.
              </p>
            </div>
          </div>
        )}

        {/* Unified Order Header for Golodnyy Turist */}
        {todayOrders.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-[#EAE2CE] rounded-2xl text-xs font-black text-amber-950">
            <div className="flex items-center gap-2">
              <span className="text-base">🧭</span>
              <span>Ресторан «Голодный Турист» • Закупка</span>
            </div>
            <span className="bg-white/80 px-2.5 py-1 rounded-xl text-[11px] font-bold text-stone-700">
              {combinedProducts.length} позиций
            </span>
          </div>
        )}

        {/* Search Input for Long Lists */}
        {todayOrders.length > 0 && combinedProducts.length > 5 && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Быстрый поиск по названию..."
              className="w-full pl-9 pr-4 py-2 bg-white rounded-2xl border border-[#E2D8C3] text-xs font-semibold placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#15803D]"
            />
          </div>
        )}

        {/* 🛒 ОБЩИЙ СПИСОК ЗАКУПКИ ДЛЯ «ГОЛОДНОГО ТУРИСТА» */}
        {todayOrders.length > 0 && (
          <div className="space-y-3">
            <div className="bg-[#FFFDF8] border border-[#E2D8C3] rounded-2xl p-3 flex items-start gap-2.5 text-xs text-stone-700">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-stone-900">Объединённый список закупки:</span>{' '}
                Одинаковые товары с нескольких кухонь объединены в общую массу. Закупщик проходит по магазину один раз! Отметка позиции здесь отмечает её сразу во всех заказах.
              </div>
            </div>

            {filteredCombinedProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-2xl border border-[#E2D8C3]">
                Позиции не найдены
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCombinedProducts.map(product => {
                  const isBought = product.allPurchased;
                  const isPartial = product.somePurchased && !product.allPurchased;

                  return (
                    <div
                      key={product.key}
                      onClick={() => {
                        playToggleSound();
                        toggleCombinedItemPurchased(product.key);
                      }}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isBought
                          ? 'bg-emerald-50/70 border-emerald-200 text-stone-500'
                          : isPartial
                          ? 'bg-amber-50/70 border-amber-200 text-stone-900 shadow-xs'
                          : 'bg-white border-[#E2D8C3] hover:border-stone-400 text-stone-900 shadow-xs active:scale-99'
                      }`}
                    >
                      {/* Checkbox & Item details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          className="flex-shrink-0 cursor-pointer"
                          aria-label={isBought ? 'Отмечено' : 'Купить'}
                        >
                          {isBought ? (
                            <div className="w-7 h-7 rounded-xl bg-[#15803D] text-white flex items-center justify-center shadow-xs">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          ) : isPartial ? (
                            <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-xl border-2 border-stone-400 bg-white hover:border-stone-600 transition-colors" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xl leading-none">{product.icon}</span>
                            <span 
                              className={`text-sm sm:text-base font-black truncate ${
                                isBought ? 'line-through text-stone-400' : 'text-[#2A1E17]'
                              }`}
                            >
                              {product.name}
                            </span>
                          </div>

                          {/* Restaurant breakdown shares */}
                          {product.shares.length > 1 && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] font-semibold text-stone-600">
                              {product.shares.map((share, idx) => (
                                <span 
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md border bg-amber-50 border-amber-200 text-amber-900"
                                >
                                  🧭 {share.restaurantName}: {share.quantity} {share.unit}{' '}
                                  {share.purchased ? '✓' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Total Aggregated Volume */}
                      <div className="flex-shrink-0 text-right">
                        <div className={`text-base sm:text-lg font-black ${isBought ? 'text-stone-400 line-through' : 'text-[#2A1E17]'}`}>
                          {product.totalQuantity} <span className="text-xs font-bold text-stone-500">{product.unit}</span>
                        </div>
                        <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                          Общий объём
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Action Card for Combined (Total) Order Completion */}
            <div className="pt-2">
              {allCompletedToday ? (
                <div className="p-4 sm:p-5 bg-emerald-50/80 rounded-3xl border border-emerald-200 shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-emerald-950">
                        Общий заказ выполнен 🟢
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700">
                        Все заказы ресторанов на сегодня завершены
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => reopenAllTodayOrders()}
                    className="py-2.5 px-3 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-xs hover:bg-emerald-100/50 transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0 shadow-2xs"
                    title="Вернуть заказы в работу"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Вернуть</span>
                  </button>
                </div>
              ) : overallMetrics.isComplete ? (
                <div className="bg-[#FFFDF8] border-2 border-emerald-400 rounded-3xl p-4 sm:p-5 shadow-md space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                      <span className="text-sm font-black text-[#2A1E17]">
                        Все позиции закуплены ({overallMetrics.totalItems} из {overallMetrics.totalItems})
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                      100%
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Все позиции по закупке отмечены. Нажмите для закрытия заказа.
                  </p>
                  <button
                    id="btn-complete-combined-order"
                    onClick={() => setConfirmCompleteAllModal(true)}
                    className="w-full py-3.5 px-4 bg-[#15803D] hover:bg-[#166534] text-white font-black text-sm sm:text-base rounded-2xl shadow-md active:scale-99 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>Завершить заказ</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-[#E2D8C3] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-stone-600 font-bold">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Отметьте все товары для завершения общего заказа</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                      Осталось: {overallMetrics.totalItems - overallMetrics.purchasedItems} из {overallMetrics.totalItems}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal for Completing Order (Requirement 9) */}
      {orderToConfirmComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#FFFDF8] rounded-3xl p-6 border-2 border-[#E2D8C3] shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-[#2A1E17]">
                Завершить заказ ресторана «{orderToConfirmComplete.restaurantName}»?
              </h3>
              <p className="text-xs text-stone-600">
                Все {orderToConfirmComplete.items.length} позиций отмечены как купленные.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToConfirmComplete(null)}
                className="flex-1 py-3 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  playSuccessSound();
                  completeOrderFulfillment(orderToConfirmComplete.id);
                  setOrderToConfirmComplete(null);
                }}
                className="flex-1 py-3 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-black text-xs shadow-md transition-colors cursor-pointer"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Completing Combined (All) Orders */}
      {confirmCompleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#FFFDF8] rounded-3xl p-6 border-2 border-[#E2D8C3] shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-[#2A1E17]">
                Завершить общий заказ?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Будут закрыты все текущие заявки на сегодня:
              </p>
              <div className="space-y-1 py-1">
                <div className="text-xs font-black text-amber-900 bg-amber-50 py-1.5 px-2.5 rounded-xl border border-amber-200">
                  🧭 Ресторан «Голодный Турист» {todayOrders[0]?.orderNumber ? `(№ ${todayOrders[0].orderNumber})` : ''}
                </div>
              </div>
              <p className="text-[11px] text-stone-500">
                Все {overallMetrics.totalItems} позиций будут зафиксированы как купленные, а статусы заказов переведены в «Выполнено 🟢».
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCompleteAllModal(false)}
                className="flex-1 py-3 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  playSuccessSound();
                  completeAllTodayOrders();
                  setConfirmCompleteAllModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-black text-xs shadow-md transition-colors cursor-pointer"
              >
                Завершить всё 🟢
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface RestaurantOrderFulfillmentCardProps {
  orders: SavedOrder[];
  products: Product[];
  restaurantId: RestaurantId;
  restaurantName: string;
  indicator: string;
  brandColor: string;
  onToggleItem: (orderId: string, itemKeyOrProductId: string) => void;
  onCompleteOrder: (order: SavedOrder) => void;
  onReopenOrder: (orderId: string) => void;
}

const RestaurantOrderFulfillmentCard: React.FC<RestaurantOrderFulfillmentCardProps> = ({
  orders,
  products,
  restaurantId,
  restaurantName,
  indicator,
  brandColor,
  onToggleItem,
  onCompleteOrder,
  onReopenOrder,
}) => {
  return (
    <div className="space-y-4">
      {orders.map((order, orderIdx) => {
        const progress = getOrderProgress(order);
        const isCompleted = order.fulfillmentStatus === 'completed';

        return (
          <div
            key={order.id}
            className="bg-white rounded-3xl border border-[#E2D8C3] shadow-xs overflow-hidden"
          >
            {/* Header: Restaurant, Order Number, Creation Date & Time */}
            <div className="p-4 sm:p-5 border-b border-[#EAE2CE] bg-[#FFFDF8]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl leading-none">{indicator}</span>
                  <h2 
                    style={{ color: brandColor }}
                    className="text-lg font-black uppercase tracking-tight"
                  >
                    {restaurantName}
                  </h2>
                  {order.orderNumber && (
                    <span className="font-mono text-xs font-black text-[#A01B24] bg-[#FFF2F2] px-2 py-0.5 rounded-md border border-[#FED7D7]">
                      № {order.orderNumber}
                    </span>
                  )}
                </div>

                {/* Status indicator */}
                <div>
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Выполнено 🟢
                    </span>
                  ) : progress.purchased > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                      В работе 🟡
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
                      Создан ⚪
                    </span>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-3 text-xs font-semibold text-stone-500 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Создан: {order.date} · {order.time}</span>
                </div>
                {order.completedAt && (
                  <div className="text-emerald-700 font-bold">
                    Завершён: {order.completedAt}
                  </div>
                )}
              </div>

              {/* Progress Indicator */}
              <div className="mt-3 pt-2.5 border-t border-stone-200">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-stone-700">
                    Куплено: <span className="font-extrabold text-stone-900">{progress.purchased}</span> из {progress.total}
                  </span>
                  <span 
                    style={{ color: brandColor }}
                    className="font-extrabold"
                  >
                    {progress.percent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden p-0.5">
                  <div 
                    style={{ 
                      width: `${progress.percent}%`,
                      backgroundColor: brandColor 
                    }}
                    className="h-full rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Item List grouped by department */}
            {(() => {
              const deptGroups = groupOrderItemsByDepartment(order.items || [], products, restaurantId);
              if (deptGroups.length === 0) {
                return (
                  <div className="p-6 text-center text-xs text-stone-500">
                    Нет позиций в заказе
                  </div>
                );
              }

              return (
                <div className="p-3 sm:p-4 space-y-3">
                  {deptGroups.map((group) => {
                    const groupPositionsCount = group.items.length;
                    const groupPurchasedCount = group.items.filter((it) => Boolean(it.purchased)).length;
                    const isGroupAllPurchased = groupPurchasedCount === groupPositionsCount && groupPositionsCount > 0;

                    return (
                      <div
                        key={group.rank}
                        className="rounded-2xl border border-stone-200 overflow-hidden bg-white shadow-2xs"
                      >
                        {/* Department header banner */}
                        <div className="bg-[#FAF7EE] border-b border-stone-200 px-3 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none">{group.icon}</span>
                            <span className="text-xs font-black uppercase tracking-wider text-stone-800">
                              {group.rank}. {group.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {groupPurchasedCount > 0 && (
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                  isGroupAllPurchased
                                    ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                                    : "bg-amber-100 border-amber-300 text-amber-900"
                                }`}
                              >
                                {groupPurchasedCount} / {groupPositionsCount} {isGroupAllPurchased ? "✓" : ""}
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-stone-600 bg-white px-2 py-0.5 rounded-full border border-stone-200">
                              {groupPositionsCount} поз.
                            </span>
                          </div>
                        </div>

                        {/* Items in department */}
                        <div className="divide-y divide-stone-100">
                          {group.items.map((item, idx) => {
                            const isBought = Boolean(item.purchased);
                            const itemKey = item.productId || item.name;

                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  if (!isCompleted) {
                                    playToggleSound();
                                    onToggleItem(order.id, itemKey);
                                  }
                                }}
                                className={`py-2.5 px-3 transition-colors flex items-center justify-between gap-3 cursor-pointer select-none ${
                                  isBought 
                                    ? 'bg-emerald-50/60 hover:bg-emerald-100/50 text-stone-400' 
                                    : 'hover:bg-stone-50 text-stone-900'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {/* Checkbox ☐ vs ☑ */}
                                  <button
                                    type="button"
                                    className="flex-shrink-0 cursor-pointer transition-transform active:scale-90"
                                    disabled={isCompleted}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isCompleted) {
                                        playToggleSound();
                                        onToggleItem(order.id, itemKey);
                                      }
                                    }}
                                  >
                                    {isBought ? (
                                      <div className="w-6 h-6 rounded-lg bg-[#15803D] text-white flex items-center justify-center shadow-xs">
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      </div>
                                    ) : (
                                      <div className="w-6 h-6 rounded-lg border-2 border-stone-400 bg-white hover:border-stone-600 transition-colors" />
                                    )}
                                  </button>

                                  <span className={`text-lg leading-none flex-shrink-0 ${isBought ? 'opacity-40' : ''}`}>
                                    {item.icon || '📦'}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <span 
                                      className={`text-xs sm:text-sm font-bold block truncate ${
                                        isBought ? 'line-through text-stone-400' : 'text-[#2A1E17]'
                                      }`}
                                    >
                                      {item.name}
                                    </span>
                                  </div>
                                </div>

                                <div className={`font-mono text-xs sm:text-sm flex-shrink-0 ${
                                  isBought ? 'line-through text-stone-400 font-normal' : 'text-[#2A1E17] font-black'
                                }`}>
                                  {item.quantity} <span className="text-[10px] font-bold text-stone-500">{item.unit}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Bottom Action for Order Completion (Requirement 8 & 9) */}
            <div className="p-4 bg-[#FFFDF8] border-t border-[#EAE2CE]">
              {isCompleted ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-xs sm:text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{restaurantName} — выполнено 🟢</span>
                  </div>
                  <button
                    onClick={() => onReopenOrder(order.id)}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 p-1 hover:underline cursor-pointer"
                    title="Вернуть заказ в работу"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Изменить</span>
                  </button>
                </div>
              ) : progress.isComplete ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100/70 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Все позиции закуплены</span>
                  </div>
                  <button
                    onClick={() => onCompleteOrder(order)}
                    className="w-full py-3 px-4 bg-[#15803D] hover:bg-[#166534] text-white font-black text-sm rounded-2xl shadow-md active:scale-99 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Завершить заказ</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
                  <span>Отметьте все товары для завершения</span>
                  <span>Осталось: {progress.total - progress.purchased}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
