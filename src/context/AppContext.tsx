import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  RestaurantId, 
  UserRole, 
  ScreenType,
  Recipe,
  RecipeVersion,
  Product, 
  OrderItem, 
  SavedOrder, 
  RestaurantDeliveryConfig 
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  ARMENIA_PRODUCTS,
  INITIAL_CONFIG_ARMENIA, 
  INITIAL_CONFIG_MINSK, 
  STORAGE_KEYS 
} from '../data/initialData';
import { INITIAL_RECIPES, reconcileRecipes, getCanonicalRestaurantId } from '../data/initialRecipes';
import { generateOrderNumber, normalizeOrderList } from '../utils/orderNumber';
import { isOrderEditable } from '../utils/orderEditing';
import { 
  isOrderToday, 
  getTodayActiveOrders, 
  getActiveRestaurantsToday, 
  parseQuantity,
  itemMatchesProduct
} from '../utils/orderFulfillment';
import { calculateOrderTotalSum } from '../utils/orderPricing';
import { formatOrderMessage } from '../services/deliveryService';
import { sortOrderItems, getDepartmentRank, getDepartmentDisplayName } from '../utils/orderSorting';
import { auth } from '../services/firebase';
import { 
  initFirebaseAuth, 
  signInWithGoogle,
  signOutUser,
  UserProfile,
  subscribeToOrders, 
  saveOrderToFirestore, 
  deleteOrderFromFirestore,
  subscribeToProducts,
  saveProductToFirestore,
  deleteProductFromFirestore,
  subscribeToRecipes,
  saveRecipeToFirestore,
  deleteRecipeFromFirestore
} from '../services/firestoreService';
import {
  isUserConnectedToDatabase,
  restoreDeviceSession,
  connectUserWithEmail,
  disconnectUserFromDatabase
} from '../services/deviceAuthService';

export type AppScreen = ScreenType;

