import { SavedOrder, RestaurantId } from '../types';

/**
 * Returns letter prefix for restaurant: 'Г' for Golodnyy Turist
 */
export function getRestaurantLetter(restaurantId?: RestaurantId | string): string {
  return 'Г';
}

/**
 * Parses a date or string into Day, Month (1-12), Year (2-digit).
 * Format specified: DDMMYY (e.g. 14 сентября 2026 -> 140926)
 */
export function getOrderDatePrefix(dateObj: Date = new Date()): string {
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = String(dateObj.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

/**
 * Parse an order into DDMMYY 6-digit prefix.
 */
export function extractDatePrefixFromOrder(order: Partial<SavedOrder>): string {
  if (order.orderNumber) {
    const numMatch = order.orderNumber.match(/(\d{6})\//);
    if (numMatch) {
      return numMatch[1];
    }
  }
  if (order.timestamp) {
    return getOrderDatePrefix(new Date(order.timestamp));
  }
  if (order.date) {
    const ddmmyyyy = order.date.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3].slice(-2);
      return `${day}${month}${year}`;
    }
  }
  return getOrderDatePrefix(new Date());
}

/**
 * Backward compatibility alias
 */
export const extractPrefixFromOrder = extractDatePrefixFromOrder;

/**
 * Extracts the sequential index after the slash in an orderNumber (e.g. /01 -> 1).
 */
export function extractSequenceFromOrderNumber(orderNumber?: string): number | null {
  if (!orderNumber) return null;
  const match = orderNumber.match(/\/(\d+)/);
  if (!match) return null;
  const seq = parseInt(match[1], 10);
  return isNaN(seq) ? null : seq;
}

/**
 * Generates next sequential order number for the specified restaurant and date.
 * Format:
 * - «Голодный Турист»: Г<DDMMYY>/01, Г<DDMMYY>/02, ...
 * Example:
 * Голодный Турист: Г140926/01
 */
export function generateOrderNumber(
  restaurantIdOrDate?: RestaurantId | string | Date,
  dateObjOrOrders?: Date | SavedOrder[],
  existingOrders: SavedOrder[] = []
): string {
  // Support flexible argument signatures:
  // 1. generateOrderNumber(restaurantId, date, orders)
  // 2. generateOrderNumber(date, orders) [legacy signature]
  let restaurantId: RestaurantId | string | undefined;
  let dateObj: Date = new Date();
  let ordersList: SavedOrder[] = [];

  if (typeof restaurantIdOrDate === 'string') {
    restaurantId = restaurantIdOrDate;
    if (dateObjOrOrders instanceof Date) {
      dateObj = dateObjOrOrders;
      ordersList = existingOrders;
    } else if (Array.isArray(dateObjOrOrders)) {
      ordersList = dateObjOrOrders;
    }
  } else if (restaurantIdOrDate instanceof Date) {
    dateObj = restaurantIdOrDate;
    if (Array.isArray(dateObjOrOrders)) {
      ordersList = dateObjOrOrders;
    }
  }

  const letter = getRestaurantLetter(restaurantId);
  const datePrefix = getOrderDatePrefix(dateObj);

  // Filter only orders that belong to THIS restaurant on THIS day
  let maxSeq = 0;
  for (const ord of ordersList) {
    // If restaurant is specified, check restaurant matches
    if (restaurantId && ord.restaurantId && ord.restaurantId !== restaurantId) {
      continue;
    }

    // Check date matches
    const ordDate = extractDatePrefixFromOrder(ord);
    if (ordDate !== datePrefix) {
      continue;
    }

    const seq = extractSequenceFromOrderNumber(ord.orderNumber);
    if (seq !== null && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  const nextSeq = maxSeq + 1;
  const formattedSeq = String(nextSeq).padStart(2, '0');
  return `${letter}${datePrefix}/${formattedSeq}`;
}

/**
 * Returns existing orderNumber or fallback generated number for historical display.
 * Also ensures the restaurant letter prefix ('А' or 'М') and two-digit sequence (/01).
 */
export function getOrderNumber(order: SavedOrder, allOrders?: SavedOrder[]): string {
  const letter = getRestaurantLetter(order.restaurantId);
  const datePrefix = extractDatePrefixFromOrder(order);

  // If order already has a properly formatted orderNumber with letter (e.g. А140926/01 or М140926/01)
  if (order.orderNumber) {
    const fullPattern = /^[А-ЯA-Z]\d{6}\/\d{2,}$/;
    if (fullPattern.test(order.orderNumber.trim())) {
      return order.orderNumber.trim();
    }

    // If order has an old format like "140926/1" or "140926/2" without letter
    // If allOrders is given, recompute sequential index strictly per restaurant
    if (allOrders && allOrders.length > 0) {
      const sameRestaurantAndDay = allOrders
        .filter(o => o.restaurantId === order.restaurantId && extractDatePrefixFromOrder(o) === datePrefix)
        .sort((a, b) => a.timestamp - b.timestamp);

      const idx = sameRestaurantAndDay.findIndex(o => o.id === order.id);
      if (idx >= 0) {
        return `${letter}${datePrefix}/${String(idx + 1).padStart(2, '0')}`;
      }
    }

    // Otherwise prepend letter and format sequence with leading zero
    const seq = extractSequenceFromOrderNumber(order.orderNumber) || 1;
    return `${letter}${datePrefix}/${String(seq).padStart(2, '0')}`;
  }

  // Fallback for legacy orders without orderNumber
  if (!allOrders || allOrders.length === 0) {
    return `${letter}${datePrefix}/01`;
  }

  const sameRestaurantAndDay = allOrders
    .filter(o => o.restaurantId === order.restaurantId && extractDatePrefixFromOrder(o) === datePrefix)
    .sort((a, b) => a.timestamp - b.timestamp);

  const idx = sameRestaurantAndDay.findIndex(o => o.id === order.id);
  const seq = idx >= 0 ? idx + 1 : 1;
  return `${letter}${datePrefix}/${String(seq).padStart(2, '0')}`;
}

/**
 * Normalizes all existing orders in an array so each order has the correct
 * restaurant letter ('А' or 'М') and independent sequence (/01, /02) per day.
 */
export function normalizeOrderList(orders: SavedOrder[]): SavedOrder[] {
  // Group orders by restaurantId + datePrefix
  const groups = new Map<string, SavedOrder[]>();

  // Sort chronologically ascending to preserve order of creation
  const sorted = [...orders].sort((a, b) => a.timestamp - b.timestamp);

  for (const ord of sorted) {
    const key = `${ord.restaurantId || 'unknown'}__${extractDatePrefixFromOrder(ord)}`;
    const list = groups.get(key) || [];
    list.push(ord);
    groups.set(key, list);
  }

  const updatedMap = new Map<string, string>(); // orderId -> new orderNumber

  groups.forEach((groupOrders) => {
    groupOrders.forEach((ord, index) => {
      const letter = getRestaurantLetter(ord.restaurantId);
      const datePrefix = extractDatePrefixFromOrder(ord);
      const seq = String(index + 1).padStart(2, '0');
      const normalizedNum = `${letter}${datePrefix}/${seq}`;
      updatedMap.set(ord.id, normalizedNum);
    });
  });

  return orders.map(ord => {
    const newNum = updatedMap.get(ord.id);
    if (newNum && ord.orderNumber !== newNum) {
      let updatedMessage = ord.messageText;
      if (updatedMessage) {
        updatedMessage = updatedMessage
          .replace(/(ЗАКАЗ №\s*)[^\n]+/gi, `$1${newNum}`)
          .replace(/(\n№\s*)[^\n]+/gi, `$1${newNum}`);
      }
      return {
        ...ord,
        orderNumber: newNum,
        messageText: updatedMessage,
      };
    }
    return ord;
  });
}

