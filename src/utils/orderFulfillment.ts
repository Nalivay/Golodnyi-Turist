import { SavedOrder, OrderItem, RestaurantId, Product } from '../types';
import { getOrderNumber } from './orderNumber';
import { formatOrderMessage } from '../services/deliveryService';
import { getDepartmentRank } from './orderSorting';

/**
 * Checks if an order was created today according to local date.
 */
export function isOrderToday(order: SavedOrder, referenceDate: Date = new Date()): boolean {
  if (!order) return false;
  if (order.timestamp) {
    const d = new Date(order.timestamp);
    if (
      d.getFullYear() === referenceDate.getFullYear() &&
      d.getMonth() === referenceDate.getMonth() &&
      d.getDate() === referenceDate.getDate()
    ) {
      return true;
    }
  }

  // Fallback: check date string representation
  if (order.date) {
    const refDay = referenceDate.getDate();
    const dayStr1 = String(refDay);
    const dayStr2 = String(refDay).padStart(2, '0');
    
    // Russian month string match (e.g. "сентября")
    const monthLong = referenceDate.toLocaleDateString('ru-RU', { month: 'long' }).toLowerCase();
    if (order.date.toLowerCase().includes(monthLong)) {
      if (order.date.includes(dayStr1) || order.date.includes(dayStr2)) {
        return true;
      }
    }

    // Dot format: DD.MM.YYYY
    const todayMonth = String(referenceDate.getMonth() + 1).padStart(2, '0');
    const todayYear = String(referenceDate.getFullYear());
    const dotFormat = `${dayStr2}.${todayMonth}.${todayYear}`;
    if (order.date.includes(dotFormat)) return true;
  }

  return false;
}

/**
 * Robust matching helper to check if an OrderItem matches a given product key or name.
 */
export function itemMatchesProduct(item: OrderItem, targetKey: string, targetName?: string): boolean {
  if (!item) return false;
  const normName = (item.name || '').trim().toLowerCase();
  const normUnit = (item.unit || '').trim().toLowerCase().replace(/\./g, '');
  const itemKey = `${normName}__${normUnit}`;

  const cleanTarget = (targetKey || '').trim().toLowerCase().replace(/\./g, '');
  const targetNameOnly = cleanTarget.split('__')[0];
  const givenNameOnly = (targetName || '').trim().toLowerCase();

  // 1. Composite key match (e.g. "лук__кг")
  if (itemKey === cleanTarget) return true;

  // 2. Exact item name match (e.g. "лук")
  if (normName === cleanTarget || normName === targetNameOnly) return true;
  if (givenNameOnly && normName === givenNameOnly) return true;

  // 3. Product ID match
  if (item.productId && (item.productId === targetKey || (targetName && item.productId === targetName))) {
    return true;
  }

  return false;
}

export interface RestaurantShare {
  orderId: string;
  restaurantId: RestaurantId;
  restaurantName: string;
  indicator: string;
  quantity: number;
  unit: string;
  purchased: boolean;
}

export interface CombinedProductItem {
  key: string;
  name: string;
  icon: string;
  unit: string;
  department: string;
  totalQuantity: number;
  allPurchased: boolean;
  somePurchased: boolean;
  shares: RestaurantShare[];
}

/**
 * Parses numeric quantity safely.
 */
export function parseQuantity(val: number | string): number {
  if (typeof val === 'number') return val;
  const parsed = parseFloat(String(val).replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats order for Telegram:
 * Clean readable list strictly without prices, without position sums, without total sum,
 * and sorted in order of store departments:
 * 1. Овощи
 * 2. Мясо
 * 3. Бакалея
 * 4. Бар
 * 5. Хоз-ка
 * 6. Прочее
 */
export function formatTelegramOrderText(order: SavedOrder, products?: Product[]): string {
  return formatOrderMessage(order, false, products);
}

/**
 * Returns active orders for today that have NOT been fully completed yet.
 */
export function getTodayActiveOrders(orders: SavedOrder[], refDate: Date = new Date()): SavedOrder[] {
  return orders.filter(o => isOrderToday(o, refDate) && o.fulfillmentStatus !== 'completed');
}

/**
 * Returns list of distinct restaurants that have active orders today.
 */
export function getActiveRestaurantsToday(orders: SavedOrder[], refDate: Date = new Date()): RestaurantId[] {
  const activeOrders = getTodayActiveOrders(orders, refDate);
  const restaurants = new Set<RestaurantId>();
  activeOrders.forEach(o => restaurants.add(o.restaurantId));
  return Array.from(restaurants);
}

/**
 * Builds the combined product list across active orders, aggregating identical items.
 */
export function buildCombinedProductList(orders: SavedOrder[]): CombinedProductItem[] {
  const map = new Map<string, CombinedProductItem>();

  for (const order of orders) {
    for (const item of order.items || []) {
      const q = parseQuantity(item.quantity);
      if (q <= 0) continue;

      const normName = (item.name || '').trim().toLowerCase();
      const normUnit = (item.unit || '').trim().toLowerCase().replace(/\./g, '');
      const key = `${normName}__${normUnit}`;

      const share: RestaurantShare = {
        orderId: order.id,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName,
        indicator: order.indicator || '🧭',
        quantity: q,
        unit: item.unit,
        purchased: Boolean(item.purchased),
      };

      if (!map.has(key)) {
        map.set(key, {
          key,
          name: item.name.trim(),
          icon: item.icon || '📦',
          unit: item.unit,
          department: item.department || '',
          totalQuantity: q,
          allPurchased: Boolean(item.purchased),
          somePurchased: Boolean(item.purchased),
          shares: [share],
        });
      } else {
        const existing = map.get(key)!;
        existing.totalQuantity += q;
        // Prefer keeping department if one is filled
        if (!existing.department && item.department) {
          existing.department = item.department;
        }
        existing.shares.push(share);
        existing.allPurchased = existing.shares.every(s => s.purchased);
        existing.somePurchased = existing.shares.some(s => s.purchased);
      }
    }
  }

  // Sort strictly by store department (1. Овощи, 2. Мясо, 3. Бакалея, 4. Бар, 5. Хоз-ка, 6. Прочее), then by name
  return Array.from(map.values()).sort((a, b) => {
    const rankA = getDepartmentRank(a.department, a.name);
    const rankB = getDepartmentRank(b.department, b.name);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.name.localeCompare(b.name, 'ru');
  });
}

/**
 * Calculates progress for an individual order.
 */
export function getOrderProgress(order: SavedOrder): { total: number; purchased: number; percent: number; isComplete: boolean } {
  const items = (order.items || []).filter(it => parseQuantity(it.quantity) > 0);
  const total = items.length;
  const purchased = items.filter(it => Boolean(it.purchased)).length;
  const percent = total > 0 ? Math.round((purchased / total) * 100) : 0;
  const isComplete = total > 0 && purchased === total;
  return { total, purchased, percent, isComplete };
}

/**
 * Formats date for display in header: e.g. "14 сентября 2026 г."
 */
export function formatHeaderDate(d: Date = new Date()): string {
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
