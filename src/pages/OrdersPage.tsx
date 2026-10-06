import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  Search,
  Eye,
  X,
  Loader2,
  AlertTriangle,
  Truck,
  Package,
  CheckCircle,
} from 'lucide-react';
import { orderService, type OrderDTO } from '@/services/orderService';
import { extractErrorMessage } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/formatters';

type OrderStatusKey =
  | 'NEW'
  | 'CONFIRMED'
  | 'PICKING'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

const statusMeta: Record<
  OrderStatusKey,
  { label: string; color: string; dot: string; next?: OrderStatusKey }
> = {
  NEW: {
    label: 'Yangi',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    dot: 'bg-amber-500',
    next: 'CONFIRMED',
  },
  CONFIRMED: {
    label: 'Tasdiqlangan',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30',
    dot: 'bg-blue-500',
    next: 'PICKING',
  },
  PICKING: {
    label: "Yig'ilmoqda",
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30',
    dot: 'bg-purple-500',
    next: 'ON_THE_WAY',
  },
  ON_THE_WAY: {
    label: "Yo'lda",
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30',
    dot: 'bg-indigo-500',
    next: 'DELIVERED',
  },
  DELIVERED: {
    label: 'Yetkazilgan',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Bekor qilingan',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30',
    dot: 'bg-rose-500',
  },
};

const statusFilters: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Barcha statuslar' },
  { value: 'NEW', label: 'Yangi' },
  { value: 'CONFIRMED', label: 'Tasdiqlangan' },
  { value: 'PICKING', label: "Yig'ilmoqda" },
  { value: 'ON_THE_WAY', label: "Yo'lda" },
  { value: 'DELIVERED', label: 'Yetkazilgan' },
  { value: 'CANCELLED', label: 'Bekor qilingan' },
];

export const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDTO | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (!isDetailOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsDetailOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isDetailOpen]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['orders', { statusFilter, searchQuery, currentPage }],
    queryFn: () =>
      orderService.list({
        page: currentPage,
        per_page: perPage,
        search: searchQuery || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        sort: '-created_at',
      }),
  });

  const orders = data?.items ?? [];
  const meta = data?.meta;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['orders'] });

  const statusMutation = useMutation({
    mutationFn: ({
      uuid,
      status,
      reason,
    }: {
      uuid: string;
      status: OrderStatusKey;
      reason?: string;
    }) => orderService.updateStatus(uuid, status, reason ? { reason } : {}),
    onSuccess: (_data, variables) => {
      invalidate();
      showToast(`Buyurtma holati o'zgartirildi: ${statusMeta[variables.status].label}`);
      setIsCancelOpen(false);
      setCancelReason('');
      setSelectedOrder(null);
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  const totalPages = meta?.last_page || 1;

  const renderError = () =>
    errorMessage && (
      <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{errorMessage}</span>
      </div>
    );

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
            Buyurtmalar Boshqaruvi
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Buyurtmalar, status oqimi va yetkazib berish jarayoni (real ma'lumotlar).
          </p>
        </div>
        <span className="text-xs font-bold px-3.5 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20 self-start sm:self-auto">
          {meta?.total ?? 0} ta buyurtma
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buyurtma raqami, mijoz nomi bo'yicha..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-xs w-full sm:w-auto"
        >
          {statusFilters.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-6">Buyurtma</th>
                <th className="py-3 px-6">Mijoz</th>
                <th className="py-3 px-6">Yetkazish manzili</th>
                <th className="py-3 px-6">Summa</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Sana</th>
                <th className="py-3 px-6 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={7} className="py-8 px-6 text-center text-rose-500 font-semibold">
                    {extractErrorMessage(error)}
                  </td>
                </tr>
              )}

              {!isLoading && !isError && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    Buyurtmalar topilmadi
                  </td>
                </tr>
              )}

              {orders.map((order) => {
                const st = statusMeta[order.status as OrderStatusKey] || {
                  label: order.status_label || order.status,
                  color: 'bg-slate-500/10 text-slate-500 border border-slate-500/20',
                  dot: 'bg-slate-500',
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
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                      {order.delivery?.address || '—'}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(order.totals.total_amount)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                      {formatDate(order.created_at || undefined)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailOpen(true);
                        }}
                        title="Batafsil"
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="py-4 px-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Jami {meta?.total ?? 0} ta buyurtma</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              Oldingi
            </button>
            <span className="font-bold">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              Keyingi
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {isDetailOpen && selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsDetailOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                Buyurtma: {selectedOrder.order_number}
              </h3>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {renderError()}

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">Mijoz</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {selectedOrder.customer?.name || '—'}
                  </strong>
                  <div className="text-slate-500 mt-0.5">{selectedOrder.customer?.phone || ''}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">Sotuvchi (Agent)</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {selectedOrder.salesperson?.full_name || '—'}
                  </strong>
                </div>
              </div>

              {/* Items table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-4">Mahsulot</th>
                      <th className="py-2.5 px-4 text-center">Miqdor</th>
                      <th className="py-2.5 px-4 text-right">Narx</th>
                      <th className="py-2.5 px-4 text-right">Jami</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.uuid}>
                        <td className="py-2.5 px-4 font-semibold">
                          {item.product_name_snapshot}
                          <div className="text-[10px] text-slate-400 font-mono">{item.sku_snapshot}</div>
                        </td>
                        <td className="py-2.5 px-4 text-center">{item.quantity}</td>
                        <td className="py-2.5 px-4 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="py-2.5 px-4 text-right font-bold">{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Oraliq jami:</span>
                    <span>{formatCurrency(selectedOrder.totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Chegirma:</span>
                    <span>-{formatCurrency(selectedOrder.totals.discount_amount)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-2">
                    <span>Umumiy summa:</span>
                    <span>{formatCurrency(selectedOrder.totals.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>To'langan:</span>
                    <span>{formatCurrency(selectedOrder.totals.paid_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {statusMeta[selectedOrder.status as OrderStatusKey]?.next && (
                  <button
                    onClick={() => {
                      const next = statusMeta[selectedOrder.status as OrderStatusKey].next!;
                      statusMutation.mutate({ uuid: selectedOrder.uuid, status: next });
                    }}
                    disabled={statusMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-md"
                  >
                    {statusMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Truck className="w-3.5 h-3.5" />
                    )}
                    Keyingi bosqich:{' '}
                    {statusMeta[statusMeta[selectedOrder.status as OrderStatusKey].next!].label}
                  </button>
                )}

                {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                  <button
                    onClick={() => setIsCancelOpen(true)}
                    disabled={statusMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Bekor qilish
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 text-xs font-bold"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION */}
      {isCancelOpen && selectedOrder && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white text-center">
              Buyurtmani bekor qilish
            </h3>
            <p className="text-xs text-slate-500 text-center">
              Bekor qilish sababini kiriting. Bu amalni qaytarib bo'lmaydi.
            </p>
            {renderError()}
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Sabab (majburiy)..."
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
            <div className="flex gap-3 justify-center pt-1">
              <button
                onClick={() => setIsCancelOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Yopish
              </button>
              <button
                disabled={!cancelReason.trim() || statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    uuid: selectedOrder.uuid,
                    status: 'CANCELLED',
                    reason: cancelReason.trim(),
                  })
                }
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold shadow-md flex items-center gap-2"
              >
                {statusMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
