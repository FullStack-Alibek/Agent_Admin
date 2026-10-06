import { api } from './api';

export interface ProfileDTO {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  locale?: string;
  timezone?: string;
  roles: string[];
}

export const profileService = {
  async show(): Promise<ProfileDTO> {
    const res = (await api.get('/profile')) as unknown as { data: ProfileDTO };
    return res.data;
  },

  async update(payload: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    locale?: string;
    timezone?: string;
  }): Promise<ProfileDTO> {
    const res = (await api.put('/profile', payload)) as unknown as { data: ProfileDTO };
    return res.data;
  },

  async changePassword(payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<void> {
    await api.put('/profile/password', payload);
  },
};
