import { api } from './api';

export interface RoleDTO {
  id: number;
  name: string;
  guard_name?: string;
  users_count?: number;
  permissions: string[];
}

export const roleService = {
  async list(): Promise<RoleDTO[]> {
    const res = (await api.get('/roles')) as unknown as { data: RoleDTO[] };
    return res.data;
  },

  async create(payload: { name: string; permissions?: string[] }): Promise<RoleDTO> {
    const res = (await api.post('/roles', payload)) as unknown as { data: RoleDTO };
    return res.data;
  },

  async update(id: number, payload: { name?: string; permissions?: string[] }): Promise<RoleDTO> {
    const res = (await api.put(`/roles/${id}`, payload)) as unknown as { data: RoleDTO };
    return res.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/roles/${id}`);
  },

  /** Mavjud barcha permission'lar (rol tahrirlash uchun). */
  async allPermissions(): Promise<{ id: number; name: string; module: string }[]> {
    const res = (await api.get('/roles/permissions/all')) as unknown as {
      data: { id: number; name: string; module: string }[];
    };
    return res.data;
  },
};
