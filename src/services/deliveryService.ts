import { SavedOrder, Product } from '../types';
import { getOrderNumber } from '../utils/orderNumber';
import { sortOrderItems, groupOrderItemsByDepartment } from '../utils/orderSorting';
import { getItemUnitPrice, getItemSum, calculateOrderTotalSum } from '../utils/orderPricing';
import { WHITE_LABEL_CONFIG } from '../config/whiteLabel.config';

/**
 * Format the standard order message text for Telegram/WhatsApp with prices and totals.
 * Strictly structured by store departments:
 * 1. ОВОЩИ
 * 2. МЯСО
 * 3. БАКАЛЕЯ
 * 4. БАР
 * 5. ХОЗ-КА
 * 6. ПРОЧЕЕ
 * Preserves catalog order inside each department.
 */
export function formatOrderMessage(
  order: SavedOrder, 
  useCodeBlock = false,
  products?: Product[]
): string {
  const curr = WHITE_LABEL_CONFIG.appBrand.currencySymbol || '₽';

  // Strictly filter only items that were actually ordered (quantity > 0)
  const validItems = (order.items || []).filter(item => {
    if (!item) return false;
    const q = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity));
    return !isNaN(q) && q > 0;
  });

  const headerTitle = `${WHITE_LABEL_CONFIG.restaurants[0]?.indicator || '🧭'} ${WHITE_LABEL_CONFIG.appBrand.name.toUpperCase()} — ЗАКАЗ ПРОДУКТОВ`;

  const resolvedOrderNum = order.orderNumber || getOrderNumber(order);
  const orderNumberLine = resolvedOrderNum 
    ? `\n№ ${resolvedOrderNum}` 
    : '';

  const customerLine = order.customerName && order.customerName.trim()
    ? `\n👤 Заказчик: ${order.customerName.trim()}`
    : '';

  const editedLine = order.updatedAt ? `\n✏️ Изменён в ${order.updatedAt}` : '';

  const metaHeader = `${headerTitle}${orderNumberLine}\n📅 ${order.date}\n🕐 ${order.time}${customerLine}${editedLine}`;

  if (validItems.length === 0) {
    return `${metaHeader}\n\n(В заказе нет выбранных позиций)`;
  }

  // Group items strictly by store departments:
  // 1. ОВОЩИ -> 2. МЯСО -> 3. БАКАЛЕЯ -> 4. БАР -> 5. ХОЗ-КА -> 6. ПРОЧЕЕ
  const groups = groupOrderItemsByDepartment(validItems, products, order.restaurantId);
  const totalPositionsCount = groups.reduce((acc, g) => acc + g.items.length, 0);
  const totalSum = calculateOrderTotalSum(validItems, products, order.restaurantId);

  // Clean standard text for Telegram:
  // - Grouped by department blocks
  // - Product name, quantity, unit, price and sum
  if (!useCodeBlock) {
    const blocks = groups.map(group => {
      const header = `${group.icon} ${group.name}`;
      const lines = group.items.map(item => {
        const prod = products?.find(p => p.id === item.productId || p.name === item.name);
        const unitPrice = getItemUnitPrice(item, prod, order.restaurantId);
        const itemSum = getItemSum(item, prod, order.restaurantId);
        const iconStr = item.icon ? `${item.icon} ` : '';
        const numQty = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity));

        let priceText = '';
        if (itemSum > 0) {
          if (unitPrice > 0 && numQty > 0 && numQty !== 1) {
            priceText = ` (по ${unitPrice} ${curr} = ${itemSum} ${curr})`;
          } else {
            priceText = ` (${itemSum} ${curr})`;
          }
        }

        return `${iconStr}${item.name} — ${item.quantity} ${item.unit}${priceText}`;
      }).join('\n');
      return `${header}\n${lines}`;
    });

    const bodyText = blocks.join('\n\n');
    const sumLine = totalSum > 0 ? `\nИтоговая сумма: ${totalSum} ${curr}` : '';
    const totalSummary = `\n\n━━━━━━━━━━━━\nПозиций: ${totalPositionsCount}${sumLine}`;
    return `${metaHeader}\n\n${bodyText}${totalSummary}`;
  }

  // Monospace table format with prices and sums
  const blocks = groups.map(group => {
    const deptTitle = `${group.icon} ${group.name}`;
    const maxNameLen = Math.max(
      10,
      Math.min(22, ...group.items.map(it => it.name.trim().length))
    );

    const maxQtyLen = Math.max(
      6,
      Math.min(10, ...group.items.map(it => `${it.quantity} ${it.unit}`.length))
    );

    const headerRow = `ТОВАР`.padEnd(maxNameLen, ' ') + '  ' + `КОЛ-ВО`.padEnd(maxQtyLen, ' ') + '  ' + `СУММА`;
    const divider = '─'.repeat(headerRow.length);

    const rows = group.items.map(item => {
      const prod = products?.find(p => p.id === item.productId || p.name === item.name);
      const itemSum = getItemSum(item, prod, order.restaurantId);
      const trimmedName = item.name.trim().length > maxNameLen
        ? item.name.trim().substring(0, maxNameLen - 1) + '…'
        : item.name.trim();

      const qtyStr = `${item.quantity} ${item.unit}`;
      const sumStr = itemSum > 0 ? `${itemSum} ${curr}` : '—';
      const nameCol = trimmedName.padEnd(maxNameLen, ' ');
      const qtyCol = qtyStr.padEnd(maxQtyLen, ' ');
      return `${nameCol}  ${qtyCol}  ${sumStr}`;
    });

    const tableBlock = [
      '```',
      headerRow,
      divider,
      ...rows,
      '```',
    ].join('\n');

    return `${deptTitle}\n${tableBlock}`;
  });

  const bodyText = blocks.join('\n\n');
  const sumLine = totalSum > 0 ? `\nИтоговая сумма: ${totalSum} ${curr}` : '';
  return `${metaHeader}\n\n${bodyText}\n\n━━━━━━━━━━━━\nПозиций: ${totalPositionsCount}${sumLine}`;
}

