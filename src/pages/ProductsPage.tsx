import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusCircle,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  CheckCircle,
  AlertTriangle,
  FolderTree,
  Barcode,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import {
  productService,
  type ProductDTO,
  type ProductPayload,
} from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { extractErrorMessage } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';

const productStatusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Faol', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
  inactive: { label: 'Nofaol', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20' },
  archived: { label: 'Arxivlangan', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' },
};

interface ProductForm {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  costPrice: number;
  salePrice: number;
  wholesalePrice: number;
  minStock: number;
  status: string;
}

const emptyForm: ProductForm = {
  name: '',
  sku: '',
  barcode: '',
  categoryId: '',
  costPrice: 0,
  salePrice: 0,
  wholesalePrice: 0,
  minStock: 0,
  status: 'active',
};

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);
  const [formData, setFormData] = useState<ProductForm>(emptyForm);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Body scroll lock for detail modal.
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

  // ---- Data ----
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products', { searchQuery, statusFilter, currentPage }],
    queryFn: () =>
      productService.list({
        page: currentPage,
        per_page: perPage,
        search: searchQuery || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.list(),
  });

  const products = data?.items ?? [];
  const meta = data?.meta;

  // ---- Mutations ----
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] });

  const createMutation = useMutation({
    mutationFn: (payload: ProductPayload) => productService.create(payload),
    onSuccess: () => {
      invalidate();
      setIsCreateOpen(false);
      showToast('Yangi mahsulot muvaffaqiyatli qo\'shildi!');
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: Partial<ProductPayload> }) =>
      productService.update(uuid, payload),
    onSuccess: () => {
      invalidate();
      setIsEditOpen(false);
      showToast('Mahsulot ma\'lumotlari yangilandi!');
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => productService.remove(uuid),
    onSuccess: () => {
      invalidate();
      setIsDeleteOpen(false);
      setSelectedProduct(null);
      showToast('Mahsulot o\'chirildi!');
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  // ---- Handlers ----
  const toPayload = (form: ProductForm): ProductPayload => ({
    name: form.name.trim(),
    sku: form.sku.trim(),
    barcode: form.barcode.trim() || null,
    category_id: form.categoryId ? Number(form.categoryId) : null,
    cost_price: Number(form.costPrice) || 0,
    sale_price: Number(form.salePrice) || 0,
    wholesale_price: Number(form.wholesalePrice) || 0,
    min_stock: Number(form.minStock) || 0,
    status: form.status,
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    createMutation.mutate(toPayload(formData));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setErrorMessage(null);
    updateMutation.mutate({ uuid: selectedProduct.uuid, payload: toPayload(formData) });
  };

  const openCreate = () => {
    setErrorMessage(null);
    setFormData({
      ...emptyForm,
      sku: `SKU-${Math.floor(Math.random() * 90000 + 10000)}`,
      categoryId: categories[0] ? String(categories[0].id) : '',
    });
    setIsCreateOpen(true);
  };

  const openEdit = (p: ProductDTO) => {
    setErrorMessage(null);
    setSelectedProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      categoryId: p.category ? String(p.category.id) : '',
      costPrice: p.cost_price,
      salePrice: p.sale_price,
      wholesalePrice: p.wholesale_price,
      minStock: p.min_stock,
      status: p.status,
    });
    setIsEditOpen(true);
  };

  const totalPages = meta?.last_page || 1;
  const from = meta && meta.total > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const to = meta ? Math.min(currentPage * perPage, meta.total) : 0;

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
            Mahsulotlar va Kategoriyalar
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Mahsulot CRUD, multi-narxlar va barkod boshqaruvi (real ma'lumotlar bazasi).
          </p>
        </div>
        <span className="text-xs font-bold px-3.5 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20 self-start sm:self-auto">
          {meta?.total ?? 0} ta mahsulot
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
            placeholder="Mahsulot nomi, SKU yoki barkod bo'yicha..."
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
          <option value="ALL">Barcha Statuslar</option>
          <option value="active">Faol</option>
          <option value="inactive">Nofaol</option>
          <option value="archived">Arxivlangan</option>
        </select>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/25 transition-all w-full sm:w-auto justify-center"
        >
          <PlusCircle className="w-4 h-4" />
          Yangi Mahsulot
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-6">Mahsulot</th>
                <th className="py-3 px-6">SKU / Barkod</th>
                <th className="py-3 px-6">Kategoriya</th>
                <th className="py-3 px-6">Narxlar (Asosiy / Ulgurji)</th>
                <th className="py-3 px-6">Status</th>
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

              {!isLoading && !isError && products.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    Mahsulotlar topilmadi
                  </td>
                </tr>
              )}

              {products.map((product) => {
                const stBadge = productStatusLabels[product.status] || {
                  label: product.status,
                  color: 'bg-slate-500/10 text-slate-500',
                };
                return (
                  <tr key={product.uuid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{product.name}</div>
                          <div className="text-[11px] text-slate-500">
                            Birlik: {product.unit?.name || product.unit?.code || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{product.sku}</div>
                      <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                        <Barcode className="w-3 h-3 text-indigo-500" /> {product.barcode || '—'}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold">{product.category?.name || '—'}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(product.sale_price)}
                      </div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        Ulgurji: {formatCurrency(product.wholesale_price)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${stBadge.color}`}>
                        {stBadge.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsDetailOpen(true);
                        }}
                        title="Ko'rish"
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(product)}
                        title="Tahrirlash"
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsDeleteOpen(true);
                        }}
                        title="O'chirish"
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
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
          <span>
            Jami {meta?.total ?? 0} ta mahsulotdan {from}-{to} ko'rsatilmoqda
          </span>
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

      {/* FORM MODAL (shared for create/edit) */}
      {(isCreateOpen || isEditOpen) && (
        <ProductFormModal
          title={isCreateOpen ? 'Yangi Mahsulot Qo\'shish' : 'Mahsulotni Tahrirlash'}
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          onClose={() => {
            setIsCreateOpen(false);
            setIsEditOpen(false);
          }}
          onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit}
          isSaving={createMutation.isPending || updateMutation.isPending}
          error={renderError()}
        />
      )}

      {/* DETAIL MODAL */}
      {isDetailOpen && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'transparent' }}
          onClick={() => setIsDetailOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" /> Mahsulot Tafsilotlari
              </h3>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{selectedProduct.name}</h4>
                <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  {selectedProduct.sku} | Barkod: {selectedProduct.barcode || '—'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <div>
                <span className="text-slate-400 block">Kategoriya:</span>
                <strong className="text-slate-800 dark:text-slate-200">{selectedProduct.category?.name || '—'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Brend:</span>
                <strong className="text-slate-800 dark:text-slate-200">{selectedProduct.brand?.name || '—'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Asosiy Narx:</span>
                <strong className="text-emerald-600 font-bold">{formatCurrency(selectedProduct.sale_price)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Ulgurji Narx:</span>
                <strong className="text-indigo-600 font-bold">{formatCurrency(selectedProduct.wholesale_price)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Tan Narx:</span>
                <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedProduct.cost_price)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Min. Zaxira:</span>
                <strong className="text-slate-800 dark:text-slate-200">{selectedProduct.min_stock}</strong>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
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

      {/* DELETE CONFIRMATION */}
      {isDeleteOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Mahsulotni o'chirish</h3>
            <p className="text-xs text-slate-500">
              Rostdan ham <strong className="text-slate-800 dark:text-slate-200">{selectedProduct.name}</strong>{' '}
              mahsulotini o'chirmoqchimisiz?
            </p>
            {renderError()}
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => deleteMutation.mutate(selectedProduct.uuid)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold shadow-md flex items-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Product form modal (create / edit)
// ---------------------------------------------------------------------------

interface ProductFormModalProps {
  title: string;
  formData: ProductForm;
  setFormData: React.Dispatch<React.SetStateAction<ProductForm>>;
  categories: { id: number; uuid: string; name: string }[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
  error: React.ReactNode;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  title,
  formData,
  setFormData,
  categories,
  onClose,
  onSubmit,
  isSaving,
  error,
}) => {
  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600" /> {title}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mahsulot Nomi</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Masalan: Pepsi 1.5L"
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">SKU Kod</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => set('sku', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Barkod</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => set('barcode', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategoriya</label>
              <select
                value={formData.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold cursor-pointer"
              >
                <option value="">— Tanlanmagan —</option>
                {categories.map((c) => (
                  <option key={c.uuid} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold cursor-pointer"
              >
                <option value="active">Faol</option>
                <option value="inactive">Nofaol</option>
                <option value="archived">Arxivlangan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tan Narx</label>
              <input
                type="number"
                min={0}
                value={formData.costPrice}
                onChange={(e) => set('costPrice', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Asosiy Narx</label>
              <input
                type="number"
                min={0}
                required
                value={formData.salePrice}
                onChange={(e) => set('salePrice', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ulgurji Narx</label>
              <input
                type="number"
                min={0}
                value={formData.wholesalePrice}
                onChange={(e) => set('wholesalePrice', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Minimal Zaxira (min stock)
            </label>
            <input
              type="number"
              min={0}
              value={formData.minStock}
              onChange={(e) => set('minStock', Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-md flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
