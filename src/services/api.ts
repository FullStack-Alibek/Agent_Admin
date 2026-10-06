import axios, { AxiosError, AxiosInstance } from 'axios';

/**
 * Backend manzili. `.env` orqali o'zgartirish mumkin: VITE_API_URL.
 * Standart: Laravel'ning local API manzili.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const TOKEN_KEY = 'logidist-auth-token';

/** Token'ni xavfsiz o'qish/yozish/o'chirish uchun yordamchilar. */
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string): void => {
    if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear: (): void => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
  },
};

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Har bir so'rovga Bearer token qo'shamiz.
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Javobni to'g'ridan-to'g'ri `data` qilib qaytaramiz; 401 da tizimdan chiqaramiz.
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      // Faqat login sahifasida bo'lmasak, login sahifasiga yo'naltiramiz.
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/** Xato xabarini foydalanuvchiga ko'rsatish uchun matnga aylantiradi. */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;

    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first) && first.length > 0) return first[0];
    }
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Kutilmagan xatolik yuz berdi.';
}
