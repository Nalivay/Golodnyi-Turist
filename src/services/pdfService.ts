import { SavedOrder, Product } from '../types';
import { getOrderNumber } from '../utils/orderNumber';
import { sortOrderItems, groupOrderItemsByDepartment } from '../utils/orderSorting';
import { WHITE_LABEL_CONFIG } from '../config/whiteLabel.config';

/**
 * Generates an automatic filename according to specification:
 * Голодный_Турист_Заказ_100926-01_07-09-2026_10-42.pdf
 */
export function getOrderPdfFileName(order: SavedOrder): string {
  // replace dots and colons with dashes for clean safe file names
  const cleanDate = order.date.replace(/\./g, '-').replace(/\s+/g, '_');
  const cleanTime = order.time.replace(/:/g, '-');
  const orderNumStr = (order.orderNumber || getOrderNumber(order)).replace(/\//g, '-');
  return `${order.restaurantName || 'Голодный_Турист'}_Заказ_${orderNumStr}_${cleanDate}_${cleanTime}.pdf`;
}

/**
 * Triggers native browser print formatted specifically for paper order sheets
 */
export function printOrderSheet(order: SavedOrder) {
  window.print();
}

/**
 * Generates a clean standalone HTML receipt document that can be printed or saved
 */
export function openPrintableOrderWindow(order: SavedOrder, products?: Product[]) {
  const brandColor = '#D97706';
  const curr = WHITE_LABEL_CONFIG.appBrand.currencySymbol || '₽';
  const fileName = getOrderPdfFileName(order);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Пожалуйста, разрешите всплывающие окна для печати заказа');
    return;
  }

  const rawValid = (order.items || []).filter(item => {
    if (!item) return false;
    const q = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity));
    return !isNaN(q) && q > 0;
  });
  const validItems = sortOrderItems(rawValid, products, order.restaurantId);
  const groups = groupOrderItemsByDepartment(validItems, products, order.restaurantId);

  const totalSum = validItems.reduce((acc, it) => {
    const s = typeof it.sum === 'string' ? parseFloat(it.sum) : (typeof it.sum === 'number' ? it.sum : 0);
    return acc + (isNaN(s) ? 0 : s);
  }, 0);

  const departmentBlocksHtml = groups.map(group => `
    <div style="margin-top: 18px; border: 1px solid #dcd2bb; border-radius: 8px; overflow: hidden; background: #fff;">
      <div style="background: #efe8d6; padding: 8px 12px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #1a1a1a; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #dcd2bb;">
        <span>${group.icon} ${group.rank}. ${group.name}</span>
        <span style="font-size: 11px; font-weight: 700; color: #555; background: #fff; padding: 2px 8px; border-radius: 12px; border: 1px solid #dcd2bb;">${group.items.length} поз.</span>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #faf7ee; border-bottom: 1px solid #e0d6be;">
            <th style="padding: 6px 6px; font-size: 11px; text-align: center; width: 34px; color: #777;">✓</th>
            <th style="padding: 6px 8px; font-size: 11px; text-align: center; width: 44px; color: #777;">Вид</th>
            <th style="padding: 6px 10px; font-size: 11px; text-align: left; color: #777;">Продукт</th>
            <th style="padding: 6px 10px; font-size: 11px; text-align: right; color: #777; width: 110px;">Количество</th>
            <th style="padding: 6px 10px; font-size: 11px; text-align: right; color: #777; width: 90px;">Сумма</th>
          </tr>
        </thead>
        <tbody>
          ${group.items.map(item => `
            <tr style="border-bottom: 1px dashed #e8dfc8; ${item.purchased ? 'background: #f0fdf4;' : ''}">
              <td style="padding: 8px 6px; font-size: 16px; text-align: center; width: 34px; color: ${item.purchased ? '#15803D' : '#bbb'};">
                ${item.purchased ? '☑' : '☐'}
              </td>
              <td style="padding: 8px 8px; font-size: 20px; text-align: center; width: 44px; ${item.purchased ? 'opacity: 0.5;' : ''}">${item.icon || '📦'}</td>
              <td style="padding: 8px 10px; font-weight: 600; font-size: 15px; color: ${item.purchased ? '#888' : '#1a1a1a'}; ${item.purchased ? 'text-decoration: line-through;' : ''}">${item.name}</td>
              <td style="padding: 8px 10px; font-weight: 700; font-size: 15px; text-align: right; color: ${item.purchased ? '#888' : '#1a1a1a'}; white-space: nowrap; ${item.purchased ? 'text-decoration: line-through;' : ''}">
                ${item.quantity} <span style="font-weight: normal; color: #555;">${item.unit}</span>
              </td>
              <td style="padding: 8px 10px; font-weight: 700; font-size: 15px; text-align: right; color: ${item.purchased ? '#888' : '#1a1a1a'}; width: 90px; white-space: nowrap; ${item.purchased ? 'text-decoration: line-through;' : ''}">
                ${item.sum !== undefined && item.sum !== '' ? `${item.sum} ${curr}` : '—'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #FAF7EE;
      color: #1a1a1a;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
    }
    .sheet {
      background: #FFFDF7;
      width: 100%;
      max-width: 650px;
      padding: 36px 32px;
      border: 1px solid #e0d6be;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid ${brandColor};
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .restaurant-title {
      font-size: 28px;
      font-weight: 900;
      color: ${brandColor};
      margin: 0 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .order-subtitle {
      font-size: 18px;
      font-weight: 700;
      color: #333;
      margin: 0 0 10px 0;
    }
    .meta-box {
      display: flex;
      justify-content: space-around;
      background: #F4EEDF;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    th {
      background: #EFE8D6;
      color: #4a4538;
      text-align: left;
      padding: 10px 12px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .total-box {
      margin-top: 24px;
      padding: 16px 20px;
      background: #F4EEDF;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 18px;
      font-weight: 800;
      border-left: 6px solid ${brandColor};
    }
    .footer {
      margin-top: 32px;
      text-align: center;
      font-size: 12px;
      color: #888;
      border-top: 1px dashed #ccc;
      padding-top: 14px;
    }
    .btn-bar {
      margin-bottom: 20px;
      text-align: center;
    }
    .print-btn {
      background: ${brandColor};
      color: white;
      border: none;
      padding: 12px 28px;
      font-size: 16px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .sheet {
        border: none;
        box-shadow: none;
        max-width: 100%;
        padding: 0;
      }
      .btn-bar {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div style="width: 100%; max-width: 650px;">
    <div class="btn-bar">
      <button class="print-btn" onclick="window.print()">Распечатать / Сохранить в PDF</button>
    </div>
    <div class="sheet">
      <div class="header">
        <div style="text-align: center; margin-bottom: 12px;">
          <img 
            src="/Logo_Golodnyy_Turist.png" 
            alt="${order.restaurantName}" 
            style="max-width: 260px; max-height: 75px; object-fit: contain;" 
          />
        </div>
        <div class="restaurant-title">${order.indicator || '🧭'} ${order.restaurantName}</div>
        <div class="order-subtitle">Ежедневная заявка на продукты</div>
        <div class="meta-box">
          <div>📅 Дата: <strong>${order.date}</strong></div>
          <div>🕐 Время: <strong>${order.time}</strong></div>
          ${order.customerName ? `<div>👤 Заказчик: <strong>${order.customerName}</strong></div>` : ''}
          <div>№ Заказа: <strong>${order.orderNumber || getOrderNumber(order)}</strong></div>
        </div>
      </div>

      ${departmentBlocksHtml}

      <div class="total-box">
        <div>
          <span>Итого позиций в заказе:</span>
          <span style="color: ${brandColor}; font-size: 22px; margin-left: 6px;">${order.totalPositions}</span>
        </div>
        ${totalSum > 0 ? `
        <div>
          <span>Общая сумма:</span>
          <span style="color: ${brandColor}; font-size: 22px; margin-left: 6px;">${totalSum.toLocaleString('ru-RU')} ${curr}</span>
        </div>
        ` : ''}
      </div>

      <div class="footer">
        Приложение «Голодный Турист» • Ресторан «${order.restaurantName}» • Сформировано: ${order.date} ${order.time}
      </div>
    </div>
  </div>
  <script>
    // Auto-trigger print dialog after load
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
