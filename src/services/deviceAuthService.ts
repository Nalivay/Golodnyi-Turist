import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  User,
  signOut
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { RestaurantId } from '../types';
import { UserProfile } from './firestoreService';

const USER_EMAIL_KEY = 'armminsk_user_email';
const USER_CONNECTED_KEY = 'armminsk_connected';
const USER_CREDS_KEY = 'armminsk_device_creds_email';

/**
 * Purges old deprecated pseudo-device accounts and caches from earlier test iterations.
 */
export function purgeDeprecatedDeviceData(): void {
  try {
    localStorage.removeItem('armminsk_device_connected_armenia');
    localStorage.removeItem('armminsk_device_connected_minsk');
    localStorage.removeItem('armminsk_device_creds_armenia');
    localStorage.removeItem('armminsk_device_creds_minsk');
    localStorage.removeItem('armminsk_device_uuid_v1');

    const savedEmail = localStorage.getItem('armminsk_user_email');
    if (!savedEmail || !savedEmail.includes('@') || savedEmail === 'staff@restaurant.app' || savedEmail.endsWith('@armminsk.internal')) {
      localStorage.removeItem('armminsk_user_email');
      localStorage.removeItem('armminsk_connected');
    }
  } catch {}

  // If currently authenticated with an anonymous account or legacy dummy/internal account, sign out immediately!
  const current = auth.currentUser;
  if (
    current &&
    (current.isAnonymous ||
     !current.email ||
     current.email.endsWith('@armminsk.internal') ||
     current.email === 'staff@restaurant.app')
  ) {
    signOut(auth).catch(() => {});
  }
}

/**
 * Checks if the user/device is connected to the common database with a valid real email.
 */
export function isUserConnectedToDatabase(): boolean {
  const current = auth.currentUser;
  // User must be authenticated with a REAL email, not anonymous and not a dummy account
  if (
    current &&
    !current.isAnonymous &&
    current.email &&
    current.email.includes('@') &&
    !current.email.endsWith('@armminsk.internal') &&
    current.email !== 'staff@restaurant.app'
  ) {
    return true;
  }

  try {
    const savedEmail = localStorage.getItem(USER_EMAIL_KEY);
    const isConn = localStorage.getItem(USER_CONNECTED_KEY);
    if (
      savedEmail &&
      savedEmail.includes('@') &&
      savedEmail !== 'staff@restaurant.app' &&
      !savedEmail.endsWith('@armminsk.internal') &&
      (isConn === 'true' || isConn === null)
    ) {
      return true;
    }
  } catch {}

  return false;
}

export function isDeviceConnectedToRestaurant(restaurantId?: RestaurantId): boolean {
  return isUserConnectedToDatabase();
}

/**
 * Connects the user to the shared Firebase base using their Google email (or any email).
 * Creates or signs in to Firebase Auth with a safe deterministic internal password.
 * No email confirmation required. No user-facing password needed.
 * Immediately saves profile to Firestore /users/{uid} and persists local state.
 */
export async function connectUserWithEmail(
  rawEmail: string,
  restaurantId?: RestaurantId
): Promise<UserProfile> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !email.includes('@') || !email.includes('.')) {
    throw new Error('Пожалуйста, введите корректный адрес email (например, ivan@gmail.com)');
  }

  // Safe deterministic internal password based on email
  const cleanEmail = email.replace(/[^a-zA-Z0-9]/g, '');
  const password = `ArmMinsk_${cleanEmail.substring(0, 12)}_2026!`;

  let user: User;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user = cred.user;
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error?.code === 'auth/email-already-in-use') {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        user = cred.user;
      } catch (signInErr: unknown) {
        console.warn('Sign in with existing email error:', signInErr);
        throw new Error('Этот email уже зарегистрирован. Вы можете войти в 1 клик через кнопку «Войти через Google».');
      }
    } else if (error?.code === 'auth/invalid-email') {
      throw new Error('Некорректный формат email. Пример: ivan@gmail.com');
    } else {
      console.error('Email registration error:', err);
      throw new Error('Не удалось подключиться к базе. Проверьте интернет-соединение.');
    }
  }

  const isSuperAdmin = email === 'avakartsuk@gmail.com';
  const userDocRef = doc(db, 'users', user.uid);
  const namePart = email.split('@')[0];
  const displayName = isSuperAdmin ? 'Андрей (Владелец)' : `Сотрудник (${namePart})`;

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName,
    role: isSuperAdmin ? 'superadmin' : 'cook',
    assignedRestaurants: ['golodnyy_turist'],
    active: true,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(userDocRef, profile, { merge: true });
  } catch (e) {
    console.warn('Could not write user profile to Firestore:', e);
  }

  try {
    localStorage.setItem(USER_EMAIL_KEY, email);
    localStorage.setItem(USER_CONNECTED_KEY, 'true');
    localStorage.setItem(
      USER_CREDS_KEY,
      JSON.stringify({ email, password, uid: user.uid })
    );
  } catch {
    // ignore
  }

  return profile;
}

/**
 * Disconnects user / logs out so they can re-enter or test the connection window.
 */
export async function disconnectUserFromDatabase(): Promise<void> {
  try {
    localStorage.removeItem(USER_EMAIL_KEY);
    localStorage.removeItem(USER_CONNECTED_KEY);
    localStorage.removeItem(USER_CREDS_KEY);
    localStorage.removeItem('armminsk_device_connected_armenia');
    localStorage.removeItem('armminsk_device_connected_minsk');
  } catch {}

  await signOut(auth).catch(() => {});
}

/**
 * Silently restores authentication session in the background if previously connected.
 */
export async function restoreDeviceSession(
  restaurantId?: RestaurantId
): Promise<boolean> {
  purgeDeprecatedDeviceData();

  if (auth.currentUser && auth.currentUser.email && !auth.currentUser.email.endsWith('@armminsk.internal')) {
    return true;
  }

  try {
    const emailCredsRaw = localStorage.getItem(USER_CREDS_KEY);
    if (emailCredsRaw) {
      const creds = JSON.parse(emailCredsRaw);
      if (creds.email && creds.password) {
        await signInWithEmailAndPassword(auth, creds.email, creds.password);
        return true;
      }
    }
  } catch (err) {
    console.warn('Silent session restore error:', err);
  }

  return false;
}
