import { api } from './api';

export interface WarehouseDTO {
  id: number;
  uuid: string;
  name: string;
  code: string;
  address: string | null;
  status: string;
}

export interface InventoryDTO {
  id: number;
  warehouse_id: number;
  product_id: number;
  quantity: number;
  min_quantity?: number;
  warehouse?: { id: number; name: string; code: string };
  product?: { id: number; name: string; sku: string };
}

export interface StockMovementDTO {
  id: number;
  warehouse_id: number;
  product_id: number;
  type: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  warehouse?: { id: number; name: string };
  product?: { id: number; name: string; sku: string };
}

interface Paginated<T> {
  items: T[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
}

export const inventoryService = {
  async warehouses(perPage = 100): Promise<WarehouseDTO[]> {
    const res = (await api.get('/warehouses', { params: { per_page: perPage } })) as unknown as {
      data: { items: WarehouseDTO[] };
    };
    return res.data.items;
  },

  async createWarehouse(payload: { name: string; code: string; address?: string; status?: string }) {
    const res = (await api.post('/warehouses', payload)) as unknown as { data: WarehouseDTO };
    return res.data;
  },

  async inventory(params: { warehouse_id?: number; product_id?: number } = {}): Promise<Paginated<InventoryDTO>> {
    const res = (await api.get('/inventory', { params })) as unknown as { data: Paginated<InventoryDTO> };
    return res.data;
  },

  async movements(warehouseId?: number): Promise<Paginated<StockMovementDTO>> {
    const res = (await api.get('/inventory/movements', {
      params: warehouseId ? { warehouse_id: warehouseId } : {},
    })) as unknown as { data: Paginated<StockMovementDTO> };
    return res.data;
  },

  async stockIn(payload: { warehouse_id: number; product_id: number; quantity: number; notes?: string }) {
    const res = (await api.post('/inventory/stock-in', payload)) as unknown as { data: StockMovementDTO };
    return res.data;
  },

  async stockOut(payload: { warehouse_id: number; product_id: number; quantity: number; notes?: string }) {
    const res = (await api.post('/inventory/stock-out', payload)) as unknown as { data: StockMovementDTO };
    return res.data;
  },

  async transfer(payload: {
    from_warehouse_id: number;
    to_warehouse_id: number;
    product_id: number;
    quantity: number;
    notes?: string;
  }) {
    const res = (await api.post('/inventory/transfer', payload)) as unknown as { data: unknown };
    return res.data;
  },
};
