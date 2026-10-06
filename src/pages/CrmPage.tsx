import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Eye,
  Phone,
  MapPin,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Wallet,
} from 'lucide-react';
import { customerService, type CustomerDTO } from '@/services/customerService';
import { orderService } from '@/services/orderService';
import { extractErrorMessage } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/formatters';

const segmentUzLabels: Record<string, { label: string; color: string }> = {
  vip: { label: 'VIP Mijoz', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' },
  wholesale: { label: 'Ulgurji', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' },
  regular: { label: 'Doimiy', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
  risky: { label: 'Xavfli', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' },
  new: { label: 'Yangi', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
};

const segmentOf = (customer: CustomerDTO) => customer.segment?.name?.toLowerCase() || '';

export const CrmPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('ALL');
  const [debtFilter, setDebtFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDTO | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 5000000,
    type: 'retail',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Drawer: body scroll lock + ESC
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isDrawerOpen]);

  // ---- Data ----
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['customers', { searchQuery, currentPage }],
    queryFn: () =>
      customerService.list({
        page: currentPage,
        per_page: perPage,
        search: searchQuery || undefined,
        sort: '-created_at',
      }),
  });

  // Mijozning buyurtmalari (drawer ochilganda)
  const { data: customerOrders } = useQuery({
    queryKey: ['orders', 'by-customer', selectedCustomer?.id],
    queryFn: () => orderService.list({ customer_id: selectedCustomer!.id, per_page: 20 }),
    enabled: isDrawerOpen && !!selectedCustomer,
  });

  const customers = (data?.items ?? []).filter((c) => {
    const segment = segmentOf(c);
    const matchesSegment = segmentFilter === 'ALL' || segment === segmentFilter.toLowerCase();
    const matchesDebt = !debtFilter || c.credit.current_balance > 0;
    return matchesSegment && matchesDebt;
  });
  const meta = data?.meta;

  const createMutation = useMutation({
    mutationFn: () =>
      customerService.create({
        name: formData.name.trim(),
        company_name: formData.companyName.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        credit_limit: Number(formData.creditLimit) || 0,
        type: formData.type,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCreateOpen(false);
      showToast('Yangi mijoz muvaffaqiyatli qo\'shildi!');
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
    <div className="space-y-6 relative animate-fadeIn">
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
            Mijozlar Boshqaruvi (CRM)
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Do'konlar bazasi, debitorlik qarzlari, segmentatsiya va mijoz profillari.
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMessage(null);
            setFormData({
              name: '',
              companyName: '',
              phone: '+998 90 ',
              email: '',
              address: '',
              creditLimit: 5000000,
              type: 'retail',
            });
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Yangi Mijoz Qo'shish
        </button>
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
            placeholder="Do'kon nomi, mijoz F.I.Sh yoki telefon..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <input
              type="checkbox"
              checked={debtFilter}
              onChange={(e) => setDebtFilter(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Faqat qarzdorlar
          </label>
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
          >
            <option value="ALL">Barcha Segmentlar</option>
            <option value="VIP">VIP</option>
            <option value="WHOLESALE">Ulgurji</option>
            <option value="REGULAR">Doimiy</option>
            <option value="RISKY">Xavfli</option>
            <option value="NEW">Yangi</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-6">Do'kon / Mijoz</th>
                <th className="py-3 px-6">Telefon / Manzil</th>
                <th className="py-3 px-6">Qarz Summasi</th>
                <th className="py-3 px-6">Kredit Limit</th>
                <th className="py-3 px-6">Segment</th>
                <th className="py-3 px-6 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-rose-500 font-semibold">
                    {extractErrorMessage(error)}
                  </td>
                </tr>
              )}
              {!isLoading && !isError && customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    Mijozlar topilmadi
                  </td>
                </tr>
              )}

              {customers.map((cust) => {
                const seg = segmentOf(cust);
                const segBadge = segmentUzLabels[seg] || {
                  label: cust.segment?.name || '—',
                  color: 'bg-slate-500/10 text-slate-500 border border-slate-500/20',
                };
                const overLimit = cust.credit.current_balance > cust.credit.credit_limit;
                return (
                  <tr key={cust.uuid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {cust.company_name || cust.name}
                      </div>
                      <div className="text-[11px] text-slate-500">{cust.name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {cust.phone || '—'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {cust.location.address || cust.location.city || '—'}
                      </div>
                    </td>
                    <td className={`py-4 px-6 font-bold ${overLimit ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {formatCurrency(cust.credit.current_balance)}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(cust.credit.credit_limit)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${segBadge.color}`}>
                        {segBadge.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setIsDrawerOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Profil
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
          <span>Jami {meta?.total ?? 0} ta mijoz</span>
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

      {/* CUSTOMER PROFILE DRAWER */}
      {isDrawerOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end p-0">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  {selectedCustomer.company_name || selectedCustomer.name}
                </h3>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  {selectedCustomer.name} · {selectedCustomer.customer_code || '—'}
                </span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block">Telefon:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedCustomer.phone || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Email:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedCustomer.email || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Manzil:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {selectedCustomer.location.address || '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Shahar:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {selectedCustomer.location.city || '—'}
                  </strong>
                </div>
              </div>

              {/* Debt summary */}
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> Joriy Qarz
                  </span>
                  <h4 className="text-xl font-black text-rose-700 dark:text-rose-300 mt-0.5">
                    {formatCurrency(selectedCustomer.credit.current_balance)}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Kredit Limiti</span>
                  <strong className="text-sm text-slate-900 dark:text-white">
                    {formatCurrency(selectedCustomer.credit.credit_limit)}
                  </strong>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Mavjud: {formatCurrency(selectedCustomer.credit.available_credit)}
                  </div>
                </div>
              </div>

              {/* Orders history */}
              <div className="space-y-3">
                <h4 className="font-black text-xs text-slate-700 dark:text-slate-300 uppercase">
                  Mijozning Buyurtmalar Tarixi
                </h4>
                <div className="space-y-2">
                  {(customerOrders?.items ?? []).length > 0 ? (
                    (customerOrders?.items ?? []).map((ord) => (
                      <div
                        key={ord.uuid}
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs"
                      >
                        <div>
                          <strong className="text-indigo-600 font-mono">{ord.order_number}</strong>
                          <div className="text-[11px] text-slate-400">{formatDate(ord.created_at || undefined)}</div>
                        </div>
                        <div className="text-right">
                          <strong className="text-slate-900 dark:text-white block">
                            {formatCurrency(ord.totals.total_amount)}
                          </strong>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded">
                            {ord.status_label || ord.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Buyurtmalar tarixi mavjud emas.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-5 py-2.5 bg-slate-900 text-white dark:bg-slate-800 rounded-xl text-xs font-bold"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOMER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-black text-slate-900 dark:text-white text-base">Yangi Mijoz Qo'shish</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setErrorMessage(null);
                createMutation.mutate();
              }}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              {renderError()}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mijoz F.I.Sh</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Anvar Karimov"
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Do'kon nomi</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder='"Nur" MChJ'
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Manzil</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Toshkent sh., Chilonzor..."
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kredit Limiti (so'm)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
