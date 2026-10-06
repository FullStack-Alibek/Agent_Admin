import { create } from 'zustand';
import { tokenStorage } from '@/services/api';

export interface AuthUser {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string | null;
  roles: string[];
  permissions: string[];
}

const USER_KEY = 'logidist-auth-user';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** Foydalanuvchida berilgan ruxsat bor-yo'qligini tekshiradi. */
  hasPermission: (permission: string) => boolean;
  /** Foydalanuvchida berilgan rollardan biri bor-yo'qligini tekshiradi. */
  hasRole: (role: string) => boolean;
  setUser: (user: AuthUser) => void;
  clear: () => void;
}

function readStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

const initialUser = readStoredUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  isAuthenticated: Boolean(initialUser),

  hasPermission: (permission) => {
    const user = get().user;
    if (!user) return false;
    // Super Admin — barcha ruxsatlarga ega.
    if (user.roles.includes('Super Admin')) return true;
    return user.permissions.includes(permission);
  },

  hasRole: (role) => Boolean(get().user?.roles.includes(role)),

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user, isAuthenticated: true });
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(USER_KEY);
    }
    // Xavfsizlik: logout'da token ham o'chirilishi shart.
    tokenStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
