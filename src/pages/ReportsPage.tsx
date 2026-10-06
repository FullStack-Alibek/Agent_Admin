import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  Loader2,
} from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { customerService } from '@/services/customerService';
import { orderService } from '@/services/orderService';
import { formatCurrency } from '@/utils/formatters';

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'sales' | 'inventory' | 'debt' | 'delivery'>('sales');
  const [chartDays, setChartDays] = useState<7 | 30>(7);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const { data: stats } = useQuery({
    queryKey: ['reports', 'stats'],
    queryFn: () => dashboardService.stats(),
  });

  const { data: salesChart } = useQuery({
    queryKey: ['reports', 'sales-chart', chartDays],
    queryFn: () => dashboardService.salesChart(chartDays),
  });

  const { data: lowStock = [] } = useQuery({
    queryKey: ['reports', 'low-stock'],
    queryFn: () => dashboardService.lowStock(),
    enabled: activeReport === 'inventory',
  });

  const { data: customersData } = useQuery({
    queryKey: ['reports', 'customers-debt'],
    queryFn: () => customerService.list({ per_page: 100, sort: '-created_at' }),
    enabled: activeReport === 'debt',
  });

  const { data: ordersData } = useQuery({
    queryKey: ['reports', 'orders'],
    queryFn: () => orderService.list({ per_page: 50, sort: '-created_at' }),
    enabled: activeReport === 'delivery',
  });

  const salesPoints = salesChart?.data ?? [];
  const debtCustomers = (customersData?.items ?? []).filter((c) => c.credit.current_balance > 0);
  const orders = ordersData?.items ?? [];

  const handleCsvExport = () => {
    const header = 'Sana,Savdo Hajmi (so\'m),Buyurtmalar Soni,O\'rtacha Chek (so\'m)';
    const rows = salesPoints.map((r) => {
      const sales = Number(r.total_sales);
      const orders = Number(r.total_orders);
      return `${r.date},${sales},${orders},${orders ? Math.round(sales / orders) : 0}`;
    });
    const csv = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `Hisobot_${chartDays}kun.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Hisobot yuklab olindi!');
  };

  const tabCls = (active: boolean) =>
    `px-4 py-2 rounded-xl text-xs font-bold transition-all ${
      active ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
    }`;

  return (
    <div className="space-y-6 relative">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Hisobotlar & Tahlillar
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Savdo, ombor, qarz va yetkazib berish hisobotlari (real ma'lumotlar).
          </p>
        </div>
        <button
          onClick={handleCsvExport}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/25 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          CSV-ga Yuklab Olish
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Kunlik Savdo</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(stats?.daily_sales ?? 0)}
          </h3>
          <span className="text-xs text-slate-500 font-bold">
            Oylik: {formatCurrency(stats?.monthly_sales ?? 0)}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Debitorlik Qarz</span>
            <DollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(stats?.total_debt ?? 0)}
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Faol Buyurtmalar</span>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats?.active_orders ?? 0}</h3>
          <span className="text-xs text-slate-500 font-bold">Jami: {stats?.total_orders ?? 0}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Mijozlar</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats?.total_customers ?? 0}</h3>
          <span className="text-xs text-slate-500 font-bold">Mahsulotlar: {stats?.total_products ?? 0}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap">
        <button onClick={() => setActiveReport('sales')} className={tabCls(activeReport === 'sales')}>
          Savdo Hisoboti
        </button>
        <button onClick={() => setActiveReport('inventory')} className={tabCls(activeReport === 'inventory')}>
          Ombor Hisoboti
        </button>
        <button onClick={() => setActiveReport('debt')} className={tabCls(activeReport === 'debt')}>
          Qarz Hisoboti
        </button>
        <button onClick={() => setActiveReport('delivery')} className={tabCls(activeReport === 'delivery')}>
          Buyurtmalar Hisoboti
        </button>
      </div>

      {/* SALES */}
      {activeReport === 'sales' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-slate-900 dark:text-white">Savdo Dinamikasi</h3>
            <select
              value={chartDays}
              onChange={(e) => setChartDays(Number(e.target.value) as 7 | 30)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
            >
              <option value={7}>Oxirgi 7 kun</option>
              <option value={30}>Oxirgi 30 kun</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold">
                  <th className="py-3 px-4">Sana</th>
                  <th className="py-3 px-4">Savdo Hajmi</th>
                  <th className="py-3 px-4">Buyurtmalar</th>
                  <th className="py-3 px-4">O'rtacha Chek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {salesPoints.map((row) => {
                  const sales = Number(row.total_sales);
                  const cnt = Number(row.total_orders);
                  return (
                    <tr key={row.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{row.date}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">{formatCurrency(sales)}</td>
                      <td className="py-3.5 px-4">{cnt} ta</td>
                      <td className="py-3.5 px-4">{formatCurrency(cnt ? sales / cnt : 0)}</td>
                    </tr>
                  );
                })}
                {salesPoints.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-semibold">
                      Ma'lumot mavjud emas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVENTORY */}
      {activeReport === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-black text-base text-slate-900 dark:text-white">
            Kam Qolgan Mahsulotlar ({lowStock.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold">
                  <th className="py-3 px-4">Mahsulot</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Qoldiq</th>
                  <th className="py-3 px-4">Min. Zaxira</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {lowStock.map((p) => (
                  <tr key={p.uuid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{p.sku}</td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">{p.total_stock}</td>
                    <td className="py-3.5 px-4">{p.min_stock}</td>
                  </tr>
                ))}
                {lowStock.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-semibold">
                      Kam qolgan mahsulot yo'q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEBT */}
      {activeReport === 'debt' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-black text-base text-slate-900 dark:text-white">
            Debitorlik Qarzlari ({debtCustomers.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold">
                  <th className="py-3 px-4">Mijoz / Do'kon</th>
                  <th className="py-3 px-4">Telefon</th>
                  <th className="py-3 px-4">Qarz Summasi</th>
                  <th className="py-3 px-4">Kredit Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {debtCustomers.map((c) => (
                  <tr key={c.uuid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {c.company_name || c.name}
                    </td>
                    <td className="py-3.5 px-4">{c.phone || '—'}</td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">
                      {formatCurrency(c.credit.current_balance)}
                    </td>
                    <td className="py-3.5 px-4">{formatCurrency(c.credit.credit_limit)}</td>
                  </tr>
                ))}
                {debtCustomers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-semibold">
                      Qarzdor mijozlar yo'q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS */}
      {activeReport === 'delivery' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-black text-base text-slate-900 dark:text-white">Buyurtmalar Hisoboti</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold">
                  <th className="py-3 px-4">Buyurtma ID</th>
                  <th className="py-3 px-4">Mijoz</th>
                  <th className="py-3 px-4">Summa</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {orders.map((o) => (
                  <tr key={o.uuid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-bold font-mono text-indigo-600">{o.order_number}</td>
                    <td className="py-3.5 px-4">{o.customer?.name || '—'}</td>
                    <td className="py-3.5 px-4 font-bold">{formatCurrency(o.totals.total_amount)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500">
                        {o.status_label || o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-semibold">
                      Buyurtmalar mavjud emas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
