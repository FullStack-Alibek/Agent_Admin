import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  CheckCircle,
  Percent,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { customerService, type CustomerDTO } from '@/services/customerService';
import { productService, type ProductDTO } from '@/services/productService';
import { extractErrorMessage, api } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';

export const FinancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'debts' | 'pricing'>('debts');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Credit modal
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDTO | null>(null);
  const [newCreditLimit, setNewCreditLimit] = useState(0);

  // Pricing modal
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);
  const [newWholesale, setNewWholesale] = useState(0);
  const [newSalePrice, setNewSalePrice] = useState(0);

  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ['finance', 'customers'],
    queryFn: () => customerService.list({ per_page: 100, sort: '-created_at' }),
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['finance', 'products'],
    queryFn: () => productService.list({ per_page: 100 }),
  });

  const customers = customersData?.items ?? [];
  const products = productsData?.items ?? [];

  const totalDebt = customers.reduce((acc, c) => acc + c.credit.current_balance, 0);
  const totalCreditLimit = customers.reduce((acc, c) => acc + c.credit.credit_limit, 0);

  // Credit limit update — mijozni yangilash orqali kredit limitini o'zgartiradi.
  const creditMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/customers/${selectedCustomer!.uuid}`, {
        credit_limit: Number(newCreditLimit),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCreditModalOpen(false);
      showToast('Mijoz kredit limiti yangilandi!');
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  const pricingMutation = useMutation({
    mutationFn: () =>
      productService.update(selectedProduct!.uuid, {
        wholesale_price: Number(newWholesale),
        sale_price: Number(newSalePrice),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsPricingModalOpen(false);
      showToast('Narx siyosati saqlandi!');
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  const renderError = () =>
    errorMessage && (
      <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{errorMessage}</span>
      </div>
    );

  const inputCls =
    'w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm';

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
            Moliya, Qarzlar & Narx Siyosati
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Qarz limitlari, ulgurji narxlar va chegirmalar (real ma'lumotlar).
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Umumiy Qarzdorlik</span>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-3">
            {formatCurrency(totalDebt)}
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Aktiv Kredit Limitlari</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {formatCurrency(totalCreditLimit)}
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Mijozlar soni</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">{customers.length}</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('debts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'debts' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Qarzlar & Kredit Limitlari
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pricing' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Narx Siyosati & Chegirmalar
        </button>
      </div>

      {/* DEBTS */}
      {activeTab === 'debts' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Mijozlar Qarzdorligi va Kredit Limitlari
            </h3>
            <p className="text-xs text-slate-500">
              Kredit limitidan oshgan mijozlar qizil rangda belgilanadi.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-6">Mijoz / Do'kon</th>
                  <th className="py-3 px-6">Telefon</th>
                  <th className="py-3 px-6">Joriy Qarz</th>
                  <th className="py-3 px-6">Kredit Limiti</th>
                  <th className="py-3 px-6">Holat</th>
                  <th className="py-3 px-6 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {loadingCustomers && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                )}
                {!loadingCustomers && customers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      Mijozlar topilmadi
                    </td>
                  </tr>
                )}
                {customers.map((c) => {
                  const isOverLimit = c.credit.current_balance > c.credit.credit_limit;
                  return (
                    <tr key={c.uuid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {c.company_name || c.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{c.name}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-500">{c.phone || '—'}</td>
                      <td className="py-4 px-6 font-bold text-rose-600">
                        {formatCurrency(c.credit.current_balance)}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(c.credit.credit_limit)}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isOverLimit
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}
                        >
                          {isOverLimit ? 'Limitdan oshgan' : 'Normal'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setErrorMessage(null);
                            setSelectedCustomer(c);
                            setNewCreditLimit(c.credit.credit_limit);
                            setIsCreditModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Limitni o'zgartirish
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRICING */}
      {activeTab === 'pricing' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Mahsulot Narxlari & Ulgurji Narxlar
            </h3>
            <p className="text-xs text-slate-500">Chakana, ulgurji narxlar va tannarx.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-6">Mahsulot</th>
                  <th className="py-3 px-6">SKU</th>
                  <th className="py-3 px-6">Tannarx</th>
                  <th className="py-3 px-6">Chakana narx</th>
                  <th className="py-3 px-6">Ulgurji narx</th>
                  <th className="py-3 px-6 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {loadingProducts && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                )}
                {!loadingProducts && products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      Mahsulotlar topilmadi
                    </td>
                  </tr>
                )}
                {products.map((p) => (
                  <tr key={p.uuid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="py-4 px-6 font-mono text-slate-500">{p.sku}</td>
                    <td className="py-4 px-6">{formatCurrency(p.cost_price)}</td>
                    <td className="py-4 px-6 font-bold">{formatCurrency(p.sale_price)}</td>
                    <td className="py-4 px-6 font-bold text-indigo-600">
                      {formatCurrency(p.wholesale_price)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setErrorMessage(null);
                          setSelectedProduct(p);
                          setNewWholesale(p.wholesale_price);
                          setNewSalePrice(p.sale_price);
                          setIsPricingModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Percent className="w-3.5 h-3.5" /> Narxni o'zgartirish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREDIT MODAL */}
      {isCreditModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-slate-900 dark:text-white text-base">Kredit Limitini Sozlash</h3>
              <button onClick={() => setIsCreditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setErrorMessage(null);
                creditMutation.mutate();
              }}
              className="p-6 space-y-4"
            >
              {renderError()}
              <div className="text-xs text-slate-500">
                Mijoz: <strong className="text-slate-800 dark:text-slate-200">{selectedCustomer.name}</strong>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Yangi Kredit Limiti (so'm)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newCreditLimit}
                  onChange={(e) => setNewCreditLimit(Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={creditMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  {creditMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRICING MODAL */}
      {isPricingModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-slate-900 dark:text-white text-base">Narxni O'zgartirish</h3>
              <button onClick={() => setIsPricingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setErrorMessage(null);
                pricingMutation.mutate();
              }}
              className="p-6 space-y-4"
            >
              {renderError()}
              <div className="text-xs text-slate-500">
                Mahsulot: <strong className="text-slate-800 dark:text-slate-200">{selectedProduct.name}</strong>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chakana narx (so'm)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newSalePrice}
                  onChange={(e) => setNewSalePrice(Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ulgurji narx (so'm)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newWholesale}
                  onChange={(e) => setNewWholesale(Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPricingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={pricingMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  {pricingMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
