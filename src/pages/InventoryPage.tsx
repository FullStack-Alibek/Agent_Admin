import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Warehouse as WarehouseIcon,
  Plus,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle,
  Search,
  X,
  Loader2,
} from 'lucide-react';
import {
  inventoryService,
  type InventoryDTO,
  type StockMovementDTO,
} from '@/services/inventoryService';
import { productService } from '@/services/productService';
import { extractErrorMessage } from '@/services/api';
import { formatDate } from '@/utils/formatters';

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<number | ''>('');

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementForm, setMovementForm] = useState({
    productId: '',
    quantity: 50,
    type: 'IN' as 'IN' | 'OUT' | 'TRANSFER',
    fromWarehouseId: '',
    toWarehouseId: '',
    notes: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---- Data ----
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryService.warehouses(),
  });

  const { data: inventoryData, isLoading: loadingInventory } = useQuery({
    queryKey: ['inventory', { warehouseFilter }],
    queryFn: () =>
      inventoryService.inventory(warehouseFilter ? { warehouse_id: warehouseFilter } : {}),
    enabled: activeTab === 'stock',
  });

  const { data: movementsData, isLoading: loadingMovements } = useQuery({
    queryKey: ['inventory', 'movements', { warehouseFilter }],
    queryFn: () => inventoryService.movements(warehouseFilter || undefined),
    enabled: activeTab === 'movements',
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', 'for-inventory'],
    queryFn: () => productService.list({ per_page: 100 }),
  });

  const inventory = inventoryData?.items ?? [];
  const movements = movementsData?.items ?? [];
  const products = productsData?.items ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  const movementMutation = useMutation({
    mutationFn: () => {
      const productId = Number(movementForm.productId);
      const quantity = Number(movementForm.quantity);
      const notes = movementForm.notes || undefined;

      if (movementForm.type === 'IN') {
        return inventoryService.stockIn({
          warehouse_id: Number(movementForm.toWarehouseId),
          product_id: productId,
          quantity,
          notes,
        });
      }
      if (movementForm.type === 'OUT') {
        return inventoryService.stockOut({
          warehouse_id: Number(movementForm.toWarehouseId),
          product_id: productId,
          quantity,
          notes,
        });
      }
      return inventoryService.transfer({
        from_warehouse_id: Number(movementForm.fromWarehouseId),
        to_warehouse_id: Number(movementForm.toWarehouseId),
        product_id: productId,
        quantity,
        notes,
      });
    },
    onSuccess: () => {
      invalidate();
      setIsMovementModalOpen(false);
      showToast('Ombor harakati muvaffaqiyatli saqlandi!');
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  const openMovementModal = () => {
    setErrorMessage(null);
    setMovementForm({
      productId: products[0] ? String(products[0].id) : '',
      quantity: 50,
      type: 'IN',
      fromWarehouseId: warehouses[0] ? String(warehouses[0].id) : '',
      toWarehouseId: warehouses[0] ? String(warehouses[0].id) : '',
      notes: '',
    });
    setIsMovementModalOpen(true);
  };

  const filteredInventory = inventory.filter((inv: InventoryDTO) => {
    const name = inv.product?.name?.toLowerCase() || '';
    const sku = inv.product?.sku?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    const matchesSearch = name.includes(q) || sku.includes(q);
    const matchesLowStock = lowStockOnly ? inv.quantity <= (inv.min_quantity ?? 0) : true;
    return matchesSearch && matchesLowStock;
  });

  const lowStockCount = inventory.filter(
    (inv) => inv.quantity <= (inv.min_quantity ?? 0),
  ).length;

  const renderError = () =>
    errorMessage && (
      <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{errorMessage}</span>
      </div>
    );

  const movementTypeMeta = (type: string): { label: string; cls: string } => {
    switch (type) {
      case 'stock_in':
        return { label: 'Kirim', cls: 'bg-emerald-500/10 text-emerald-500' };
      case 'stock_out':
        return { label: 'Chiqim', cls: 'bg-rose-500/10 text-rose-500' };
      case 'transfer_in':
        return { label: 'Transfer (kirim)', cls: 'bg-indigo-500/10 text-indigo-500' };
      case 'transfer_out':
        return { label: 'Transfer (chiqim)', cls: 'bg-amber-500/10 text-amber-500' };
      default:
        return { label: type, cls: 'bg-slate-500/10 text-slate-500' };
    }
  };

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
            Ombor & Zaxira Boshqaruvi
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Omborlar sig'imi, qoldiqlar va kirim-chiqim harakatlari (real ma'lumotlar).
          </p>
        </div>
        <button
          onClick={openMovementModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Yangi Harakat Qo'shish
        </button>
      </div>

      {/* Warehouse cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {warehouses.slice(0, 3).map((wh) => (
          <div
            key={wh.uuid}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <WarehouseIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{wh.name}</h3>
                  <span className="text-xs text-slate-500">{wh.code}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500">
                {wh.status === 'active' ? 'Faol' : wh.status}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              {wh.address || 'Manzil ko\'rsatilmagan'}
            </div>
          </div>
        ))}
        {warehouses.length === 0 && (
          <p className="text-xs text-slate-400 col-span-3">Omborlar mavjud emas.</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'stock' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Ombor Qoldiqlari
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'movements' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Kirim / Chiqim Tarixi
        </button>
      </div>

      {/* STOCK TAB */}
      {activeTab === 'stock' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mahsulot nomi yoki SKU bo'yicha qidirish..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value ? Number(e.target.value) : '')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
            >
              <option value="">Barcha omborlar</option>
              {warehouses.map((w) => (
                <option key={w.uuid} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                lowStockOnly
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Kam qolgan ({lowStockCount})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold">
                  <th className="py-3 px-4">Mahsulot</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Ombor</th>
                  <th className="py-3 px-4">Qoldiq</th>
                  <th className="py-3 px-4">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingInventory && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                )}
                {!loadingInventory && filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                      Qoldiqlar topilmadi
                    </td>
                  </tr>
                )}
                {filteredInventory.map((inv) => {
                  const isLow = inv.quantity <= (inv.min_quantity ?? 0);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {inv.product?.name || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{inv.product?.sku || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {inv.warehouse?.name || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold">{inv.quantity}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] border ${
                            isLow
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}
                        >
                          {isLow ? 'Kam qoldi' : 'Yetarli'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MOVEMENTS TAB */}
      {activeTab === 'movements' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Ombor Harakatlari Jurnali
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold">
                  <th className="py-3 px-4">Turi</th>
                  <th className="py-3 px-4">Mahsulot</th>
                  <th className="py-3 px-4">Miqdori</th>
                  <th className="py-3 px-4">Ombor</th>
                  <th className="py-3 px-4">Izoh</th>
                  <th className="py-3 px-4">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {loadingMovements && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                )}
                {!loadingMovements && movements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      Harakatlar mavjud emas
                    </td>
                  </tr>
                )}
                {movements.map((sm: StockMovementDTO) => {
                  const meta = movementTypeMeta(sm.type);
                  return (
                    <tr key={sm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {sm.product?.name || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold">{sm.quantity}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {sm.warehouse?.name || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{sm.notes || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(sm.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MOVEMENT MODAL */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-slate-900 dark:text-white text-base">Yangi Harakat Qo'shish</h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setErrorMessage(null);
                movementMutation.mutate();
              }}
              className="p-6 space-y-4"
            >
              {renderError()}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mahsulot</label>
                <select
                  value={movementForm.productId}
                  onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                >
                  {products.map((p) => (
                    <option key={p.uuid} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Harakat Turi</label>
                <select
                  value={movementForm.type}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, type: e.target.value as 'IN' | 'OUT' | 'TRANSFER' })
                  }
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                >
                  <option value="IN">Kirim (IN)</option>
                  <option value="OUT">Chiqim (OUT)</option>
                  <option value="TRANSFER">O'tkazma (TRANSFER)</option>
                </select>
              </div>
              {movementForm.type === 'TRANSFER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Qaysi ombardan
                  </label>
                  <select
                    value={movementForm.fromWarehouseId}
                    onChange={(e) => setMovementForm({ ...movementForm, fromWarehouseId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                  >
                    {warehouses.map((w) => (
                      <option key={w.uuid} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {movementForm.type === 'TRANSFER' ? 'Qaysi omborga' : 'Ombor'}
                </label>
                <select
                  value={movementForm.toWarehouseId}
                  onChange={(e) => setMovementForm({ ...movementForm, toWarehouseId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                >
                  {warehouses.map((w) => (
                    <option key={w.uuid} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Miqdori</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({ ...movementForm, quantity: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Izoh</label>
                <input
                  type="text"
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                  placeholder="Izoh yozing..."
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={movementMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  {movementMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
