import { api } from './api';

export interface UserDTO {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: string | null;
  roles: string[];
  permissions: string[];
  last_login_at: string | null;
  created_at: string | null;
}

export interface PaginatedUsers {
  items: UserDTO[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
}

export interface UserFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  role?: string;
}

export interface UserPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  password?: string;
  role?: string;
  status?: string;
}

export const userService = {
  async list(filters: UserFilters = {}): Promise<PaginatedUsers> {
    const res = (await api.get('/users', { params: filters })) as unknown as {
      data: PaginatedUsers;
    };
    return res.data;
  },

  async create(payload: UserPayload): Promise<UserDTO> {
    const res = (await api.post('/users', payload)) as unknown as { data: UserDTO };
    return res.data;
  },

  async update(uuid: string, payload: Partial<UserPayload>): Promise<UserDTO> {
    const res = (await api.put(`/users/${uuid}`, payload)) as unknown as { data: UserDTO };
    return res.data;
  },

  async remove(uuid: string): Promise<void> {
    await api.delete(`/users/${uuid}`);
  },
};
