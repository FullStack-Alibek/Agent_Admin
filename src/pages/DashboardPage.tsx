import React from 'react';
import {
  DollarSign,
  ShoppingBag,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import SalesChart, { type SalesChartPoint } from '@/components/shared/SalesChart';
import { dashboardService } from '@/services/dashboardService';
import { orderService } from '@/services/orderService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { OrderStatus } from '@/types';

const statusUzLabels: Record<OrderStatus, { label: string; color: string }> = {
  NEW: { label: 'Yangi', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' },
  CONFIRMED: { label: 'Tasdiqlangan', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
  PICKING: { label: 'Yig\'ilmoqda', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' },
  ON_THE_WAY: { label: 'Yo\'lda', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' },
  DELIVERED: { label: 'Yetkazib berildi', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
  CANCELLED: { label: 'Bekor qilingan', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' },
};

/** Backend'dan kelgan statistikani sahifa kutayotgan ko'rinishga moslaydi. */
const EMPTY_STATS = {
  dailySales: 0,
  dailySalesChange: 0,
  activeOrders: 0,
  deliveriesCount: 0,
  totalDebt: 0,
};

export const DashboardPage: React.FC = () => {
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardService.stats(),
  });

  const { data: chartData } = useQuery({
    queryKey: ['dashboard', 'sales-chart'],
    queryFn: () => dashboardService.salesChart(7),
  });

    const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: () => dashboardService.lowStock(),
  });

  const { data: recentOrdersPage } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => orderService.list({ per_page: 5, sort: '-created_at' }),
  });

  const recentOrders = recentOrdersPage?.items ?? [];

  const stats = statsData
    ? {
        dailySales: statsData.daily_sales,
        dailySalesChange: EMPTY_STATS.dailySalesChange,
        activeOrders: statsData.active_orders,
        deliveriesCount: 0,
        totalDebt: statsData.total_debt,
      }
    : EMPTY_STATS;

  // Backend nuqtalarini grafik kutayotgan ko'rinishga o'giramiz.
  const salesPoints: SalesChartPoint[] =
    chartData?.data?.map((point) => ({
      day: new Date(point.date).toLocaleDateString('uz-UZ', { weekday: 'short' }),
      sales: Number(point.total_sales),
      orders: Number(point.total_orders),
    })) ?? [];

  const lowStock = lowStockProducts.map((p) => ({
    id: String(p.id),
    name: p.name,
    sku: p.sku,
    stock: Number(p.total_stock),
    minStock: Number(p.min_stock),
    unit: p.unit?.name || p.unit?.code || 'dona',
  }));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Boshqaruv Paneli (Dashboard)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Tarqatish, savdo va yetkazib berish jarayonining real-vaqtdagi tahlili va ko'rsatkichlari.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3.5 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20 shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            Bugun: {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid - Stripe / Vercel Gradient Icon Container Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Kunlik Savdo */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kunlik Savdo</span>
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(stats.dailySales)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
              <span>+{stats.dailySalesChange}% kechagi kunga nisbatan</span>
            </div>
          </div>
        </div>

        {/* Faol Buyurtmalar */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Faol Buyurtmalar</span>
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.activeOrders} ta
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Hozirda yig‘ish va yo‘lda</span>
            </div>
          </div>
        </div>

        {/* Yetkazishlar soni */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Yetkazishlar (Bugun)</span>
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.deliveriesCount} ta
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>84% muvaffaqiyatli yakunlandi</span>
            </div>
          </div>
        </div>

        {/* Qarzdorlik summasi */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Umumiy Qarzdorlik</span>
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/25 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(stats.totalDebt)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
              <span>12 ta mijozda muddati o'tgan qarz</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Low Stock Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Haftalik Savdo Dinamikasi
              </h3>
              <p className="text-xs text-slate-500 font-medium">So'nggi 7 kunlik umumiy tushum tahlili</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
              So'm
            </span>
          </div>

                    <SalesChart data={salesPoints} />
        </div>

        {/* Low Stock Alerts Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Kam Qolgan Mahsulotlar
              </h3>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              {lowStockProducts.length} ta
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Omborda minimum zaxiradan kam qolgan tovarlar.</p>

          <div className="space-y-3 overflow-y-auto flex-1 max-h-64 pr-1 custom-scrollbar">
            {lowStock.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300 shrink-0">
                    {product.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {product.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">SKU: {product.sku}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20">
                    {product.stock} {product.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              So'nggi Faol Buyurtmalar
            </h3>
            <p className="text-xs text-slate-500">Hozirgi vaqtda bajarilayotgan buyurtmalar ro'yxati</p>
          </div>
          <button className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline">
            Barchasini ko'rish &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800/80">
                <th className="py-3 px-6">Buyurtma ID</th>
                <th className="py-3 px-6">Mijoz / Do'kon</th>
                <th className="py-3 px-6">Agent</th>
                <th className="py-3 px-6">Summa</th>
                <th className="py-3 px-6">Status (Holat)</th>
                <th className="py-3 px-6">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                            {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-slate-400 font-semibold">
                    Hozircha buyurtmalar mavjud emas
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const stInfo = statusUzLabels[order.status as OrderStatus] || {
                    label: order.status_label || order.status,
                    color: 'bg-slate-500/10 text-slate-500',
                  };
                  return (
                    <tr key={order.uuid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        {order.order_number}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {order.customer?.name || '—'}
                        </div>
                        <div className="text-[11px] text-slate-500">{order.customer?.phone || ''}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold">{order.salesperson?.full_name || '—'}</td>
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(order.totals.total_amount)}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border ${stInfo.color}`}
                        >
                          {stInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                        {formatDate(order.created_at || undefined)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
