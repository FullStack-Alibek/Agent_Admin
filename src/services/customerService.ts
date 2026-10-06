import { api } from './api';

export interface CustomerDTO {
  id: number;
  uuid: string;
  customer_code: string | null;
  type: string | null;
  name: string;
  company_name: string | null;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  segment: { id: number; uuid: string; name: string } | null;
  assigned_employee: { id: number; uuid: string; full_name: string } | null;
  location: {
    country_code: string | null;
    region: string | null;
    city: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  credit: {
    credit_limit: number;
    current_balance: number;
    available_credit: number;
    currency_code: string;
    payment_term_days: number;
  };
  notes: string | null;
  status: string | null;
  contacts?: unknown[];
  created_at: string | null;
  updated_at: string | null;
}

export interface PaginatedCustomers {
  items: CustomerDTO[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
}

export interface CustomerFilters {
  page?: number;
  per_page?: number;
  search?: string;
  type?: string;
  status?: string;
  sort?: string;
}

export const customerService = {
  async list(filters: CustomerFilters = {}): Promise<PaginatedCustomers> {
    const res = (await api.get('/customers', { params: filters })) as unknown as {
      data: PaginatedCustomers;
    };
    return res.data;
  },

  async show(uuid: string): Promise<CustomerDTO> {
    const res = (await api.get(`/customers/${uuid}`)) as unknown as { data: CustomerDTO };
    return res.data;
  },

  async create(payload: {
    name: string;
    type?: string;
    phone?: string;
    email?: string;
    company_name?: string;
    city?: string;
    address?: string;
    credit_limit?: number;
  }): Promise<CustomerDTO> {
    const res = (await api.post('/customers', payload)) as unknown as { data: CustomerDTO };
    return res.data;
  },
};
