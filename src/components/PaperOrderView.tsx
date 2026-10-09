import React, { useState, useMemo, useRef } from "react";
import { useApp } from "../context/AppContext";
import { LogoGolodnyyTurist } from "./Logos";
import {
  openPrintableOrderWindow,
  getOrderPdfFileName,
} from "../services/pdfService";
import { formatOrderMessage, copyOrderToClipboard } from "../services/deliveryService";
import { getOrderNumber } from "../utils/orderNumber";
import {
  ArrowLeft,
  Printer,
  Copy,
  CheckCircle2,
  Check,
  PlusCircle,
  Calendar,
  Clock,
  History,
  Eye,
  EyeOff,
  User,
  Edit3,
} from "lucide-react";
import { OrderItem } from "../types";
import { calculateOrderTotalSum, getItemSum } from "../utils/orderPricing";
import { isOrderEditable, getOrderEditingStatus } from "../utils/orderEditing";
import { sortOrderItems, groupOrderItemsByDepartment, DepartmentGroup } from "../utils/orderSorting";
import { playToggleSound } from "../utils/audio";

export const PaperOrderView: React.FC = () => {
  const {
    activeOrderForView,
    setActiveOrderForView,
    setCurrentScreen,
    clearCurrentOrder,
    startEditingOrder,
    products,
    toggleOrderItemPurchased,
    orders,
  } = useApp();

  const [customerName, setCustomerName] = useState<string>(() => {
    return (
      activeOrderForView?.customerName ||
      localStorage.getItem("armminsk_customer_name") ||
      ""
    );
  });
  const [showNameAlertModal, setShowNameAlertModal] = useState(false);
  const [modalNameInput, setModalNameInput] = useState("");
  const [modalNameError, setModalNameError] = useState("");
  const [inputHighlighted, setInputHighlighted] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState(false);
  const [showPreviewText, setShowPreviewText] = useState(false);

  if (!activeOrderForView) {
    return (
      <div className="min-h-screen bg-[#FAF7EE] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-stone-600 font-bold mb-4">
          Заказ не выбран для просмотра
        </p>
        <button
          onClick={() => setCurrentScreen("order")}
          className="px-6 py-2.5 bg-stone-900 text-white rounded-xl font-bold"
        >
          К созданию заказа
        </button>
      </div>
    );
  }

  const order = useMemo(() => {
    if (!activeOrderForView) return null;
    return orders.find((o) => o.id === activeOrderForView.id) || activeOrderForView;
  }, [orders, activeOrderForView]);

  if (!order) {
    return null;
  }

  const brandColor = "#D97706";
  const pdfFileName = getOrderPdfFileName(order);

  const handleToggleItem = (item: OrderItem) => {
    if (!order) return;
    playToggleSound();
    const itemKey = item.productId || item.name;
    toggleOrderItemPurchased(order.id, itemKey);
  };

  // Strictly filter only items that were actually ordered (quantity > 0)
  // and sort strictly by store departments (1. Овощи, 2. Мясо, 3. Бакалея, 4. Бар, 5. Хоз-ка, 6. Прочее)
  const validItems: OrderItem[] = useMemo(() => {
    const list = (order.items || []).filter((item) => {
      if (!item) return false;
      const q =
        typeof item.quantity === "number"
          ? item.quantity
          : parseFloat(String(item.quantity));
      return !isNaN(q) && q > 0;
    });
    return sortOrderItems(list, products, order.restaurantId);
  }, [order.items, products, order.restaurantId]);

  // Group items strictly by department: 1. ОВОЩИ, 2. МЯСО, 3. БАКАЛЕЯ, 4. БАР, 5. ХОЗ-КА, 6. ПРОЧЕЕ
  const departmentGroups: DepartmentGroup[] = useMemo(() => {
    return groupOrderItemsByDepartment(validItems, products, order.restaurantId);
  }, [validItems, products, order.restaurantId]);

  const totalSum = useMemo(() => {
    if (order.totalSum !== undefined && order.totalSum > 0) return order.totalSum;
    return calculateOrderTotalSum(validItems, products, order.restaurantId);
  }, [order, validItems, products]);

  const hasAnySum = useMemo(() => {
    return totalSum > 0;
  }, [totalSum]);

  const now = new Date();
  const isEditable = isOrderEditable(order, now);
  const editStatus = getOrderEditingStatus(order, now);

  // Handle Customer Name changes and persist
  const handleNameChange = (val: string) => {
    setCustomerName(val);
    try {
      localStorage.setItem("armminsk_customer_name", val);
    } catch (e) {}
    if (activeOrderForView) {
      setActiveOrderForView({
        ...activeOrderForView,
        customerName: val,
      });
    }
  };

  // Clean, strictly aligned text for Telegram (without prices or totals, department sorted)
  const textToCopy = useMemo(() => {
    return formatOrderMessage(
      {
        ...order,
        customerName: customerName.trim() || undefined,
        items: validItems,
        totalPositions: validItems.length,
      },
      false,
      products
    );
  }, [order, customerName, validItems, products]);

  const handleCopy = async () => {
    const orderToCopy = {
      ...order,
      customerName: customerName.trim() || undefined,
      items: validItems,
      totalPositions: validItems.length,
    };
    await copyOrderToClipboard(orderToCopy, products);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleModalNameSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = modalNameInput.trim();
    if (!clean) {
      setModalNameError("Пожалуйста, введите имя заказчика");
      return;
    }
    setModalNameError("");
    handleNameChange(clean);
    setShowNameAlertModal(false);

    // Format rich text with new name and copy to clipboard
    const orderToCopy = {
      ...order,
      customerName: clean,
      items: validItems,
      totalPositions: validItems.length,
    };

    try {
      await copyOrderToClipboard(orderToCopy, products);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {}
  };

  const handleDismissNameAlert = () => {
    setShowNameAlertModal(false);
    setInputHighlighted(true);
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
    setTimeout(() => {
      setInputHighlighted(false);
    }, 2500);
  };

  const handlePrint = () => {
    openPrintableOrderWindow({
      ...order,
      customerName: customerName.trim() || undefined,
      items: validItems,
      totalPositions: validItems.length,
    }, products);
  };

  const handleStartNewOrder = () => {
    clearCurrentOrder();
    setCurrentScreen("order");
  };

  return (
    <div className="min-h-full flex-1 flex flex-col justify-between bg-[#FAF7EE] pb-28 select-none">
      {/* Top Navigation Header */}
      <div className="sticky top-0 z-30 bg-[#FAF7EE]/95 backdrop-blur-md border-b border-[#E2D8C3] shadow-xs">
        <div className="w-full px-3 py-2.5 flex items-center justify-between">
          {isEditable ? (
            <button
              onClick={() => startEditingOrder(order)}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
              title={`Редактирование доступно до ${editStatus.deadlineText}`}
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-800" />
              <span>Редактировать</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentScreen("order")}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-xs hover:bg-stone-50 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-stone-500" />
              <span>К заказу</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span
              style={{ color: brandColor }}
              className="text-xs sm:text-sm font-black uppercase tracking-wider"
            >
              Ресторан «{order.restaurantName}»
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 px-3 py-1.5 rounded-full text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer"
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
                  <span>Скопировать заказ</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              style={{ backgroundColor: brandColor }}
              className="flex items-center gap-1.5 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              title="Печать или PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать / PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-3 sm:px-4 pt-4 w-full">
        {/* Paper Sheet Design */}
        <div className="paper-order-sheet bg-[#FFFDF7] rounded-3xl border border-[#E0D6BE] shadow-xl p-4 sm:p-6 relative overflow-hidden">
          {/* Paper texture effect */}
          <div className="absolute inset-0 bg-[radial-gradient(#d6c9ad_0.75px,transparent_0.75px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

          {/* Restaurant Official Logo Frame */}
          <div className="flex justify-center pb-2">
            <div className="bg-white/95 px-4 py-2.5 rounded-2xl border border-[#E0D6BE] shadow-xs flex items-center justify-center w-full max-w-[280px]">
              <LogoGolodnyyTurist className="w-20 h-20 sm:w-24 sm:h-24" />
            </div>
          </div>

          {/* Restaurant Header */}
          <div className="text-center pb-3 border-b-2 border-stone-800">
            <h2
              style={{ color: brandColor }}
              className="text-xl sm:text-2xl font-black uppercase tracking-wide"
            >
              Ресторан «{order.restaurantName}»
            </h2>
            <div className="text-xs sm:text-sm font-extrabold text-stone-700 mt-0.5 uppercase tracking-wider">
              Заказ продуктов
            </div>

            {/* Date, Time & Order Number bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs font-bold text-stone-700 bg-[#F4EEDF] py-2 px-4 rounded-xl border border-[#E5DBBF]">
              <div className="flex items-center gap-1 font-mono font-black text-stone-900 bg-white/90 px-2 py-0.5 rounded-md border border-[#DCD3BC] shadow-2xs">
                <span className="text-stone-500">№</span>
                <span className="text-[#A01B24]">
                  {order.orderNumber || getOrderNumber(order)}
                </span>
              </div>
              <span className="text-stone-400">•</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>{order.date}</span>
              </div>
              <span className="text-stone-400">•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                <span className="font-mono">{order.time}</span>
              </div>
            </div>

            {/* Customer name badge on paper if entered */}
            {customerName.trim() && (
              <div className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-stone-800 bg-[#EFE8D6] py-1 px-3 rounded-lg border border-[#DDD3BC]">
                <User className="w-3.5 h-3.5 text-stone-600" />
                <span>
                  Заказчик:{" "}
                  <strong className="text-stone-900">
                    {customerName.trim()}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Structured Department Blocks (строго по отделам: ОВОЩИ, МЯСО, БАКАЛЕЯ, БАР, ХОЗ-КА, ПРОЧЕЕ) */}
          {departmentGroups.length === 0 ? (
            <div className="mt-4 p-8 text-center bg-white rounded-xl border border-[#DDD3BC] text-stone-500 font-medium text-xs">
              В заказе нет выбранных позиций
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {departmentGroups.map((group) => {
                const groupPositionsCount = group.items.length;
                const groupPurchasedCount = group.items.filter((it) => Boolean(it.purchased)).length;
                const isGroupAllPurchased = groupPurchasedCount === groupPositionsCount && groupPositionsCount > 0;

                return (
                  <div
                    key={group.rank}
                    className="overflow-hidden rounded-2xl border-2 border-[#DDD3BC] bg-white shadow-xs"
                  >
                    {/* Department Header Banner */}
                    <div className="bg-[#EFE8D6] border-b border-[#DDD3BC] px-3.5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{group.icon}</span>
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-900">
                          {group.rank}. {group.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {groupPurchasedCount > 0 && (
                          <span
                            className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                              isGroupAllPurchased
                                ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                                : "bg-amber-100 border-amber-300 text-amber-900"
                            }`}
                          >
                            {groupPurchasedCount} / {groupPositionsCount} купл. {isGroupAllPurchased ? "✓" : ""}
                          </span>
                        )}
                        <span className="text-[11px] font-extrabold text-stone-700 bg-white/90 px-2 py-0.5 rounded-full border border-[#DDD3BC]">
                          {groupPositionsCount} поз.
                        </span>
                      </div>
                    </div>

                    {/* Department Table */}
                    <table className="w-full border-collapse table-fixed text-left">
                      <thead>
                        <tr className="bg-[#FAF7EE] text-stone-500 text-[10px] font-extrabold uppercase tracking-wider border-b border-[#EAE2CE]">
                          <th className="py-2 px-1 sm:px-2 text-center w-10 sm:w-12">
                            ✓
                          </th>
                          <th className="py-2 px-1 sm:px-2 text-center w-8 sm:w-10">
                            Вид
                          </th>
                          <th className="py-2 px-2">Продукт</th>
                          <th className="py-2 px-2 text-right w-20 sm:w-24">Кол-во</th>
                          {hasAnySum && (
                            <th className="py-2 px-2 text-right w-16 sm:w-20">Сумма</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dashed divide-[#C4B99F]">
                        {group.items.map((item, idx) => {
                          const isBought = Boolean(item.purchased);
                          const prod = products.find(p => p.id === item.productId || p.name === item.name);
                          const itemSum = getItemSum(item, prod, order.restaurantId);
                          const sumText = itemSum > 0 ? `${itemSum} ₽` : "—";

                          return (
                            <tr
                              key={idx}
                              onClick={() => handleToggleItem(item)}
                              className={`transition-colors cursor-pointer select-none ${
                                isBought
                                  ? "bg-emerald-50/70 hover:bg-emerald-100/60"
                                  : "hover:bg-[#FAF8F2]"
                              }`}
                              title={
                                isBought
                                  ? "Куплено (нажмите, чтобы снять отметку)"
                                  : "Нажмите, чтобы отметить как купленное"
                              }
                            >
                              {/* Square checkbox: ☐ vs ☑ */}
                              <td className="py-2.5 px-1 sm:px-2 text-center w-10 sm:w-12">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleItem(item);
                                  }}
                                  className="inline-flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                                  aria-label={isBought ? "Отмечено" : "Отметить купленным"}
                                >
                                  {isBought ? (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-[#15803D] text-white flex items-center justify-center shadow-xs">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg border-2 border-stone-400 bg-white hover:border-stone-600 transition-colors" />
                                  )}
                                </button>
                              </td>

                              <td
                                className={`py-2.5 px-1 sm:px-2 text-center text-lg sm:text-xl w-8 sm:w-10 transition-opacity ${
                                  isBought ? "opacity-40" : "opacity-100"
                                }`}
                              >
                                {item.icon || "📦"}
                              </td>

                              <td className="py-2.5 px-2 truncate min-w-0">
                                <span
                                  className={`text-xs sm:text-sm block truncate ${
                                    isBought
                                      ? "line-through text-stone-400 font-semibold"
                                      : "text-stone-900 font-bold"
                                  }`}
                                >
                                  {item.name}
                                </span>
                              </td>

                              <td className="py-2.5 px-2 text-right whitespace-nowrap">
                                <span
                                  className={`font-mono text-xs sm:text-sm ${
                                    isBought
                                      ? "line-through text-stone-400 font-normal"
                                      : "text-stone-900 font-extrabold"
                                  }`}
                                >
                                  {item.quantity}{" "}
                                  <span
                                    className={`text-[10px] sm:text-xs font-semibold ${
                                      isBought ? "text-stone-400" : "text-stone-500"
                                    }`}
                                  >
                                    {item.unit}
                                  </span>
                                </span>
                              </td>

                              {hasAnySum && (
                                <td className="py-2.5 px-2 text-right whitespace-nowrap">
                                  <span
                                    className={`font-mono text-xs sm:text-sm font-bold ${
                                      isBought
                                        ? "line-through text-stone-400 font-normal"
                                        : "text-stone-800"
                                    }`}
                                  >
                                    {sumText}
                                  </span>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total & Procurement Progress Box */}
          {(() => {
            const totalPurchasedCount = validItems.filter((it) => Boolean(it.purchased)).length;
            const percentPurchased = validItems.length > 0 ? Math.round((totalPurchasedCount / validItems.length) * 100) : 0;
            const isAllPurchased = totalPurchasedCount === validItems.length && validItems.length > 0;

            return (
              <div className="mt-4 p-4 bg-[#F4EEDF] rounded-2xl border-l-6 border-stone-800 space-y-3">
                <div className="flex items-center justify-between font-black text-stone-900">
                  <span className="text-xs sm:text-sm uppercase tracking-wide">
                    Итого позиций в заказе:
                  </span>
                  <span
                    style={{ color: brandColor }}
                    className="text-2xl font-black"
                  >
                    {validItems.length}
                  </span>
                </div>

                {/* Procurement progress badge and bar */}
                <div className="pt-2 border-t border-dashed border-[#DDD3BC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-stone-700">
                      Куплено товаров:{" "}
                      <strong className="text-stone-900 font-extrabold">
                        {totalPurchasedCount}
                      </strong>{" "}
                      из {validItems.length}
                    </span>
                    <span
                      style={{ color: isAllPurchased ? "#15803D" : brandColor }}
                      className="font-black text-xs"
                    >
                      {percentPurchased}% {isAllPurchased ? "✓ Завершено" : ""}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white/80 rounded-full overflow-hidden p-0.5 border border-[#DDD3BC]">
                    <div
                      style={{
                        width: `${percentPurchased}%`,
                        backgroundColor: isAllPurchased ? "#15803D" : brandColor,
                      }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>
                </div>

                {totalSum > 0 && (
                  <div className="flex items-center justify-between font-black text-stone-900 pt-2 border-t border-dashed border-[#DDD3BC]">
                    <span className="text-xs sm:text-sm uppercase tracking-wide">
                      Общая сумма:
                    </span>
                    <span
                      style={{ color: brandColor }}
                      className="text-2xl font-black"
                    >
                      {totalSum.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Footer file info */}
          <div className="mt-3 pt-3 border-t border-stone-300 text-xs text-stone-500 flex flex-wrap items-center justify-between gap-2">
            <span>Статус: 🟢 Готов к отправке</span>
            <span className="font-mono text-[11px]">{pdfFileName}</span>
          </div>
        </div>

        {/* CUSTOMER NAME FIELD - Placed right before copy button */}
        <div className="mt-4 space-y-3">
          <div
            id="customer-name-card"
            className={`p-4 rounded-2xl bg-white border-2 transition-all shadow-xs ${
              inputHighlighted
                ? "border-amber-500 ring-4 ring-amber-200"
                : customerName.trim()
                  ? "border-emerald-400 bg-emerald-50/20"
                  : "border-[#DDD3BC]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="customer-name-field"
                className="text-xs sm:text-sm font-black uppercase tracking-wide text-stone-900 flex items-center gap-1.5"
              >
                <User className="w-4 h-4 text-stone-600" />
                <span>Имя Заказчика</span>
                <span className="text-red-500 font-black">*</span>
              </label>
              {customerName.trim() ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Заполнено
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Обязательно
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="customer-name-field"
                ref={nameInputRef}
                type="text"
                value={customerName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Введите имя заказчика"
                className="w-full bg-[#FAF7EE] border border-[#DDD3BC] rounded-xl px-4 py-3 text-sm font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-stone-800 transition-all"
              />
              {customerName.trim() && (
                <button
                  type="button"
                  onClick={() => handleNameChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 text-sm font-bold cursor-pointer"
                  title="Очистить"
                >
                  ✕
                </button>
              )}
            </div>
            {!customerName.trim() ? (
              <p className="mt-2 text-xs text-stone-500 font-medium">
                Пожалуйста, введите имя заказчика перед тем, как нажать
                «Скопировать заказ»
              </p>
            ) : (
              <p className="mt-2 text-xs text-emerald-700 font-semibold">
                ✓ Имя заказчика «{customerName.trim()}» будет добавлено в шапку
                заказа
              </p>
            )}
          </div>

          {/* COPY BUTTON */}
          <button
            id="copy-order-btn"
            onClick={handleCopy}
            style={{
              backgroundColor: copied
                ? "#059669"
                : customerName.trim()
                  ? brandColor
                  : "#78716C",
            }}
            className={`w-full py-4 px-6 rounded-2xl text-white font-black text-base sm:text-lg shadow-xl active:scale-98 transition-all flex items-center justify-center gap-3 cursor-pointer ${
              !customerName.trim()
                ? "opacity-85 hover:opacity-100"
                : "hover:opacity-95"
            }`}
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                <span>Заказ скопирован!</span>
              </>
            ) : (
              <>
                <Copy className="w-6 h-6" />
                <span>Скопировать заказ</span>
                {!customerName.trim() && (
                  <span className="text-[11px] font-bold bg-black/25 text-amber-200 px-2.5 py-0.5 rounded-full ml-1">
                    требуется имя
                  </span>
                )}
              </>
            )}
          </button>

          {/* Clear user feedback */}
          {copied ? (
            <div className="p-3 bg-emerald-100/90 border border-emerald-300 rounded-2xl text-xs text-emerald-950 flex items-center gap-2 animate-fadeIn">
              <span className="text-lg">✅</span>
              <p className="font-bold text-emerald-900">
                Заказ скопирован! Откройте Telegram или нужный чат и нажмите{" "}
                <strong>«Вставить»</strong>.
              </p>
            </div>
          ) : (
            <p className="text-center text-xs text-stone-500 font-medium">
              При нажатии заказ копируется ровной таблицей в столбик со всеми
              заказанными позициями
            </p>
          )}

          {/* Collapsible Preview of Copied Table */}
          <div className="bg-white rounded-2xl border border-[#E0D6BE] overflow-hidden shadow-xs">
            <button
              onClick={() => setShowPreviewText(!showPreviewText)}
              className="w-full p-3 flex items-center justify-between text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                {showPreviewText ? (
                  <EyeOff className="w-4 h-4 text-stone-500" />
                ) : (
                  <Eye className="w-4 h-4 text-stone-500" />
                )}
                <span>Предпросмотр текста для Telegram</span>
              </div>
              <span className="text-stone-400 text-xs font-semibold">
                {showPreviewText ? "Скрыть ▲" : "Показать ▼"}
              </span>
            </button>

            {showPreviewText && (
              <div className="p-3 pt-0 border-t border-stone-100">
                <pre className="text-xs font-mono bg-stone-900 text-amber-200 p-3 rounded-xl whitespace-pre overflow-x-auto leading-relaxed max-h-60 overflow-y-auto">
                  {textToCopy}
                </pre>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs shadow-xs hover:bg-stone-50 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-stone-600" />
              <span>Печать / PDF</span>
            </button>

            <button
              onClick={handleStartNewOrder}
              className="py-2.5 px-3 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs shadow-xs hover:bg-stone-50 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-stone-600" />
              <span>Новый заказ</span>
            </button>

            <button
              onClick={() => setCurrentScreen("history")}
              className="py-2.5 px-3 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs shadow-xs hover:bg-stone-50 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-stone-600" />
              <span>История</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL POPUP IF CUSTOMER NAME IS MISSING */}
      {showNameAlertModal && (
        <div
          id="name-alert-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleDismissNameAlert();
          }}
        >
          <div className="bg-[#FFFDF8] rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border-2 border-[#E2D8C3] space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner border border-amber-200">
                👤
              </div>
              <div>
                <h3 className="text-lg font-black text-[#2A1E17] leading-tight">
                  Имя заказчика
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Перед отправкой и копированием введите имя заказчика
                </p>
              </div>
            </div>

            <form onSubmit={handleModalNameSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Ваше имя / Имя ответственного{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={modalNameInput}
                  onChange={(e) => {
                    setModalNameInput(e.target.value);
                    if (modalNameError) setModalNameError("");
                  }}
                  placeholder="Например: Арам, Иван, Анна..."
                  className={`w-full px-3.5 py-3 bg-white rounded-xl border-2 font-bold text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all ${
                    modalNameError
                      ? "border-red-500 bg-red-50/20"
                      : "border-stone-300 focus:border-amber-600"
                  }`}
                />
                {modalNameError && (
                  <p className="text-xs font-bold text-red-600 mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {modalNameError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDismissNameAlert}
                  className="py-3 px-3 rounded-xl border border-stone-300 bg-white text-stone-700 font-bold text-xs hover:bg-stone-50 active:scale-95 transition-all cursor-pointer text-center"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  id="name-alert-submit-btn"
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
    </div>
  );
};