interface AppContextType {
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;
  selectedRestaurant: RestaurantId;
  setSelectedRestaurant: (id: RestaurantId) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  // Firebase Auth & Profile
  firebaseProfile: UserProfile | null;
  loginWithGoogle: () => Promise<void>;
  logoutGoogle: () => Promise<void>;
  connectWithEmail: (email: string) => Promise<UserProfile>;
  disconnectDatabase: () => Promise<void>;
  isDatabaseConnected: boolean;
  connectedEmail: string | null;
  isDatabaseConnectModalOpen: boolean;
  openDatabaseConnectModal: () => void;
  closeDatabaseConnectModal: () => void;
  isDeviceConnected: (restaurantId: RestaurantId) => boolean;
  connectDevice: (restaurantId: RestaurantId) => Promise<void>;
  // Role Access & Auth
  isRecipesAdmin: boolean;
  isOrdersAdmin: boolean;
  isOwner: boolean;
  authenticateRole: (pinOrPassword: string, role: 'recipes' | 'orders' | 'owner') => boolean;
  logoutRole: (role?: 'recipes' | 'orders' | 'owner' | 'all') => void;
  // Recipes (Техкарты)
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  recipeRestaurant: RestaurantId | null;
  setRecipeRestaurant: (r: RestaurantId | null) => void;
  selectedRecipeId: string | null;
  setSelectedRecipeId: (id: string | null) => void;
  addRecipe: (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'currentVersion'>) => Recipe;
  updateRecipe: (id: string, updates: Partial<Recipe>, changeNote?: string) => Recipe | null;
  deleteRecipe: (id: string) => void;
  // Products
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProduct: (product: Omit<Product, 'id' | 'order'>, initialQuantity?: number | string) => Product;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  setProductUnitPrice: (productId: string, unitPrice: number | string, restaurantId?: RestaurantId) => void;
  deleteProduct: (id: string) => void;
  reorderProducts: (newOrder: Product[]) => void;
  orderItems: Record<string, OrderItem>; // productId -> OrderItem
  setOrderItemQuantity: (productId: string, quantity: number | string, unit?: string, department?: string, sum?: number | string, fallbackProduct?: Partial<Product>) => void;
  updateOrderItemUnit: (productId: string, unit: string) => void;
  updateOrderItemDepartment: (productId: string, department: string) => void;
  updateOrderItemSum: (productId: string, sum: number | string) => void;
  removeOrderItem: (productId: string) => void;
  clearCurrentOrder: () => void;
  editingOrderId: string | null;
  startEditingOrder: (order: SavedOrder) => void;
  cancelEditingOrder: () => void;
  orders: SavedOrder[];
  saveOrder: (order: Omit<SavedOrder, 'id' | 'timestamp'> & { id?: string; timestamp?: number }) => SavedOrder;
  deleteOrder: (id: string) => void;
  clearAllOrders: () => void;
  activeOrderForView: SavedOrder | null;
  setActiveOrderForView: (order: SavedOrder | null) => void;
  repeatOrder: (order: SavedOrder) => void;
  configArmenia: RestaurantDeliveryConfig;
  setConfigArmenia: React.Dispatch<React.SetStateAction<RestaurantDeliveryConfig>>;
  configMinsk: RestaurantDeliveryConfig;
  setConfigMinsk: React.Dispatch<React.SetStateAction<RestaurantDeliveryConfig>>;
  getActiveConfig: () => RestaurantDeliveryConfig;
  getCurrentFormattedDateTime: () => { date: string; time: string };
  currentTimeString: string;
  currentDateString: string;
  getNextOrderNumber: (restaurantId?: RestaurantId) => string;
  // Fulfillment helpers
  todayActiveOrders: SavedOrder[];
  activeRestaurantsCountToday: number;
  toggleOrderItemPurchased: (orderId: string, itemKeyOrProductId: string) => void;
  toggleCombinedItemPurchased: (productKey: string, forceTarget?: boolean) => void;
  completeOrderFulfillment: (orderId: string) => void;
  reopenOrderFulfillment: (orderId: string) => void;
  completeAllTodayOrders: () => void;
  reopenAllTodayOrders: () => void;
  // Voice order mode
  isVoiceOrderMode: boolean;
  setIsVoiceOrderMode: (active: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [selectedRestaurant, setSelectedRestaurantState] = useState<RestaurantId>(() => {
    return 'golodnyy_turist';
  });

  const [isVoiceOrderMode, setIsVoiceOrderModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('armminsk_voice_order_mode') === 'true';
    } catch {
      return false;
    }
  });

  const setIsVoiceOrderMode = (active: boolean) => {
    setIsVoiceOrderModeState(active);
    try {
      localStorage.setItem('armminsk_voice_order_mode', String(active));
    } catch {}
  };

  const [userRole, setUserRole] = useState<UserRole>('staff');

  // Role authentication state:
  // Note: recipes admin role is NOT permanently cached in localStorage so that editing always requires password 060926!
  // Orders composing role is saved permanently once entered (or for logged-in staff) for Golodnyy Turist.
  const [unlockedRoles, setUnlockedRoles] = useState<{
    recipes: boolean;
    orders: boolean;
    owner: boolean;
  }>(() => {
    try {
      const isOrdersUnlocked = localStorage.getItem('armminsk_orders_unlocked') === 'true';
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          recipes: false, // Always require password on recipes editing
          orders: Boolean(parsed.orders) || isOrdersUnlocked,
          owner: Boolean(parsed.owner),
        };
      }
      if (isOrdersUnlocked) {
        return { recipes: false, orders: true, owner: false };
      }
    } catch (e) {}
    return { recipes: false, orders: false, owner: false };
  });

  // Ensure recipes is kept false in persisted storage so cooks cannot bypass password,
  // while orders remains unlocked across sessions and restaurants
  useEffect(() => {
    try {
      const toPersist = {
        recipes: false,
        orders: unlockedRoles.orders,
        owner: unlockedRoles.owner,
      };
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(toPersist));
      if (unlockedRoles.orders) {
        localStorage.setItem('armminsk_orders_unlocked', 'true');
      }
    } catch (e) {}
  }, [unlockedRoles.orders, unlockedRoles.owner]);

  const [firebaseProfile, setFirebaseProfile] = useState<UserProfile | null>(null);

  // Initialize Firebase Authentication & synchronize staff profile
  useEffect(() => {
    const unsubscribe = initFirebaseAuth((profile) => {
      setFirebaseProfile(profile);
      if (profile) {
        const isSuperAdmin = profile.role === 'superadmin' || profile.email?.toLowerCase() === 'avakartsuk@gmail.com';
        setUnlockedRoles(prev => ({
          recipes: isSuperAdmin ? true : prev.recipes,
          orders: true, // Any authenticated employee or owner can compose orders for Golodnyy Turist!
          owner: isSuperAdmin ? true : prev.owner,
        }));
        try {
          localStorage.setItem('armminsk_orders_unlocked', 'true');
          if (profile.email) {
            localStorage.setItem('armminsk_user_email', profile.email);
            localStorage.setItem('armminsk_connected', 'true');
          }
        } catch (e) {}
      }
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const user = await signInWithGoogle();
    if (user) {
      const isSuperAdmin = user.email?.toLowerCase() === 'avakartsuk@gmail.com';
      setUnlockedRoles(prev => ({
        recipes: isSuperAdmin ? true : prev.recipes,
        orders: true,
        owner: isSuperAdmin ? true : prev.owner,
      }));
      try {
        localStorage.setItem('armminsk_orders_unlocked', 'true');
        if (user.email) {
          localStorage.setItem('armminsk_user_email', user.email);
          localStorage.setItem('armminsk_connected', 'true');
        }
      } catch (e) {}
    }
  };

  const logoutGoogle = async () => {
    await signOutUser();
    setFirebaseProfile(null);
    try {
      localStorage.removeItem('armminsk_user_email');
      localStorage.removeItem('armminsk_connected');
    } catch (e) {}
    logoutRole('all');
  };

  const connectWithEmail = async (email: string): Promise<UserProfile> => {
    const profile = await connectUserWithEmail(email, selectedRestaurant);
    setFirebaseProfile(profile);
    setUnlockedRoles(prev => ({ ...prev, orders: true }));
    try {
      localStorage.setItem('armminsk_orders_unlocked', 'true');
      localStorage.setItem('armminsk_user_email', profile.email);
      localStorage.setItem('armminsk_connected', 'true');
    } catch (e) {}
    return profile;
  };

  const [isDatabaseConnectModalOpen, setIsDatabaseConnectModalOpen] = useState(false);
  const openDatabaseConnectModal = () => setIsDatabaseConnectModalOpen(true);
  const closeDatabaseConnectModal = () => setIsDatabaseConnectModalOpen(false);

  const disconnectDatabase = async (): Promise<void> => {
    await disconnectUserFromDatabase();
    setFirebaseProfile(null);
    try {
      localStorage.removeItem('armminsk_user_email');
      localStorage.removeItem('armminsk_connected');
    } catch (e) {}
    setIsDatabaseConnectModalOpen(false);
  };

  const connectedEmail: string | null = (
    (firebaseProfile?.email && !firebaseProfile.email.endsWith('@armminsk.internal') && firebaseProfile.email !== 'staff@restaurant.app')
      ? firebaseProfile.email
      : (auth.currentUser?.email && !auth.currentUser.isAnonymous && !auth.currentUser.email.endsWith('@armminsk.internal') && auth.currentUser.email !== 'staff@restaurant.app')
        ? auth.currentUser.email
        : (typeof localStorage !== 'undefined' && localStorage.getItem('armminsk_user_email') && localStorage.getItem('armminsk_user_email') !== 'staff@restaurant.app' ? localStorage.getItem('armminsk_user_email') : null)
  );

  const isDatabaseConnected = Boolean(connectedEmail && isUserConnectedToDatabase());

  const isDeviceConnected = (_restaurantId: RestaurantId): boolean => {
    return isDatabaseConnected;
  };

  const connectDevice = async (_restaurantId: RestaurantId): Promise<void> => {
    // legacy alias
  };

  // Silently restore user Firebase Auth session for active restaurant
  useEffect(() => {
    restoreDeviceSession(selectedRestaurant).catch(() => {});
  }, [selectedRestaurant]);

  const isRecipesAdmin = unlockedRoles.recipes || unlockedRoles.owner;
  const isOrdersAdmin = unlockedRoles.orders || unlockedRoles.owner;
  const isOwner = unlockedRoles.owner;

  const authenticateRole = (pinOrPassword: string, role: 'recipes' | 'orders' | 'owner'): boolean => {
    const clean = pinOrPassword.trim().toLowerCase();
    let verified = false;

    setUnlockedRoles(prev => {
      const next = { ...prev };
      if (role === 'recipes') {
        if (clean === '060926' || clean === '8899' || clean === 'owner' || clean === 'owner2026') {
          verified = true;
          next.recipes = true;
        }
      } else if (role === 'orders') {
        if (clean === '260906' || clean === '8899' || clean === 'owner' || clean === 'owner2026') {
          verified = true;
          next.orders = true;
        }
      } else if (role === 'owner') {
        if (clean === '8899' || clean === 'owner2026' || clean === 'owner') {
          verified = true;
          next.owner = true;
          next.orders = true;
          next.recipes = true;
        }
      }

      if (verified) {
        try {
          localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(next));
        } catch (e) {}
      }

      return next;
    });

    return verified;
  };

  const logoutRole = (role?: 'recipes' | 'orders' | 'owner' | 'all') => {
    if (!role || role === 'all') {
      setUnlockedRoles({ recipes: false, orders: false, owner: false });
    } else if (role === 'recipes') {
      setUnlockedRoles(prev => ({ ...prev, recipes: false }));
    } else if (role === 'orders') {
      setUnlockedRoles(prev => ({ ...prev, orders: false }));
    } else if (role === 'owner') {
      setUnlockedRoles(prev => ({ ...prev, owner: false }));
    }
  };

  // Active restaurant selected specifically for Recipes (Техкарты) view: 'golodnyy_turist'
  const [recipeRestaurant, setRecipeRestaurant] = useState<RestaurantId | null>('golodnyy_turist');

  // Recipes (Техкарты) State - Unified collection for Golodnyy Turist (51 dishes)
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECIPES);
      if (saved) {
        const parsed: Recipe[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return reconcileRecipes(parsed);
        }
      }
    } catch (e) {}
    return reconcileRecipes([]);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    } catch (e) {}
  }, [recipes]);

  // Real-time synchronization of recipes from Firestore for Golodnyy Turist
  useEffect(() => {
    const unsubGolodnyy = subscribeToRecipes('golodnyy_turist', (remoteRecipes) => {
      if (remoteRecipes && remoteRecipes.length > 0) {
        const cleanRemote = remoteRecipes.map(r => ({ ...r, restaurantId: 'golodnyy_turist' as const }));
        setRecipes(prev => reconcileRecipes([...prev, ...cleanRemote]));
      }
    });

    return () => {
      unsubGolodnyy();
    };
  }, []);

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'currentVersion'>): Recipe => {
    const isoNow = new Date().toISOString();
    const today = isoNow.split('T')[0];
    const targetRestaurant: RestaurantId = 'golodnyy_turist';
    const newRecipe: Recipe = {
      ...recipeData,
      restaurantId: targetRestaurant,
      id: `rec-${Date.now()}`,
      currentVersion: '1.0',
      createdAt: today,
      updatedAt: isoNow,
      published: true,
      history: [
        {
          version: '1.0',
          updatedAt: isoNow,
          updatedBy: 'Шеф-повар',
          changeNote: 'Первоначальная редакция техкарты',
          data: {
            title: recipeData.title,
            category: recipeData.category,
            restaurantId: targetRestaurant,
            description: recipeData.description,
            ingredients: recipeData.ingredients,
            yieldWeight: recipeData.yieldWeight,
            prepTime: recipeData.prepTime,
            technology: recipeData.technology,
            plating: recipeData.plating,
            importantNotes: recipeData.importantNotes || '',
            chefTip: recipeData.chefTip || '',
          },
        },
      ],
    };

    setRecipes(prev => [newRecipe, ...prev]);

    try {
      const nextList = [newRecipe, ...recipes];
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }

    saveRecipeToFirestore(targetRestaurant, newRecipe).catch(err => console.warn('Sync recipe error:', err));
    return newRecipe;
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>, changeNote?: string): Recipe | null => {
    const target = recipes.find(r => r.id === id);
    if (!target) {
      console.warn(`Recipe with id ${id} not found`);
      return null;
    }

    const isoNow = new Date().toISOString();
    const oldRest: RestaurantId = target.restaurantId || getCanonicalRestaurantId(target);
    const newRest: RestaurantId = updates.restaurantId || getCanonicalRestaurantId(updates.title ? { title: updates.title } : target);

    // Calculate next version: e.g. 1.0 -> 1.1, 1.2 -> 1.3
    let nextVersion = '1.1';
    const parsedNum = parseFloat(target.currentVersion || '1.0');
    if (!isNaN(parsedNum)) {
      nextVersion = (parsedNum + 0.1).toFixed(1);
    }

    // Snapshot current state into history before applying changes
    const snapshot: RecipeVersion = {
      version: target.currentVersion || '1.0',
      updatedAt: target.updatedAt || isoNow,
      updatedBy: 'Шеф-повар',
      changeNote: changeNote || 'Редактирование технологической карты',
      data: {
        title: target.title,
        category: target.category,
        restaurantId: oldRest,
        description: target.description,
        ingredients: target.ingredients,
        yieldWeight: target.yieldWeight,
        prepTime: target.prepTime,
        technology: target.technology,
        plating: target.plating,
        importantNotes: target.importantNotes || '',
        chefTip: target.chefTip || '',
      },
    };

    const existingHistory = target.history || [];

    const updatedRecipe: Recipe = {
      ...target,
      ...updates,
      id: target.id,
      restaurantId: newRest,
      currentVersion: nextVersion,
      updatedAt: isoNow,
      history: [snapshot, ...existingHistory],
    };

    // 1. Immediately update React state
    setRecipes(prev => prev.map(rec => rec.id === id ? updatedRecipe : rec));

    // 2. Immediately persist to localStorage
    try {
      const nextList = recipes.map(r => r.id === id ? updatedRecipe : r);
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 3. Immediately persist to Firestore
    saveRecipeToFirestore(newRest, updatedRecipe).catch(err => console.warn('Sync recipe error:', err));
    if (oldRest !== newRest) {
      deleteRecipeFromFirestore(oldRest, id).catch(() => {});
    }

    return updatedRecipe;
  };

  const deleteRecipe = (id: string) => {
    const target = recipes.find(r => r.id === id);
    if (target) {
      const targetRest = target.restaurantId || getCanonicalRestaurantId(target);
      deleteRecipeFromFirestore(targetRest, id).catch(err => console.warn('Delete recipe error:', err));
    }
    setRecipes(prev => prev.filter(r => r.id !== id));
    if (selectedRecipeId === id) {
      setSelectedRecipeId(null);
    }
  };

  // Real-time date and time updated every 10 seconds
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const formatCurrentDateTime = (d: Date = now) => {
    const dateFormatted = d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const timeFormatted = d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return { date: dateFormatted, time: timeFormatted };
  };

  const currentDateTime = formatCurrentDateTime(now);

  const setSelectedRestaurant = (id: RestaurantId) => {
    setSelectedRestaurantState(id);
    localStorage.setItem(STORAGE_KEYS.SELECTED_RESTAURANT, id);
  };

  // Products Catalog - Unified Golodnyy Turist catalog (all 195 items, deduplicated, prices preserved)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const GT_CATALOG_UNIFIED_KEY = 'armminsk_gt_unified_catalog_v5';
      const isGtMigrated = localStorage.getItem(GT_CATALOG_UNIFIED_KEY);
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);

      if (!isGtMigrated) {
        let customItems: Product[] = [];
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              const baseNames = new Set(INITIAL_PRODUCTS.map(p => p.name.trim().toLowerCase()));
              customItems = parsed.filter(p => !baseNames.has(p.name.trim().toLowerCase()));
            }
          } catch (e) {}
        }
        const unified = [...INITIAL_PRODUCTS, ...customItems].map((p, idx) => ({
          ...p,
          order: idx + 1,
          restaurants: ['golodnyy_turist'] as RestaurantId[],
          pricesByRestaurant: {
            ...p.pricesByRestaurant,
            golodnyy_turist: p.pricesByRestaurant?.golodnyy_turist || p.defaultPrice || '',
          },
        }));
        localStorage.setItem(GT_CATALOG_UNIFIED_KEY, 'true');
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(unified));
        return unified;
      }

      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set<string>();
          const deduped: Product[] = [];
          for (const item of parsed) {
            const key = item.name.trim().toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              deduped.push({
                ...item,
                restaurants: ['golodnyy_turist'],
              });
            }
          }
          const existingKeys = new Set(deduped.map(p => p.name.trim().toLowerCase()));
          const missing = INITIAL_PRODUCTS.filter(ip => !existingKeys.has(ip.name.trim().toLowerCase()));
          if (missing.length > 0) {
            const fullList = [...deduped, ...missing].map((p, i) => ({
              ...p,
              order: i + 1,
              restaurants: ['golodnyy_turist'] as RestaurantId[],
            }));
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(fullList));
            return fullList;
          }
          return deduped;
        }
      }
    } catch (e) {}
    return INITIAL_PRODUCTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {}
  }, [products]);

  // Real-time synchronization of products for current restaurant
  useEffect(() => {
    const unsubscribe = subscribeToProducts(selectedRestaurant, (remoteProducts) => {
      if (remoteProducts && remoteProducts.length > 0) {
        setProducts(prev => {
          const remoteIds = new Set(remoteProducts.map(p => p.id));
          const otherRestaurantProducts = prev.filter(
            p => !p.restaurants || !p.restaurants.includes(selectedRestaurant) || !remoteIds.has(p.id)
          );
          return [...otherRestaurantProducts, ...remoteProducts];
        });
      }
    });
    return () => unsubscribe();
  }, [selectedRestaurant]);

  const addProduct = (
    productData: Omit<Product, 'id' | 'order'>, 
    initialQuantity?: number | string
  ): Product => {
    const currentRest = selectedRestaurant;
    // Strictly NO synchronization between restaurants: products belong ONLY to current restaurant
    const assignedRestaurants: RestaurantId[] = productData.restaurants && productData.restaurants.length > 0
      ? productData.restaurants
      : [currentRest];

    const targetDept = productData.defaultDepartment || '1';
    const targetPrice = productData.defaultPrice || '';
    const targetUnit = productData.defaultUnit || 'кг';
    const targetIcon = productData.icon || '📦';

    // Check if a product with the same name already exists in current restaurant's catalog
    const existingIndex = products.findIndex(
      p => p.name.trim().toLowerCase() === productData.name.trim().toLowerCase() &&
           (!p.restaurants || p.restaurants.includes(currentRest))
    );

    let savedProd: Product;

    if (existingIndex >= 0) {
      const existing = products[existingIndex];

      savedProd = {
        ...existing,
        name: productData.name,
        category: productData.category || existing.category,
        icon: productData.icon || existing.icon,
        imageUrl: productData.imageUrl !== undefined ? productData.imageUrl : existing.imageUrl,
        defaultUnit: targetUnit,
        defaultDepartment: targetDept,
        defaultPrice: targetPrice !== undefined && targetPrice !== '' ? targetPrice : existing.defaultPrice,
        pricePerKg: productData.pricePerKg !== undefined ? productData.pricePerKg : existing.pricePerKg,
        priceStatus: productData.priceStatus || existing.priceStatus,
        priceRangeNote: productData.priceRangeNote !== undefined ? productData.priceRangeNote : existing.priceRangeNote,
        aliases: productData.aliases || existing.aliases,
        departmentsByRestaurant: {
          ...(existing.departmentsByRestaurant || {}),
          ...(productData.departmentsByRestaurant || {}),
          [currentRest]: targetDept,
        },
        pricesByRestaurant: {
          ...(existing.pricesByRestaurant || {}),
          ...(productData.pricesByRestaurant || {}),
          [currentRest]: targetPrice !== undefined && targetPrice !== '' ? targetPrice : (existing.pricesByRestaurant?.[currentRest] || existing.defaultPrice || ''),
        },
        restaurants: assignedRestaurants,
      };

      setProducts(prev => prev.map((p, idx) => idx === existingIndex ? savedProd : p));
    } else {
      savedProd = {
        ...productData,
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        order: products.length + 1,
        icon: targetIcon,
        defaultUnit: targetUnit,
        defaultDepartment: targetDept,
        defaultPrice: targetPrice,
        departmentsByRestaurant: {
          ...(productData.departmentsByRestaurant || {}),
          [currentRest]: targetDept,
        },
        pricesByRestaurant: {
          ...(productData.pricesByRestaurant || {}),
          [currentRest]: targetPrice,
        },
        restaurants: assignedRestaurants,
      };

      setProducts(prev => [...prev, savedProd]);
    }

    // Atomically add to order items if initialQuantity is provided and valid
    if (initialQuantity !== undefined && initialQuantity !== '') {
      const numQty = typeof initialQuantity === 'number' ? initialQuantity : parseFloat(String(initialQuantity));
      if (!isNaN(numQty) && numQty > 0) {
        setOrderItems(prev => ({
          ...prev,
          [savedProd.id]: {
            productId: savedProd.id,
            name: savedProd.name,
            icon: savedProd.icon,
            quantity: numQty,
            unit: targetUnit,
            department: targetDept,
            sum: targetPrice,
          }
        }));
      }
    }

    saveProductToFirestore(currentRest, savedProd).catch(err => console.warn('Sync product error:', err));
    return savedProd;
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    const currentRest = selectedRestaurant;
    setProducts(prev => {
      const updatedList = prev.map(p => {
        if (p.id !== id) return p;
        const priceUpdated = updated.defaultPrice !== undefined && updated.defaultPrice !== '';
        const merged: Product = {
          ...p,
          ...updated,
          priceStatus: updated.priceStatus !== undefined ? updated.priceStatus : (priceUpdated ? 'confirmed' : p.priceStatus),
          priceRangeNote: updated.priceRangeNote !== undefined ? updated.priceRangeNote : (priceUpdated ? undefined : p.priceRangeNote),
          pricesByRestaurant: {
            ...(p.pricesByRestaurant || {}),
            ...(updated.pricesByRestaurant || {}),
            ...(updated.defaultPrice !== undefined ? { [currentRest]: updated.defaultPrice } : {}),
          },
        };
        saveProductToFirestore(currentRest, merged).catch(err => console.warn('Sync product update error:', err));
        return merged;
      });
      return updatedList;
    });

    // Keep active order item in sync if present
    setOrderItems(prev => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          ...prev[id],
          name: updated.name ?? prev[id].name,
          icon: updated.icon ?? prev[id].icon,
          unit: updated.defaultUnit ?? prev[id].unit,
          department: updated.defaultDepartment ?? prev[id].department,
          sum: updated.defaultPrice !== undefined ? updated.defaultPrice : prev[id].sum,
        }
      };
    });
  };

  /**
   * Sets the unit price (per 1 kg, per 1 pc/pack) for a product.
   * Confirms the price, clears warning badges, and persists to Firestore and localStorage.
   */
  const setProductUnitPrice = (
    productId: string, 
    unitPrice: number | string, 
    restaurantId?: RestaurantId
  ) => {
    const targetRest = restaurantId || selectedRestaurant;
    const numPrice = typeof unitPrice === 'number' ? unitPrice : parseFloat(String(unitPrice).replace(',', '.'));
    if (isNaN(numPrice) || numPrice < 0) return;

    const priceStr = numPrice === 0 ? '' : String(Math.round(numPrice * 100) / 100);
    const otherRest: RestaurantId = targetRest === 'minsk' ? 'armenia' : 'minsk';

    setProducts(prev => {
      const updatedList = prev.map(p => {
        if (p.id !== productId) return p;
        const merged: Product = {
          ...p,
          defaultPrice: priceStr,
          pricePerKg: (p.defaultUnit === 'кг' || !p.defaultUnit) ? priceStr : p.pricePerKg,
          priceStatus: priceStr ? 'confirmed' : p.priceStatus,
          priceRangeNote: priceStr ? undefined : p.priceRangeNote,
          pricesByRestaurant: {
            ...(p.pricesByRestaurant || {}),
            [targetRest]: priceStr,
            ...(!p.pricesByRestaurant?.[otherRest] ? { [otherRest]: priceStr } : {}),
          },
        };
        saveProductToFirestore(targetRest, merged).catch(err => console.warn('Sync product unit price error:', err));
        return merged;
      });
      return updatedList;
    });

    // Also update order item if currently active in draft order
    setOrderItems(prev => {
      if (!prev[productId]) return prev;
      const it = prev[productId];
      const q = typeof it.quantity === 'number' ? it.quantity : parseFloat(String(it.quantity)) || 1;
      const newSum = priceStr ? Math.round(q * numPrice * 100) / 100 : '';
      return {
        ...prev,
        [productId]: {
          ...it,
          sum: newSum,
        }
      };
    });
  };

  const deleteProduct = (id: string) => {
    const currentRest = selectedRestaurant;
    deleteProductFromFirestore(currentRest, id).catch(err => console.warn('Delete product error:', err));
    setProducts(prev => {
      return prev.map(p => {
        if (p.id !== id) return p;
        // If product was shared between both restaurants, unlink only from the current restaurant
        if (p.restaurants && p.restaurants.length > 1 && p.restaurants.includes(currentRest)) {
          return {
            ...p,
            restaurants: p.restaurants.filter(r => r !== currentRest),
          };
        }
        return null;
      }).filter((p): p is Product => p !== null);
    });
    setOrderItems(prev => {
      if (!prev[id]) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const reorderProducts = (newOrder: Product[]) => {
    const indexed = newOrder.map((p, idx) => ({ ...p, order: idx + 1 }));
    setProducts(indexed);
  };

  // Delivery configs
  const [configArmenia, setConfigArmenia] = useState<RestaurantDeliveryConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG_ARMENIA);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CONFIG_ARMENIA;
  });

  const [configMinsk, setConfigMinsk] = useState<RestaurantDeliveryConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG_MINSK);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CONFIG_MINSK;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG_ARMENIA, JSON.stringify(configArmenia));
  }, [configArmenia]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG_MINSK, JSON.stringify(configMinsk));
  }, [configMinsk]);

  const getActiveConfig = () => {
    return configArmenia || INITIAL_CONFIG_ARMENIA;
  };

  // Current Order in progress
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem>>({});

  const setOrderItemQuantity = (
    productId: string, 
    quantity: number | string, 
    unit?: string, 
    department?: string,
    sum?: number | string,
    fallbackProduct?: Partial<Product>
  ) => {
    const numQty = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    if (isNaN(numQty) || numQty <= 0) {
      removeOrderItem(productId);
      return;
    }

    const currentRest = selectedRestaurant;
    const product = products.find(p => p.id === productId) || fallbackProduct;
    if (!product && !orderItems[productId]) return;

    const prodName = product?.name || orderItems[productId]?.name || 'Товар';
    const prodIcon = product?.icon || orderItems[productId]?.icon || '📦';
    const prodUnit = unit || orderItems[productId]?.unit || product?.defaultUnit || 'кг';

    setOrderItems(prev => {
      const rawDeptCandidate = (
        department !== undefined && department !== ''
          ? department
          : (prev[productId]?.department || product?.departmentsByRestaurant?.[currentRest] || product?.defaultDepartment || product?.category || '')
      );
      const rank = getDepartmentRank(rawDeptCandidate, prodName);
      const resolvedDept = getDepartmentDisplayName(rank);

      let resolvedSum: string | number = '';
      if (sum !== undefined && sum !== '') {
        resolvedSum = sum;
      } else {
        // Automatically calculate sum: quantity × price
        const rawPrice = product?.pricesByRestaurant?.[currentRest] || product?.defaultPrice || '';
        const priceNum = parseFloat(rawPrice);
        if (!isNaN(priceNum) && priceNum > 0) {
          const calculated = Math.round(numQty * priceNum * 100) / 100;
          resolvedSum = calculated;
        } else if (prev[productId]?.sum !== undefined && prev[productId]?.sum !== '') {
          resolvedSum = prev[productId].sum;
        }
      }

      return {
        ...prev,
        [productId]: {
          productId,
          name: prodName,
          icon: prodIcon,
          quantity: numQty,
          unit: prodUnit,
          department: resolvedDept,
          sum: resolvedSum,
        }
      };
    });
  };

  const updateOrderItemUnit = (productId: string, unit: string) => {
    setOrderItems(prev => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          unit,
        }
      };
    });
  };

  const updateOrderItemDepartment = (productId: string, department: string) => {
    setOrderItems(prev => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          department,
        }
      };
    });
  };

  const updateOrderItemSum = (productId: string, sum: number | string) => {
    setOrderItems(prev => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          sum,
        }
      };
    });
  };

  const removeOrderItem = (productId: string) => {
    setOrderItems(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const clearCurrentOrder = () => {
    setOrderItems({});
  };

  // Order editing state
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const startEditingOrder = (order: SavedOrder) => {
    setSelectedRestaurant(order.restaurantId);
    setEditingOrderId(order.id);

    // Ensure all products from this order exist in catalog for this restaurant
    setProducts(prevProducts => {
      let changed = false;
      const updatedList = [...prevProducts];

      (order.items || []).forEach(item => {
        const prodIndex = updatedList.findIndex(
          p => p.id === item.productId || p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        );

        if (prodIndex === -1) {
          changed = true;
          updatedList.push({
            id: item.productId || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: item.name,
            icon: item.icon || '📦',
            defaultUnit: item.unit || 'кг',
            defaultDepartment: item.department || '1',
            defaultPrice: item.price ? String(item.price) : '',
            departmentsByRestaurant: {
              [order.restaurantId]: item.department || '1',
            },
            pricesByRestaurant: {
              [order.restaurantId]: item.price ? String(item.price) : '',
            },
            restaurants: [order.restaurantId],
            order: updatedList.length + 1,
          });
        }
      });

      return changed ? updatedList : prevProducts;
    });

    // Populate order items
    const itemsMap: Record<string, OrderItem> = {};
    (order.items || []).forEach(item => {
      const q = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity));
      if (!isNaN(q) && q > 0) {
        const prodId = item.productId || `prod-${item.name}`;
        itemsMap[prodId] = {
          ...item,
          productId: prodId,
        };
      }
    });
    setOrderItems(itemsMap);

    if (order.customerName) {
      try {
        localStorage.setItem('armminsk_customer_name', order.customerName);
      } catch (e) {}
    }

    setActiveOrderForView(order);
    setCurrentScreen('order');
  };

  const cancelEditingOrder = () => {
    setEditingOrderId(null);
    clearCurrentOrder();
  };

  // Saved Orders History - cleanly purged as requested by user
  const [orders, setOrders] = useState<SavedOrder[]>(() => {
    try {
      if (localStorage.getItem('armminsk_orders_purged_v2') !== 'true') {
        localStorage.removeItem(STORAGE_KEYS.ORDERS);
        localStorage.removeItem('armminsk_orders_v1');
        localStorage.setItem('armminsk_orders_purged_v2', 'true');
        return [];
      }
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = normalizeOrderList(parsed);
        return normalized.map(ord => {
          const sortedItems = sortOrderItems(ord.items || [], undefined, ord.restaurantId);
          const withSorted = { ...ord, items: sortedItems };
          withSorted.messageText = formatOrderMessage(withSorted, false);
          return withSorted;
        });
      }
    } catch (e) {}
    return [];
  });

  // Active order for inspection / paper view
  const [activeOrderForView, setActiveOrderForView] = useState<SavedOrder | null>(null);

  // Ensure any existing in-memory orders from previous sessions are normalized and strictly sorted by department
  useEffect(() => {
    setOrders(prev => {
      const normalized = normalizeOrderList(prev);
      const updated = normalized.map(ord => {
        const sortedItems = sortOrderItems(ord.items || [], products, ord.restaurantId);
        const withSorted = { ...ord, items: sortedItems };
        const freshMessage = formatOrderMessage(withSorted, false, products);
        return { ...withSorted, messageText: freshMessage };
      });
      const hasDiff = updated.some((ord, idx) => 
        ord.orderNumber !== prev[idx]?.orderNumber || 
        ord.messageText !== prev[idx]?.messageText ||
        JSON.stringify(ord.items) !== JSON.stringify(prev[idx]?.items)
      );
      return hasDiff ? updated : prev;
    });
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  // Real-time synchronization of orders from Firestore for Golodnyy Turist
  useEffect(() => {
    if (!isDatabaseConnected && !firebaseProfile) {
      return;
    }

    const unsubGolodnyy = subscribeToOrders('golodnyy_turist', (golodnyyOrders) => {
      setOrders(prev => {
        const otherOrders = prev.filter(o => o.restaurantId !== 'golodnyy_turist');
        const combined = [...golodnyyOrders, ...otherOrders];
        const normalized = normalizeOrderList(combined);
        return normalized.map(ord => {
          const sortedItems = sortOrderItems(ord.items || [], products, ord.restaurantId);
          const withSorted = { ...ord, items: sortedItems };
          withSorted.messageText = formatOrderMessage(withSorted, false, products);
          return withSorted;
        });
      });
    });

    return () => {
      unsubGolodnyy();
    };
  }, [isDatabaseConnected, firebaseProfile, products]);

  const getNextOrderNumber = (restaurantId?: RestaurantId): string => {
    return generateOrderNumber(restaurantId || selectedRestaurant, new Date(), orders);
  };

  const saveOrder = (orderData: Omit<SavedOrder, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): SavedOrder => {
    const targetRestaurant = orderData.restaurantId || selectedRestaurant;

    const cleanItems = (orderData.items || []).filter((item) => {
      if (!item) return false;
      const q = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity));
      return !isNaN(q) && q > 0;
    }).map(item => {
      const q = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity));
      const prod = products.find(p => p.id === item.productId || p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
      
      let itemPrice = item.price;
      if (itemPrice === undefined || itemPrice === '') {
        const catalogPrice = (prod?.pricesByRestaurant?.[targetRestaurant] !== undefined && prod.pricesByRestaurant[targetRestaurant] !== '')
          ? prod.pricesByRestaurant[targetRestaurant]
          : (prod?.defaultPrice || '');
        if (catalogPrice) itemPrice = catalogPrice;
      }

      let itemSum = item.sum;
      if ((itemSum === undefined || itemSum === '' || itemSum === 0) && itemPrice !== undefined && itemPrice !== '') {
        const numPrice = parseFloat(String(itemPrice).replace(',', '.'));
        if (!isNaN(numPrice) && numPrice > 0) {
          itemSum = Math.round(q * numPrice * 100) / 100;
        }
      }

      return {
        ...item,
        price: itemPrice,
        sum: itemSum,
        purchased: item.purchased ?? false,
      };
    });

    const calculatedTotalSum = calculateOrderTotalSum(cleanItems, products, targetRestaurant);

    // Synchronize catalog items for the target restaurant only (independent catalogs!)
    setProducts(prevProducts => {
      let changed = false;
      const updatedList = [...prevProducts];

      cleanItems.forEach(item => {
        const prodIndex = updatedList.findIndex(
          p => p.id === item.productId || p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        );

        const q = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity)) || 1;
        const rawSum = item.price !== undefined && item.price !== '' 
          ? parseFloat(String(item.price)) 
          : (item.sum !== undefined && item.sum !== '' ? parseFloat(String(item.sum)) : NaN);

        // Normalize to price per 1 unit
        const calculatedUnitPrice = !isNaN(rawSum) && rawSum > 0 && q > 0 
          ? String(Math.round((rawSum / q) * 100) / 100)
          : '';
        const itemDept = item.department || '1';

        if (prodIndex >= 0) {
          const currentProd = updatedList[prodIndex];
          const existingRestaurants = currentProd.restaurants || [targetRestaurant];
          const newRestaurants = existingRestaurants.includes(targetRestaurant)
            ? existingRestaurants
            : [...existingRestaurants, targetRestaurant];

          const prevDept = currentProd.departmentsByRestaurant?.[targetRestaurant] || currentProd.defaultDepartment;
          const prevPrice = currentProd.pricesByRestaurant?.[targetRestaurant] !== undefined
            ? currentProd.pricesByRestaurant[targetRestaurant]
            : currentProd.defaultPrice;

          const needsDeptUpdate = itemDept && prevDept !== itemDept;
          const needsPriceUpdate = calculatedUnitPrice !== '' && prevPrice !== calculatedUnitPrice;
          const needsConfirmationClear = calculatedUnitPrice !== '' && (currentProd.priceStatus === 'needs_confirmation' || Boolean(currentProd.priceRangeNote));
          const needsRestUpdate = !existingRestaurants.includes(targetRestaurant);

          if (needsDeptUpdate || needsPriceUpdate || needsConfirmationClear || needsRestUpdate) {
            changed = true;
            const updatedProd: Product = {
              ...currentProd,
              departmentsByRestaurant: {
                ...(currentProd.departmentsByRestaurant || {}),
                [targetRestaurant]: itemDept || currentProd.defaultDepartment,
              },
              pricesByRestaurant: {
                ...(currentProd.pricesByRestaurant || {}),
                [targetRestaurant]: calculatedUnitPrice !== '' ? calculatedUnitPrice : (currentProd.pricesByRestaurant?.[targetRestaurant] || currentProd.defaultPrice || ''),
              },
              defaultPrice: calculatedUnitPrice !== '' ? calculatedUnitPrice : currentProd.defaultPrice,
              pricePerKg: (currentProd.defaultUnit === 'кг' && calculatedUnitPrice !== '') ? calculatedUnitPrice : currentProd.pricePerKg,
              priceStatus: calculatedUnitPrice !== '' ? 'confirmed' : currentProd.priceStatus,
              priceRangeNote: calculatedUnitPrice !== '' ? undefined : currentProd.priceRangeNote,
              restaurants: newRestaurants,
            };
            updatedList[prodIndex] = updatedProd;
            saveProductToFirestore(targetRestaurant, updatedProd).catch(err => console.warn('Sync product on saveOrder error:', err));
          }
        } else {
          // A product in the order wasn't in the catalog - add it to target restaurant
          changed = true;
          const newProd: Product = {
            id: item.productId || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: item.name,
            icon: item.icon || '📦',
            defaultUnit: item.unit || 'кг',
            defaultDepartment: itemDept,
            defaultPrice: calculatedUnitPrice,
            pricePerKg: item.unit === 'кг' && calculatedUnitPrice ? calculatedUnitPrice : undefined,
            priceStatus: calculatedUnitPrice ? 'confirmed' : 'confirmed',
            departmentsByRestaurant: {
              [targetRestaurant]: itemDept,
            },
            pricesByRestaurant: {
              [targetRestaurant]: calculatedUnitPrice,
            },
            restaurants: [targetRestaurant],
            order: updatedList.length + 1,
          };
          updatedList.push(newProd);
          saveProductToFirestore(targetRestaurant, newProd).catch(err => console.warn('Sync new product on saveOrder error:', err));
        }
      });

      return changed ? updatedList : prevProducts;
    });

    // Check if editing an existing order
    const existingOrderId = editingOrderId || orderData.id;
    const existingOrder = existingOrderId ? orders.find(o => o.id === existingOrderId) : undefined;

    if (existingOrder) {
      // Check 07:00 deadline: non-owner cannot edit locked order
      if (!isOrderEditable(existingOrder) && !isOwner) {
        setEditingOrderId(null);
        return existingOrder;
      }

      const now = new Date();
      const updatedTimeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      
      const updatedOrder: SavedOrder = {
        ...existingOrder,
        ...orderData,
        id: existingOrder.id,
        orderNumber: existingOrder.orderNumber, // Retain original order number
        date: existingOrder.date, // Retain original creation date
        time: existingOrder.time, // Retain original creation time
        timestamp: existingOrder.timestamp, // Retain original creation timestamp
        items: sortOrderItems(cleanItems, products, targetRestaurant),
        totalPositions: cleanItems.length,
        totalSum: calculatedTotalSum,
        isEdited: true,
        updatedAt: updatedTimeStr,
        updatedTimestamp: Date.now(),
        messageText: '',
      };
      updatedOrder.messageText = formatOrderMessage(updatedOrder, false, products);

      setOrders(prev => prev.map(o => o.id === existingOrder.id ? updatedOrder : o));
      saveOrderToFirestore(updatedOrder).catch(err => console.warn('Sync order update error:', err));
      setEditingOrderId(null);
      return updatedOrder;
    }

    const assignedNumber = orderData.orderNumber || generateOrderNumber(targetRestaurant, new Date(), orders);
    const newOrder: SavedOrder = {
      ...orderData,
      restaurantId: targetRestaurant,
      orderNumber: assignedNumber,
      items: sortOrderItems(cleanItems, products, targetRestaurant),
      totalPositions: cleanItems.length,
      totalSum: calculatedTotalSum,
      fulfillmentStatus: orderData.fulfillmentStatus || 'created',
      id: `ord-${Date.now()}`,
      timestamp: Date.now(),
      messageText: '',
    };
    newOrder.messageText = formatOrderMessage(newOrder, false, products);

    setOrders(prev => [newOrder, ...prev]);
    saveOrderToFirestore(newOrder).catch(err => console.warn('Sync order save error:', err));
    setEditingOrderId(null);
    return newOrder;
  };

  // Fulfillment computing & operations
  const todayActiveOrders = useMemo(() => {
    return getTodayActiveOrders(orders, now);
  }, [orders, now]);

  const activeRestaurantsCountToday = useMemo(() => {
    return getActiveRestaurantsToday(orders, now).length;
  }, [orders, now]);

  const toggleOrderItemPurchased = (orderId: string, itemKeyOrProductId: string) => {
    setOrders(prevOrders => {
      return prevOrders.map(order => {
        if (order.id !== orderId) return order;

        let changed = false;
        const newItems = (order.items || []).map(item => {
          if (itemMatchesProduct(item, itemKeyOrProductId)) {
            changed = true;
            return { ...item, purchased: !item.purchased };
          }
          return item;
        });

        if (!changed) return order;

        const validItems = newItems.filter(it => parseQuantity(it.quantity) > 0);
        const purchasedCount = validItems.filter(it => Boolean(it.purchased)).length;
        
        let newStatus = order.fulfillmentStatus || 'created';
        if (purchasedCount === 0) {
          newStatus = 'created';
        } else if (purchasedCount === validItems.length) {
          newStatus = order.fulfillmentStatus === 'completed' ? 'completed' : 'in_progress';
        } else {
          newStatus = 'partially_completed';
        }

        const purchasedIds = newItems.filter(it => Boolean(it.purchased)).map(it => it.productId || it.name);
        const updatedOrder: SavedOrder = {
          ...order,
          items: newItems,
          purchasedItemIds: purchasedIds,
          fulfillmentStatus: newStatus,
          completedAt: newStatus === 'completed' ? order.completedAt : undefined,
          completedTimestamp: newStatus === 'completed' ? order.completedTimestamp : undefined,
        };

        saveOrderToFirestore(updatedOrder).catch(err => console.warn('Sync fulfillment error:', err));
        setActiveOrderForView(prev => (prev && prev.id === orderId ? updatedOrder : prev));
        return updatedOrder;
      });
    });
  };

  const toggleCombinedItemPurchased = (productKey: string, forceTarget?: boolean) => {
    setOrders(prevOrders => {
      // Find all orders for today (both active and completed)
      const todayOrders = prevOrders.filter(o => isOrderToday(o, now));
      
      // Check if all matching items in today's orders are already purchased
      let matchingCount = 0;
      let allCurrentlyPurchased = true;

      for (const ord of todayOrders) {
        for (const item of ord.items || []) {
          if (itemMatchesProduct(item, productKey)) {
            matchingCount++;
            if (!item.purchased) {
              allCurrentlyPurchased = false;
            }
          }
        }
      }

      // If all were purchased, toggle them off (false). Otherwise mark all as purchased (true).
      const nextTarget = forceTarget !== undefined ? forceTarget : !allCurrentlyPurchased;

      return prevOrders.map(order => {
        if (!isOrderToday(order, now)) return order;

        let changed = false;
        const newItems = (order.items || []).map(item => {
          if (itemMatchesProduct(item, productKey)) {
            changed = true;
            return { ...item, purchased: nextTarget };
          }
          return item;
        });

        if (!changed) return order;

        const validItems = newItems.filter(it => parseQuantity(it.quantity) > 0);
        const purchasedCount = validItems.filter(it => Boolean(it.purchased)).length;
        
        let newStatus = order.fulfillmentStatus || 'created';
        if (purchasedCount === 0) {
          newStatus = 'created';
        } else if (purchasedCount === validItems.length) {
          newStatus = order.fulfillmentStatus === 'completed' ? 'completed' : 'in_progress';
        } else {
          newStatus = 'partially_completed';
        }

        const purchasedIds = newItems.filter(it => Boolean(it.purchased)).map(it => it.productId || it.name);
        const updatedOrder: SavedOrder = {
          ...order,
          items: newItems,
          purchasedItemIds: purchasedIds,
          fulfillmentStatus: newStatus,
          completedAt: newStatus === 'completed' ? order.completedAt : undefined,
          completedTimestamp: newStatus === 'completed' ? order.completedTimestamp : undefined,
        };

        saveOrderToFirestore(updatedOrder).catch(err => console.warn('Sync fulfillment error:', err));
        setActiveOrderForView(prev => (prev && prev.id === order.id ? updatedOrder : prev));
        return updatedOrder;
      });
    });
  };

  const completeOrderFulfillment = (orderId: string) => {
    const { date, time } = formatCurrentDateTime(new Date());
    setOrders(prevOrders => {
      return prevOrders.map(order => {
        if (order.id !== orderId) return order;
        const updatedItems = (order.items || []).map(it => ({ ...it, purchased: true }));
        const purchasedIds = updatedItems.map(it => it.productId || it.name);
        const updatedOrder: SavedOrder = {
          ...order,
          items: updatedItems,
          purchasedItemIds: purchasedIds,
          fulfillmentStatus: 'completed',
          completedAt: `${date} · ${time}`,
          completedTimestamp: Date.now(),
        };
        saveOrderToFirestore(updatedOrder).catch(err => console.warn('Sync completion error:', err));
        return updatedOrder;
      });
    });
  };

  const reopenOrderFulfillment = (orderId: string) => {
    setOrders(prevOrders => {
      return prevOrders.map(order => {
        if (order.id !== orderId) return order;
        const updatedOrder: SavedOrder = {
          ...order,
          purchasedItemIds: [],
          fulfillmentStatus: 'in_progress',
          completedAt: undefined,
          completedTimestamp: undefined,
        };
        saveOrderToFirestore(updatedOrder).catch(err => console.warn('Sync reopen error:', err));
        return updatedOrder;
      });
    });
  };

  const completeAllTodayOrders = () => {
    const { date, time } = formatCurrentDateTime(new Date());
    setOrders(prevOrders => {
      return prevOrders.map(order => {
        if (!isOrderToday(order, now)) return order;
        const updatedItems = (order.items || []).map(it => ({ ...it, purchased: true }));
        const purchasedIds = updatedItems.map(it => it.productId || it.name);
        const updatedOrder: SavedOrder = {
          ...order,
          items: updatedItems,
          purchasedItemIds: purchasedIds,
          fulfillmentStatus: 'completed',
          completedAt: order.completedAt || `${date} · ${time}`,
          completedTimestamp: order.completedTimestamp || Date.now(),
        };
        saveOrderToFirestore(updatedOrder).catch(err => console.warn('Sync complete all error:', err));
        return updatedOrder;
      });
    });
  };

  const reopenAllTodayOrders = () => {
    setOrders(prevOrders => {
      return prevOrders.map(order => {
        if (!isOrderToday(order, now)) return order;
        const updatedOrder: SavedOrder = {
          ...order,
          purchasedItemIds: [],
          fulfillmentStatus: 'in_progress',
          completedAt: undefined,
          completedTimestamp: undefined,
        };
        saveOrderToFirestore(updatedOrder).catch(err => console.warn('Sync reopen all error:', err));
        return updatedOrder;
      });
    });
  };

  const deleteOrder = (id: string) => {
    const target = orders.find(o => o.id === id);
    if (target) {
      deleteOrderFromFirestore(target.restaurantId, id).catch(err => console.warn('Sync delete order error:', err));
    }
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const clearAllOrders = () => {
    setOrders([]);
    setActiveOrderForView(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem('armminsk_orders_v1');
    } catch (e) {}
  };

  // Repeat past order
  const repeatOrder = (pastOrder: SavedOrder) => {
    // 1. Switch restaurant to match the past order
    setSelectedRestaurant(pastOrder.restaurantId);
    
    // 2. Ensure all items from past order are in products catalog so they are visible and editable
    setProducts(prevProducts => {
      let changed = false;
      const updatedList = [...prevProducts];

      (pastOrder.items || []).forEach(item => {
        const prodIndex = updatedList.findIndex(
          p => p.id === item.productId || p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        );

        if (prodIndex === -1) {
          changed = true;
          updatedList.push({
            id: item.productId || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: item.name,
            icon: item.icon || '📦',
            defaultUnit: item.unit || 'кг',
            defaultDepartment: item.department || '1',
            defaultPrice: '',
            departmentsByRestaurant: {
              golodnyy_turist: item.department || '1',
              [pastOrder.restaurantId]: item.department || '1',
            },
            pricesByRestaurant: {
              golodnyy_turist: '',
              [pastOrder.restaurantId]: '',
            },
            restaurants: ['golodnyy_turist'],
            order: updatedList.length + 1,
          });
        }
      });

      return changed ? updatedList : prevProducts;
    });

    // 3. Populate orderItems with items from the past order
    const itemsMap: Record<string, OrderItem> = {};
    pastOrder.items.forEach(item => {
      itemsMap[item.productId] = { ...item };
    });
    setOrderItems(itemsMap);

    // 4. Move to order screen
    setCurrentScreen('order');
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        selectedRestaurant,
        setSelectedRestaurant,
        userRole,
        setUserRole,
        firebaseProfile,
        loginWithGoogle,
        logoutGoogle,
        connectWithEmail,
        disconnectDatabase,
        isDatabaseConnected,
        connectedEmail,
        isDatabaseConnectModalOpen,
        openDatabaseConnectModal,
        closeDatabaseConnectModal,
        isDeviceConnected,
        connectDevice,
        isRecipesAdmin,
        isOrdersAdmin,
        isOwner,
        authenticateRole,
        logoutRole,
        recipes,
        setRecipes,
        recipeRestaurant,
        setRecipeRestaurant,
        selectedRecipeId,
        setSelectedRecipeId,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        products,
        setProducts,
        addProduct,
        updateProduct,
        setProductUnitPrice,
        deleteProduct,
        reorderProducts,
        orderItems,
        setOrderItemQuantity,
        updateOrderItemUnit,
        updateOrderItemDepartment,
        updateOrderItemSum,
        removeOrderItem,
        clearCurrentOrder,
        editingOrderId,
        startEditingOrder,
        cancelEditingOrder,
        orders,
        saveOrder,
        deleteOrder,
        clearAllOrders,
        activeOrderForView,
        setActiveOrderForView,
        repeatOrder,
        configArmenia,
        setConfigArmenia,
        configMinsk,
        setConfigMinsk,
        getActiveConfig,
        getCurrentFormattedDateTime: () => formatCurrentDateTime(new Date()),
        currentDateString: currentDateTime.date,
        currentTimeString: currentDateTime.time,
        getNextOrderNumber,
        todayActiveOrders,
        activeRestaurantsCountToday,
        toggleOrderItemPurchased,
        toggleCombinedItemPurchased,
        completeOrderFulfillment,
        reopenOrderFulfillment,
        completeAllTodayOrders,
        reopenAllTodayOrders,
        isVoiceOrderMode,
        setIsVoiceOrderMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
