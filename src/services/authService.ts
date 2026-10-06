import { api, tokenStorage } from './api';
import type { AuthUser } from '@/store/useAuthStore';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  expires_at: string | null;
  user: AuthUser;
}

interface MeResponse {
  success: boolean;
  data: AuthUser;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthUser> {
    const res = (await api.post('/auth/login', {
      email: payload.email,
      password: payload.password,
      device_name: 'admin-panel',
    })) as unknown as LoginResponse;

    tokenStorage.set(res.access_token);
    return res.user;
  },

  async me(): Promise<AuthUser> {
    const res = (await api.get('/auth/me')) as unknown as MeResponse;
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Token allaqachon yaroqsiz bo'lsa ham davom etamiz.
    } finally {
      tokenStorage.clear();
    }
  },
};
