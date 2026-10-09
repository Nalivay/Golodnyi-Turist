import { SavedOrder } from '../types';

/**
 * Business Rule:
 * Orders are typically created in the late evening or night (e.g. 23:00 to 01:00) for the next day's procurement.
 * An order can be edited until 07:00 AM of the procurement day.
 * 
 * - If created between 00:00 and 06:59:59 (e.g. night/early morning):
 *   Procurement day is today. Deadline is TODAY at 07:00 AM.
 * 
 * - If created at 07:00 or later (e.g. afternoon, evening 23:13):
 *   Procurement day is tomorrow. Deadline is TOMORROW at 07:00 AM.
 */
export function getOrderEditingDeadline(order: SavedOrder): Date {
  let createdDate: Date;
  if (order.timestamp && !isNaN(order.timestamp)) {
    createdDate = new Date(order.timestamp);
  } else {
    createdDate = new Date();
  }

  const hours = createdDate.getHours();
  const deadline = new Date(createdDate);

  if (hours >= 7) {
    // Created at or after 07:00 -> procurement is next day, deadline next day 07:00
    deadline.setDate(deadline.getDate() + 1);
  }
  // If created between 00:00 and 06:59, deadline is same day 07:00

  deadline.setHours(7, 0, 0, 0);
  return deadline;
}

/**
 * Checks if the order is currently editable (current time is before 07:00 AM deadline).
 */
export function isOrderEditable(order: SavedOrder, currentTime: Date = new Date()): boolean {
  if (!order) return false;
  // If order was explicitly closed/fulfilled, check if time has passed
  const deadline = getOrderEditingDeadline(order);
  return currentTime.getTime() < deadline.getTime();
}

/**
 * Formats deadline into Russian text, e.g.:
 * "19 сентября, 07:00"
 */
export function getOrderDeadlineFormatted(order: SavedOrder): string {
  const deadline = getOrderEditingDeadline(order);
  const day = deadline.getDate();
  const month = deadline.toLocaleDateString('ru-RU', { month: 'long' });
  return `${day} ${month}, 07:00`;
}

/**
 * Returns user-friendly status description for UI badges/tooltips.
 */
export function getOrderEditingStatus(order: SavedOrder, currentTime: Date = new Date()): {
  isEditable: boolean;
  deadlineText: string;
  badgeText: string;
  message: string;
} {
  const editable = isOrderEditable(order, currentTime);
  const deadlineText = getOrderDeadlineFormatted(order);

  if (editable) {
    return {
      isEditable: true,
      deadlineText,
      badgeText: `Доступно до ${deadlineText}`,
      message: `Заказ можно редактировать до ${deadlineText}`,
    };
  }

  return {
    isEditable: false,
    deadlineText,
    badgeText: `Редактирование закрыто в 07:00`,
    message: `Редактирование закрыто: прошло время дедлайна (${deadlineText})`,
  };
}
