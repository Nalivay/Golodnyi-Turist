import { OrderItem, Product, RestaurantId } from '../types';

/**
 * Safely parses numeric string or number (supporting both comma and dot decimal separators).
 */
export function parsePriceNumber(val: number | string | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = String(val).replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Resolves unit price for an order item:
 * 1. Checks item.price
 * 2. Checks product catalog price (by restaurant or defaultPrice)
 * 3. Derives from item.sum / quantity if sum is present
 */
export function getItemUnitPrice(
  item: OrderItem,
  product?: Product,
  restaurantId?: RestaurantId
): number {
  if (!item) return 0;

  // 1. Explicit item price
  if (item.price !== undefined && item.price !== null && item.price !== '') {
    const p = parsePriceNumber(item.price);
    if (p > 0) return p;
  }

  // 2. Product catalog
  if (product) {
    const rawPrice = (restaurantId && product.pricesByRestaurant?.[restaurantId]) || product.defaultPrice;
    const p = parsePriceNumber(rawPrice);
    if (p > 0) return p;
  }

  // 3. Reverse calculation from sum
  const q = parsePriceNumber(item.quantity);
  const s = parsePriceNumber(item.sum);
  if (q > 0 && s > 0) {
    return Math.round((s / q) * 100) / 100;
  }

  return 0;
}

/**
 * Calculates sum for a single item: quantity × unit price.
 */
export function getItemSum(
  item: OrderItem,
  product?: Product,
  restaurantId?: RestaurantId
): number {
  if (!item) return 0;
  const q = parsePriceNumber(item.quantity);
  if (q <= 0) return 0;

  // If item already has explicit non-zero sum, prioritize it
  const explicitSum = parsePriceNumber(item.sum);
  if (explicitSum > 0) {
    return explicitSum;
  }

  const unitPrice = getItemUnitPrice(item, product, restaurantId);
  if (unitPrice > 0) {
    return Math.round(q * unitPrice * 100) / 100;
  }

  return 0;
}

/**
 * Unified calculation of total sum for an order or list of items.
 */
export function calculateOrderTotalSum(
  items: OrderItem[] = [],
  products?: Product[],
  restaurantId?: RestaurantId
): number {
  const productsMap = products ? new Map(products.map(p => [p.id, p])) : undefined;

  const total = items.reduce((acc, item) => {
    if (!item) return acc;
    const prod = productsMap ? (productsMap.get(item.productId) || products?.find(p => p.name === item.name)) : undefined;
    const itemTotal = getItemSum(item, prod, restaurantId);
    return acc + itemTotal;
  }, 0);

  return Math.round(total * 100) / 100;
}
