import { api } from './api';

/** Backend `ProductResource` javobi. */
export interface ProductDTO {
  id: number;
  uuid: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  image_url: string | null;
  category: { id: number; uuid: string; name: string } | null;
  brand: { id: number; uuid: string; name: string } | null;
  unit: { id: number; uuid: string; code: string; name: string } | null;
  cost_price: number;
  sale_price: number;
  wholesale_price: number;
  currency_code: string;
  tax_rate: number;
  min_stock: number;
  max_stock: number | null;
  status: string;
  is_active: boolean;
  is_trackable: boolean;
  has_variants: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface PaginatedProducts {
  items: ProductDTO[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
}

export interface ProductFilters {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: number | string;
  status?: string;
  min_price?: number;
  max_price?: number;
  sort?: string;
}

export interface ProductPayload {
  name: string;
  sku: string;
  barcode?: string | null;
  category_id?: number | null;
  brand_id?: number | null;
  unit_id?: number | null;
  description?: string | null;
  cost_price?: number;
  sale_price?: number;
  wholesale_price?: number;
  min_stock?: number;
  status?: string;
}

export const productService = {
  async list(filters: ProductFilters = {}): Promise<PaginatedProducts> {
    const res = (await api.get('/products', { params: filters })) as unknown as {
      data: PaginatedProducts;
    };
    return res.data;
  },

  async show(uuid: string): Promise<ProductDTO> {
    const res = (await api.get(`/products/${uuid}`)) as unknown as { data: ProductDTO };
    return res.data;
  },

  async create(payload: ProductPayload): Promise<ProductDTO> {
    const res = (await api.post('/products', payload)) as unknown as { data: ProductDTO };
    return res.data;
  },

  async update(uuid: string, payload: Partial<ProductPayload>): Promise<ProductDTO> {
    const res = (await api.put(`/products/${uuid}`, payload)) as unknown as { data: ProductDTO };
    return res.data;
  },

  async updateStatus(uuid: string, status: string): Promise<ProductDTO> {
    const res = (await api.patch(`/products/${uuid}/status`, { status })) as unknown as {
      data: ProductDTO;
    };
    return res.data;
  },

  async remove(uuid: string): Promise<void> {
    await api.delete(`/products/${uuid}`);
  },
};
