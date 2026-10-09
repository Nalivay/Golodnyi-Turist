import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  deleteDoc, 
  query, 
  orderBy, 
  Unsubscribe 
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signOut,
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { db, auth, googleAuthProvider } from './firebase';
import { SavedOrder, Product, Recipe, RestaurantId } from '../types';
import { getOrderEditingDeadline } from '../utils/orderEditing';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'superadmin' | 'restaurant_admin' | 'chef' | 'cook' | 'buyer';
  assignedRestaurants: RestaurantId[];
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Signs in using Google Authentication.
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return result.user;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error?.code !== 'auth/popup-closed-by-user') {
      console.warn('Google sign-in error:', err);
    }
    return null;
  }
}

/**
 * Signs out the current Firebase user.
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign-out error:', err);
  }
}

/**
 * Initializes Firebase Authentication state tracking and synchronizes the user profile in /users/{uid}.
 * Does not attempt anonymous auth, avoiding auth/admin-restricted-operation errors.
 */
export function initFirebaseAuth(
  onProfileLoaded?: (profile: UserProfile | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      if (onProfileLoaded) onProfileLoaded(null);
      return;
    }

    // If account is anonymous or legacy dummy account, reject and sign out
    if (user.isAnonymous || !user.email || user.email === 'staff@restaurant.app' || user.email.endsWith('@armminsk.internal')) {
      signOut(auth).catch(() => {});
      if (onProfileLoaded) onProfileLoaded(null);
      return;
    }

    // Authenticated user exists with real email
    const uid = user.uid;
    const isSuperAdminEmail = user.email?.toLowerCase() === 'avakartsuk@gmail.com';
    const userDocRef = doc(db, 'users', uid);

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        if (isSuperAdminEmail && data.role !== 'superadmin') {
          data.role = 'superadmin';
          await setDoc(userDocRef, { role: 'superadmin' }, { merge: true });
        }
        if (onProfileLoaded) onProfileLoaded(data);
      } else {
        const initialProfile: UserProfile = {
          uid,
          email: user.email,
          displayName: user.displayName || (isSuperAdminEmail ? 'Андрей (Владелец)' : 'Сотрудник кухни'),
          role: isSuperAdminEmail ? 'superadmin' : 'cook',
          assignedRestaurants: ['golodnyy_turist'],
          active: true,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, initialProfile, { merge: true });
        if (onProfileLoaded) onProfileLoaded(initialProfile);
      }
    } catch (err) {
      console.warn('Error loading user profile from Firestore:', err);
      // Fallback local profile
      if (onProfileLoaded) {
        onProfileLoaded({
          uid,
          email: user.email,
          displayName: user.displayName || (isSuperAdminEmail ? 'Андрей (Владелец)' : 'Сотрудник кухни'),
          role: isSuperAdminEmail ? 'superadmin' : 'cook',
          assignedRestaurants: ['golodnyy_turist'],
          active: true,
          createdAt: new Date().toISOString(),
        });
      }
    }
  });
}

/**
 * Subscribes to real-time orders for a specific restaurant:
 * /restaurants/{restaurantId}/orders
 * Any order placed or updated on Phone #1 will instantly appear on Phone #2!
 */
export function subscribeToOrders(
  restaurantId: RestaurantId,
  onOrdersUpdate: (orders: SavedOrder[]) => void
): Unsubscribe {
  const ordersCollection = collection(db, 'restaurants', restaurantId, 'orders');
  const q = query(ordersCollection, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const ordersList: SavedOrder[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const order = {
        ...data,
        id: docSnap.id,
      } as SavedOrder;

      if (order.purchasedItemIds && Array.isArray(order.purchasedItemIds) && Array.isArray(order.items)) {
        const set = new Set(order.purchasedItemIds);
        order.items = order.items.map(it => ({
          ...it,
          purchased: Boolean(it.purchased) || set.has(it.productId) || set.has(it.name),
        }));
      }

      ordersList.push(order);
    });
    onOrdersUpdate(ordersList);
  }, (err) => {
    console.warn(`Firestore orders listener error for ${restaurantId}:`, err);
  });
}

/**
 * Deep sanitization helper that strips any `undefined` values so Firestore setDoc never rejects the payload.
 */
function cleanPayloadForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    return value === undefined ? null : value;
  }));
}

/**
 * Saves or updates an order in Firestore with strict deadline validation.
 * After the 07:00 AM deadline, the composition of items (quantities, units, prices, positions)
 * is immutable and cannot be overwritten by client SDK requests.
 */
