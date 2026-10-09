/**
 * =======================================================================
 *  ГОЛОДНЫЙ ТУРИСТ / WHITE-LABEL КОНФИГУРАЦИЯ
 * =======================================================================
 * Этот файл — единый центр управления брендингом и настройками приложения.
 * =======================================================================
 */

export interface RestaurantBranding {
  id: string; // Внутренний идентификатор: 'golodnyy_turist'
  name: string; // Полное имя: «Ресторан «Голодный Турист»»
  shortName: string; // Короткое имя: «Голодный Турист»
  indicator: string; // Эмодзи-маркер: '🧭'
  tagline: string; // Описание/подзаголовок: 'Создать заявку →'
  themeColor: string; // Основной цвет в HEX: '#D97706'
  accentBorder: string; // Tailwind класс или цвет рамки
  badgeBg: string; // Tailwind класс фона бейджа: 'bg-amber-100'
  badgeText: string; // Tailwind класс текста бейджа: 'text-amber-800'
  logoType: 'armenia' | 'minsk' | 'custom' | 'monogram';
  customLogoUrl?: string; // Если есть картинка в папке /public (например, '/my_logo.png')
  customLogoText?: string; // Текст или инициалы для монограммы
  defaultTelegramGroup?: string; // Название группы Telegram по умолчанию
}

export interface WhiteLabelConfig {
  /**
   * Общие данные бренда и приложения
   */
  appBrand: {
    name: string; // Название приложения (например: 'Голодный Турист')
    subtitle: string; // Подзаголовок (например: 'Электронный бланк заказов продуктов')
    tagline: string; // Краткое описание системы
    description: string; // Подробное описание на экране приветствия
    footerText: string; // Текст в подвале приложения
    currencySymbol: string; // Символ валюты: '₽', 'руб.', '₸', '$', '€', '฿'
    mainLogoType: 'armminsk' | 'custom' | 'monogram';
    customMainLogoUrl?: string; // Картинка главного логотипа приложения в /public
  };

  /**
   * Режим работы системы:
   * - 'multi': сеть ресторанов (показывается экран выбора заведения)
   * - 'single': один ресторан (для отдельного заведения)
   */
  mode: 'multi' | 'single';

  /**
   * Ресторан по умолчанию (актуально для single-mode или первого входа)
   */
  defaultRestaurantId: string;

  /**
   * Список заведений (ресторанов / баров / цехов)
   */
  restaurants: RestaurantBranding[];

  /**
   * Контакты поддержки / разработчика для рестораторов
   */
  support: {
    contactName: string;
    telegram?: string;
    email?: string;
    phone?: string;
  };
}

export const WHITE_LABEL_CONFIG: WhiteLabelConfig = {
  appBrand: {
    name: 'Голодный Турист',
    subtitle: 'Электронный бланк заказов продуктов и техкарты',
    tagline: 'Ресторан «Голодный Турист»',
    description: 'Быстрое оформление и отправка заявок кухни и технологические карты блюд',
    footerText: 'Приложение «Голодный Турист» • Ресторан',
    currencySymbol: '₽',
    mainLogoType: 'custom',
    customMainLogoUrl: '/Logo_Golodnyy_Turist.png',
  },

  mode: 'single',
  defaultRestaurantId: 'golodnyy_turist',

  restaurants: [
    {
      id: 'golodnyy_turist',
      name: 'Ресторан «Голодный Турист»',
      shortName: 'Голодный Турист',
      indicator: '🧭',
      tagline: 'Создать заявку →',
      themeColor: '#D97706',
      accentBorder: 'border-amber-600',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      logoType: 'custom',
      customLogoUrl: '/Logo_Golodnyy_Turist.png',
      defaultTelegramGroup: 'Закупка Голодный Турист',
    },
  ],

  support: {
    contactName: 'Андрей',
    telegram: '@Avakartsuk',
    email: 'Avakartsuk@gmail.com',
  },
};

/**
 * Хелпер для быстрого получения настроек бренда ресторана по его ID
 */
export function getRestaurantBranding(restaurantId?: string): RestaurantBranding {
  const found = WHITE_LABEL_CONFIG.restaurants.find(r => r.id === restaurantId);
  return found || WHITE_LABEL_CONFIG.restaurants[0];
}

/**
 * Хелпер для проверки, включен ли режим одного ресторана
 */
export function isSingleRestaurantMode(): boolean {
  return WHITE_LABEL_CONFIG.mode === 'single' || WHITE_LABEL_CONFIG.restaurants.length === 1;
}