/**
 * Formats the order message as rich HTML for clipboard pasting into Telegram/WhatsApp,
 * with department headers highlighted in bold and underlined (<b><u>...</u></b>)
 * and item prices and total sum.
 */
export function formatOrderMessageHtml(
  order: SavedOrder,
  products?: Product[]
): string {
  const curr = WHITE_LABEL_CONFIG.appBrand.currencySymbol || '₽';

  const validItems = (order.items || []).filter(item => {
    if (!item) return false;
    const q = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity));
    return !isNaN(q) && q > 0;
  });

  const headerTitle = `${WHITE_LABEL_CONFIG.restaurants[0]?.indicator || '🧭'} ${WHITE_LABEL_CONFIG.appBrand.name.toUpperCase()} — ЗАКАЗ ПРОДУКТОВ`;

  const resolvedOrderNum = order.orderNumber || getOrderNumber(order);
  const orderNumberLine = resolvedOrderNum 
    ? `<br>№ ${resolvedOrderNum}` 
    : '';

  const customerLine = order.customerName && order.customerName.trim()
    ? `<br>👤 Заказчик: ${order.customerName.trim()}`
    : '';

  const editedLine = order.updatedAt ? `<br>✏️ Изменён в ${order.updatedAt}` : '';

  const metaHeader = `${headerTitle}${orderNumberLine}<br>📅 ${order.date}<br>🕐 ${order.time}${customerLine}${editedLine}`;

  if (validItems.length === 0) {
    return `${metaHeader}<br><br>(В заказе нет выбранных позиций)`;
  }

  const groups = groupOrderItemsByDepartment(validItems, products, order.restaurantId);
  const totalPositionsCount = groups.reduce((acc, g) => acc + g.items.length, 0);
  const totalSum = calculateOrderTotalSum(validItems, products, order.restaurantId);

  const blocks = groups.map(group => {
    const iconPrefix = group.icon ? `${group.icon} ` : '';
    const headerHtml = `${iconPrefix}<b><u>${group.name}</u></b>`;
    const lines = group.items.map(item => {
      const prod = products?.find(p => p.id === item.productId || p.name === item.name);
      const unitPrice = getItemUnitPrice(item, prod, order.restaurantId);
      const itemSum = getItemSum(item, prod, order.restaurantId);
      const iconStr = item.icon ? `${item.icon} ` : '';
      const numQty = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity));

      let priceHtml = '';
      if (itemSum > 0) {
        if (unitPrice > 0 && numQty > 0 && numQty !== 1) {
          priceHtml = ` (по ${unitPrice} ${curr} = <b>${itemSum} ${curr}</b>)`;
        } else {
          priceHtml = ` (<b>${itemSum} ${curr}</b>)`;
        }
      }

      return `${iconStr}${item.name} — ${item.quantity} ${item.unit}${priceHtml}`;
    }).join('<br>\n');
    return `${headerHtml}<br>\n${lines}`;
  });

  const bodyText = blocks.join('<br><br>\n\n');
  const sumHtml = totalSum > 0 ? `<br><b>Итоговая сумма: ${totalSum} ${curr}</b>` : '';
  const totalSummary = `<br><br>━━━━━━━━━━━━<br>Позиций: <b>${totalPositionsCount}</b>${sumHtml}`;
  return `${metaHeader}<br><br>\n\n${bodyText}${totalSummary}`;
}

