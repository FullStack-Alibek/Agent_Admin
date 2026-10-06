import { api } from './api';

/** Backend `/dashboard/stats` javobi. */
export interface DashboardStatsDTO {
  total_products: number;
  total_customers: number;
  total_orders: number;
  active_orders: number;
  daily_sales: number;
  monthly_sales: number;
  total_debt: number;
}

export interface SalesChartPoint {
  date: string;
  total_sales: number | string;
  total_orders: number;
}

export interface SalesChartDTO {
  period_days: number;
  data: SalesChartPoint[];
}

export interface LowStockProductDTO {
  id: number;
  uuid: string;
  name: string;
  sku: string;
  min_stock: number | string;
  total_stock: number | string;
  category?: { id: number; uuid: string; name: string } | null;
  unit?: { id: number; uuid: string; code: string; name: string } | null;
}

export const dashboardService = {
  async stats(): Promise<DashboardStatsDTO> {
    const res = (await api.get('/dashboard/stats')) as unknown as { data: DashboardStatsDTO };
    return res.data;
  },

  async salesChart(days = 7): Promise<SalesChartDTO> {
    const res = (await api.get('/dashboard/sales-chart', { params: { days } })) as unknown as {
      data: SalesChartDTO;
    };
    return res.data;
  },

  async lowStock(): Promise<LowStockProductDTO[]> {
    const res = (await api.get('/dashboard/low-stock')) as unknown as {
      data: LowStockProductDTO[];
    };
    return res.data;
  },
};
