import { api } from './api';

export interface CategoryDTO {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  parent_id: number | null;
  is_active: boolean;
  children?: CategoryDTO[];
}

interface PaginatedCategories {
  items: CategoryDTO[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
}

export const categoryService = {
  async list(perPage = 100): Promise<CategoryDTO[]> {
    const res = (await api.get('/categories', { params: { per_page: perPage } })) as unknown as {
      data: PaginatedCategories;
    };
    return res.data.items;
  },

  async create(payload: { name: string; parent_id?: number | null }): Promise<CategoryDTO> {
    const res = (await api.post('/categories', payload)) as unknown as { data: CategoryDTO };
    return res.data;
  },
};