/**
 * Copies the order to the clipboard using multi-format ClipboardItem:
 * - 'text/html': HTML formatted with <b><u>...</u></b> for Telegram rich paste (bold & underlined headers)
 * - 'text/plain': Clean plain text without markdown syntax marks (** or __)
 * Includes robust fallback for iframe permissions and cross-platform compatibility.
 */
export async function copyOrderToClipboard(order: SavedOrder, products?: Product[]): Promise<boolean> {
  const plainText = formatOrderMessage(order, false, products);
  const htmlText = formatOrderMessageHtml(order, products);

  // Strategy 1: Async Clipboard API with text/html + text/plain Blob payload
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
    try {
      const htmlBlob = new Blob([htmlText], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      const clipboardItem = new window.ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });
      await navigator.clipboard.write([clipboardItem]);
      return true;
    } catch (err) {
      console.warn('Rich ClipboardItem write failed, trying fallback:', err);
    }
  }

  // Strategy 2: Event-driven execCommand('copy') with clipboardData setData
  try {
    let copyEventTriggered = false;
    const copyListener = (e: ClipboardEvent) => {
      if (e.clipboardData) {
        e.clipboardData.setData('text/html', htmlText);
        e.clipboardData.setData('text/plain', plainText);
        e.preventDefault();
        copyEventTriggered = true;
      }
    };

    document.addEventListener('copy', copyListener);

    const tempEl = document.createElement('div');
    tempEl.innerHTML = htmlText;
    tempEl.style.position = 'fixed';
    tempEl.style.left = '-9999px';
    tempEl.style.top = '-9999px';
    tempEl.style.opacity = '0';
    document.body.appendChild(tempEl);

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(tempEl);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const success = document.execCommand('copy');
    selection?.removeAllRanges();
    document.body.removeChild(tempEl);
    document.removeEventListener('copy', copyListener);

    if (success || copyEventTriggered) {
      return true;
    }
  } catch (err) {
    console.warn('execCommand rich copy failed, falling back to writeText:', err);
  }

  // Strategy 3: Plain writeText fallback
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(plainText);
      return true;
    } catch (err) {
      console.warn('writeText fallback failed:', err);
    }
  }

  // Strategy 4: Basic textarea fallback
  try {
    const textarea = document.createElement('textarea');
    textarea.value = plainText;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textarea);
    return result;
  } catch (e) {
    console.error('All clipboard operations failed:', e);
    return false;
  }
}
