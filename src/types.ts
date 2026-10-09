export type RestaurantId = 'golodnyy_turist' | 'armenia' | 'minsk';

export type UserRole = 'staff' | 'orders_admin' | 'recipes_admin' | 'owner';

export type ScreenType = 
  | 'splash' 
  | 'choice' 
  | 'order' 
  | 'fulfill' 
  | 'history' 
  | 'paper_view' 
  | 'recipes' 
  | 'recipe_detail' 
  | 'delivery_settings';

export type RecipeCategory = 
  | 'salads' 
  | 'soups' 
  | 'mains' 
  | 'appetizers' 
  | 'pastry' 
  | 'drinks' 
  | 'desserts' 
  | 'other';

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: string | number;
  unit: string;
}

export interface RecipeSnapshotData {
  title: string;
  category: RecipeCategory;
  restaurantId?: RestaurantId;
  description: string;
  ingredients: RecipeIngredient[];
  yieldWeight: string;
  prepTime: string;
  technology: string;
  plating: string;
  importantNotes?: string;
  chefTip?: string;
}

export interface RecipeVersion {
  version: string;
  updatedAt: string;
  updatedBy?: string;
  changeNote?: string;
  data: RecipeSnapshotData;
}

export interface Recipe {
  id: string;
  title: string;
  category: RecipeCategory;
  restaurantId?: RestaurantId;
  description: string;
  mainPhoto: string;
  extraPhotos?: string[];
  ingredients: RecipeIngredient[];
  yieldWeight: string; // e.g. "350 г"
  prepTime: string; // e.g. "45 минут"
  technology: string; // step-by-step
  plating: string; // presentation
  importantNotes?: string; // warnings/allergens
  chefTip?: string; // secrets/tips
  currentVersion: string; // e.g. "1.2"
  history?: RecipeVersion[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UnitType = 
  | 'кг'
  | 'уп'
  | 'шт'
  | 'л'
  | '5л'
  | 'бут'
  | 'лоток'
  | 'меш'
  | 'пласт'
  | 'г'
  | 'мл'
  | 'упаковка'
  | 'бутылка'
  | 'ящик'
  | 'другое';

export type ProductCategory = 
  | 'vegetables' 
  | 'meat' 
  | 'consumables' 
  | 'other' 
  | 'grocery' 
  | 'bar' 
  | 'tincture' 
  | 'dairy' 
  | 'bread';

export type PriceStatus = 'confirmed' | 'needs_confirmation';

export interface Product {
  id: string;
  name: string;
  category?: ProductCategory | string;
  icon: string;
  imageUrl?: string;
  defaultUnit: UnitType | string;
  defaultDepartment?: string;
  defaultPrice?: string;
  pricePerKg?: string; // Normalized price per 1 kg for weighed products (unit = 'кг')
  priceStatus?: PriceStatus;
  priceRangeNote?: string; // e.g. "50–100 ₽/кг", "20–40 ₽/кг"
  aliases?: string[]; // Synonyms, alternative namings, typos for quick search
  departmentsByRestaurant?: Partial<Record<RestaurantId, string>>;
  pricesByRestaurant?: Partial<Record<RestaurantId, string>>;
  restaurants?: RestaurantId[];
  order: number;
}

export type OrderFulfillmentStatus = 'created' | 'in_progress' | 'partially_completed' | 'completed';

export interface OrderItem {
  productId: string;
  name: string;
  icon: string;
  quantity: number | string;
  unit: string;
  department: string;
  price?: number | string;
  sum?: number | string;
  purchased?: boolean;
}

export interface WhatsAppConfig {
  phoneNumber: string;
  groupName: string;
  enabled: boolean;
}

export interface TelegramConfig {
  mode?: 'direct' | 'bot';
  directLink?: string;
  botToken: string;
  chatId: string;
  groupName: string;
  enabled: boolean;
}

export interface LineConfig {
  channelAccessToken: string;
  groupId: string;
  groupName: string;
  enabled: boolean;
}

export interface EmailConfig {
  recipients: string; // comma separated or single
  ccRecipients?: string;
  subjectTemplate: string;
  enabled: boolean;
}

export interface RestaurantDeliveryConfig {
  whatsapp: WhatsAppConfig;
  telegram: TelegramConfig;
  line: LineConfig;
  email: EmailConfig;
}

export interface RestaurantInfo {
  id: RestaurantId;
  name: string;
  indicator: string; // '🔴' or '🟢'
  tagline: string;
  badgeColor: string;
  themeColor: string;
  accentBorder: string;
  config: RestaurantDeliveryConfig;
}

export interface SavedOrder {
  id: string;
  orderNumber?: string; // Formatted as DDMMYY/01, e.g. 100926/01
  restaurantId: RestaurantId;
  restaurantName: string;
  indicator: string;
  customerName?: string;
  date: string;
  time: string;
  timestamp: number;
  items: OrderItem[];
  totalPositions: number;
  status: 'sent' | 'draft';
  sentChannels: string[];
  messageText: string;
  totalSum?: number;
  updatedAt?: string;
  updatedTimestamp?: number;
  isEdited?: boolean;
  fulfillmentStatus?: OrderFulfillmentStatus; // 'created' | 'in_progress' | 'partially_completed' | 'completed'
  completedAt?: string;
  completedTimestamp?: number;
  purchasedItemIds?: string[];
}
