import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LogoGolodnyyTurist } from './Logos';
import { X, Send, Printer, Trash2, Copy, Check } from 'lucide-react';
import { openPrintableOrderWindow } from '../services/pdfService';
import { formatOrderMessage, copyOrderToClipboard } from '../services/deliveryService';
import { SavedOrder, OrderItem } from '../types';
import { calculateOrderTotalSum, getItemSum } from '../utils/orderPricing';
import { sortOrderItems, groupOrderItemsByDepartment, DepartmentGroup } from '../utils/orderSorting';

interface OrderPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToSend: () => void;
}

export const OrderPreviewModal: React.FC<OrderPreviewModalProps> = ({
  isOpen,
  onClose,
  onProceedToSend,
}) => {
  const { 
    selectedRestaurant, 
    orderItems, 
    removeOrderItem, 
    getCurrentFormattedDateTime,
    products
  } = useApp();

  if (!isOpen) return null;

  const restaurantName = 'Ресторан «Голодный Турист»';
  const brandColor = '#D97706';
  const indicator = '🧭';

  const itemsList = useMemo(() => {
    const list = (Object.values(orderItems) as OrderItem[]).filter(item => {
      if (!item) return false;
      const q = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity));
      return !isNaN(q) && q > 0;
    });
    return sortOrderItems(list, products, selectedRestaurant);
  }, [orderItems, products, selectedRestaurant]);
  const totalPositions = itemsList.length;

  const departmentGroups: DepartmentGroup[] = useMemo(() => {
    return groupOrderItemsByDepartment(itemsList, products, selectedRestaurant);
  }, [itemsList, products, selectedRestaurant]);

  const totalSum = useMemo(() => {
    return calculateOrderTotalSum(itemsList, products, selectedRestaurant);
  }, [itemsList, products, selectedRestaurant]);

  const { date, time } = getCurrentFormattedDateTime();
  const [copied, setCopied] = React.useState(false);

  const handleCopyPreview = async () => {
    const tempOrder: SavedOrder = {
      id: `preview-${Date.now()}`,
      restaurantId: selectedRestaurant,
      restaurantName,
      indicator,
      date,
      time,
      timestamp: Date.now(),
      items: itemsList,
      totalPositions,
      status: 'draft',
      sentChannels: ['telegram'],
      messageText: '',
    };
    await copyOrderToClipboard(tempOrder, products);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintPreview = () => {
    const tempOrder: SavedOrder = {
      id: `preview-${Date.now()}`,
      restaurantId: selectedRestaurant,
      restaurantName,
      indicator,
      date,
      time,
      timestamp: Date.now(),
      items: itemsList,
      totalPositions,
      status: 'draft',
      sentChannels: [],
      messageText: '',
    };
    openPrintableOrderWindow(tempOrder);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#FFFDF8] rounded-3xl p-5 sm:p-7 shadow-2xl border-2 border-[#E2D8C3] max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{indicator}</span>
            <span className="text-xs font-black uppercase tracking-wider text-stone-500">
              Предпросмотр заявки
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 rounded-full text-xs font-bold transition-colors cursor-pointer"
              title="Скопировать заказ для отправки в Telegram"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span className="text-emerald-700">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-sky-700" />
                  <span>Скопировать</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrintPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-full text-xs font-bold text-stone-700 transition-colors"
              title="Печать или PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Печать / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper style preview content */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="bg-[#FAF6EC] border border-[#E5DCBE] rounded-2xl p-4 sm:p-5 shadow-inner">
            {/* Restaurant Logo */}
            <div className="flex justify-center pb-2">
              <LogoGolodnyyTurist className="w-20 h-20 sm:w-24 sm:h-24" />
            </div>

            <div className="text-center mt-2 border-b border-dashed border-[#D2C7AA] pb-3">
              <h2 
                style={{ color: brandColor }}
                className="text-lg sm:text-xl font-black uppercase tracking-wider"
              >
                {restaurantName}
              </h2>
              <div className="text-sm font-extrabold text-stone-800">
                Заказ продуктов
              </div>
              <div className="flex items-center justify-center gap-3 text-xs font-semibold text-stone-600 mt-1">
                <span>Дата: {date}</span>
                <span>•</span>
                <span>Время: {time}</span>
              </div>
            </div>

            {/* List of items structured by department */}
            {departmentGroups.length === 0 ? (
              <div className="py-8 text-center text-sm font-medium text-stone-500">
                В заказе пока нет выбранных продуктов
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {departmentGroups.map((group) => (
                  <div key={group.rank} className="bg-white/70 rounded-xl border border-[#DCD2BB] overflow-hidden shadow-2xs">
                    <div className="bg-[#EFE8D6] px-3 py-1.5 border-b border-[#DCD2BB] flex items-center justify-between text-xs font-black text-stone-900">
                      <div className="flex items-center gap-1.5">
                        <span>{group.icon}</span>
                        <span>{group.rank}. {group.name}</span>
                      </div>
                      <span className="text-[10px] text-stone-600 bg-white/80 px-1.5 py-0.5 rounded-full border border-[#DDD3BC] font-bold">
                        {group.items.length} поз.
                      </span>
                    </div>
                    <div className="divide-y divide-dashed divide-[#D2C7AA] px-3">
                      {group.items.map((item) => (
                        <div 
                          key={item.productId}
                          className="py-2 flex items-center justify-between text-sm group"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="text-lg flex-shrink-0">{item.icon || '📦'}</span>
                            <div className="min-w-0">
                              <span className="font-bold text-stone-900 block truncate text-xs sm:text-sm">
                                {item.name}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                              {item.quantity} {item.unit}
                            </span>
                            {(() => {
                              const prod = products.find(p => p.id === item.productId || p.name === item.name);
                              const itemSum = getItemSum(item, prod, selectedRestaurant);
                              return itemSum > 0 ? (
                                <span className="text-[11px] font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                                  {itemSum} ₽
                                </span>
                              ) : null;
                            })()}
                            <button
                              onClick={() => removeOrderItem(item.productId)}
                              className="opacity-60 hover:opacity-100 p-1 text-red-600 rounded-md hover:bg-red-50 transition-all cursor-pointer"
                              title="Удалить из заказа"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total positions count and Sum */}
            <div className="mt-4 pt-3 border-t-2 border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between text-sm sm:text-base font-black text-stone-900">
                <span>Итого позиций:</span>
                <span 
                  style={{ color: brandColor }}
                  className="text-xl font-extrabold"
                >
                  {totalPositions}
                </span>
              </div>
              {totalSum > 0 && (
                <div className="flex items-center justify-between text-sm sm:text-base font-black text-stone-900 pt-1 border-t border-dashed border-stone-300">
                  <span>Общая сумма:</span>
                  <span 
                    style={{ color: brandColor }}
                    className="text-xl font-extrabold"
                  >
                    {totalSum.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-200 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3.5 rounded-2xl border border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-100 transition-colors"
          >
            Изменить
          </button>

          <button
            type="button"
            onClick={onProceedToSend}
            disabled={totalPositions === 0}
            style={{ backgroundColor: brandColor }}
            className="flex-1 py-3.5 px-5 rounded-2xl text-white font-extrabold text-base shadow-lg hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-5 h-5" />
            <span>Сформировать и открыть заказ →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