export async function saveOrderToFirestore(order: SavedOrder): Promise<void> {
  const deadline = getOrderEditingDeadline(order);
  const deadlineTimestamp = deadline.getTime();
  const isPastDeadline = Date.now() >= deadlineTimestamp;

  const docRef = doc(db, 'restaurants', order.restaurantId, 'orders', order.id);

  if (isPastDeadline) {
    // Past 07:00 AM deadline: items composition, quantities, prices, etc. CANNOT be modified.
    // Only fulfillment fields (status, timestamp, completed notes) can be updated.
    const fulfillmentData: Record<string, unknown> = {
      fulfillmentStatus: order.fulfillmentStatus || 'created',
      updatedTimestamp: Date.now(),
    };
    if (order.completedAt !== undefined) {
      fulfillmentData.completedAt = order.completedAt;
    }
    if (order.completedTimestamp !== undefined) {
      fulfillmentData.completedTimestamp = order.completedTimestamp;
    }
    if (order.purchasedItemIds !== undefined) {
      fulfillmentData.purchasedItemIds = order.purchasedItemIds;
    }
    await setDoc(docRef, cleanPayloadForFirestore(fulfillmentData), { merge: true });
    return;
  }

  // Before deadline: full order save allowed
  const dataToSave = {
    ...order,
    editDeadlineTimestamp: deadlineTimestamp,
    updatedTimestamp: Date.now(),
  };

  await setDoc(docRef, cleanPayloadForFirestore(dataToSave), { merge: true });
}

/**
 * Deletes an order from Firestore (authorized admins only).
 */
export async function deleteOrderFromFirestore(
  restaurantId: RestaurantId,
  orderId: string
): Promise<void> {
  const docRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
  await deleteDoc(docRef);
}

/**
 * Subscribes to real-time products for a specific restaurant:
 * /restaurants/{restaurantId}/products
 */
export function subscribeToProducts(
  restaurantId: RestaurantId,
  onProductsUpdate: (products: Product[]) => void
): Unsubscribe {
  const productsCollection = collection(db, 'restaurants', restaurantId, 'products');
  const q = query(productsCollection, orderBy('order', 'asc'));

  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const productsList: Product[] = [];
      snapshot.forEach((docSnap) => {
        productsList.push({
          ...docSnap.data(),
          id: docSnap.id,
        } as Product);
      });
      onProductsUpdate(productsList);
    }
  }, (err) => {
    console.warn(`Firestore products listener error for ${restaurantId}:`, err);
  });
}

/**
 * Saves a product to Firestore under the designated restaurant.
 */
export async function saveProductToFirestore(
  restaurantId: RestaurantId,
  product: Product
): Promise<void> {
  const docRef = doc(db, 'restaurants', restaurantId, 'products', product.id);
  const payload = cleanPayloadForFirestore({
    ...product,
    updatedAt: Date.now(),
  });
  await setDoc(docRef, payload, { merge: true });
}

/**
 * Deletes a product from Firestore for this restaurant.
 */
export async function deleteProductFromFirestore(
  restaurantId: RestaurantId,
  productId: string
): Promise<void> {
  const docRef = doc(db, 'restaurants', restaurantId, 'products', productId);
  await deleteDoc(docRef);
}

/**
 * Subscribes to real-time recipes for a specific restaurant:
 * /restaurants/{restaurantId}/recipes
 */
export function subscribeToRecipes(
  restaurantId: RestaurantId,
  onRecipesUpdate: (recipes: Recipe[]) => void
): Unsubscribe {
  const recipesCollection = collection(db, 'restaurants', restaurantId, 'recipes');

  return onSnapshot(recipesCollection, (snapshot) => {
    if (!snapshot.empty) {
      const recipesList: Recipe[] = [];
      snapshot.forEach((docSnap) => {
        recipesList.push({
          ...docSnap.data(),
          id: docSnap.id,
        } as Recipe);
      });
      onRecipesUpdate(recipesList);
    }
  }, (err) => {
    console.warn(`Firestore recipes listener error for ${restaurantId}:`, err);
  });
}

/**
 * Saves or updates a recipe card in Firestore with deep sanitization.
 */
export async function saveRecipeToFirestore(
  restaurantId: RestaurantId,
  recipe: Recipe
): Promise<void> {
  const docRef = doc(db, 'restaurants', restaurantId, 'recipes', recipe.id);
  const payload = cleanPayloadForFirestore({
    ...recipe,
    restaurantId,
    updatedAt: recipe.updatedAt || new Date().toISOString(),
  });
  await setDoc(docRef, payload, { merge: true });
}

/**
 * Deletes a recipe card from Firestore.
 */
export async function deleteRecipeFromFirestore(
  restaurantId: RestaurantId,
  recipeId: string
): Promise<void> {
  const docRef = doc(db, 'restaurants', restaurantId, 'recipes', recipeId);
  await deleteDoc(docRef);
}
