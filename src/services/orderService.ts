import { api } from './api';

export interface OrderItemDTO {
  id: number;
  uuid: string;
  product_id: number;
  product_name_snapshot: string;
  sku_snapshot: string | null;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  line_total: number;
  shipped_quantity: number;
}

export interface OrderDTO {
  id: number;
  uuid: string;
  order_number: string;
  status: string;
  status_label: string | null;
  payment_status: string | null;
  customer: {
    id: number;
    uuid: string;
    name: string;
    customer_code: string | null;
    phone: string | null;
  } | null;
  salesperson: { id: number; uuid: string; full_name: string } | null;
  courier: { id: number; uuid: string; full_name: string } | null;
  items: OrderItemDTO[];
  totals: {
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    shipping_amount: number;
    total_amount: number;
    paid_amount: number;
    currency_code: string;
  };
  delivery: {
    type: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    expected_delivery_date: string | null;
  };
  note: string | null;
  cancel_reason: string | null;
  timeline: {
    confirmed_at: string | null;
    picking_at: string | null;
    on_the_way_at: string | null;
    delivered_at: string | null;
    cancelled_at: string | null;
  };
  created_at: string | null;
  updated_at: string | null;
}

export interface PaginatedOrders {
  items: OrderDTO[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
}

export interface OrderFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  customer_id?: number;
  date_from?: string;
  date_to?: string;
  sort?: string;
}

export const orderService = {
  async list(filters: OrderFilters = {}): Promise<PaginatedOrders> {
    const res = (await api.get('/orders', { params: filters })) as unknown as {
      data: PaginatedOrders;
    };
    return res.data;
  },

  async show(uuid: string): Promise<OrderDTO> {
    const res = (await api.get(`/orders/${uuid}`)) as unknown as { data: OrderDTO };
    return res.data;
  },

  async updateStatus(
    uuid: string,
    status: string,
    options: { note?: string; reason?: string; courier_id?: number } = {},
  ): Promise<OrderDTO> {
    const res = (await api.patch(`/orders/${uuid}/status`, { status, ...options })) as unknown as {
      data: OrderDTO;
    };
    return res.data;
  },

  async remove(uuid: string): Promise<void> {
    await api.delete(`/orders/${uuid}`);
  },
};
