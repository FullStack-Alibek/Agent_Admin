import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  Plus,
  Search,
  Shield,
  Edit,
  Trash2,
  CheckCircle,
  X,
  Loader2,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { userService, type UserDTO } from '@/services/userService';
import { roleService, type RoleDTO } from '@/services/roleService';
import { extractErrorMessage } from '@/services/api';
import { formatDate } from '@/utils/formatters';

const roleBadgeColor: Record<string, string> = {
  'Super Admin': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  Admin: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  Manager: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  Agent: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  Courier: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const EmployeesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'staff' | 'permissions'>('staff');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // User modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    status: 'active',
  });

  // Role modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDTO | null>(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (!isCreateOpen && !isEditOpen && !isRoleModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateOpen(false);
        setIsEditOpen(false);
        setIsRoleModalOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isCreateOpen, isEditOpen, isRoleModalOpen]);

  // ---- Data ----
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users', { searchQuery, roleFilter, currentPage }],
    queryFn: () =>
      userService.list({
        page: currentPage,
        per_page: perPage,
        search: searchQuery || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
      }),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.list(),
  });

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: () => roleService.allPermissions(),
    enabled: activeTab === 'permissions',
  });

  const users = data?.items ?? [];
  const meta = data?.meta;

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['users'] });
  const invalidateRoles = () => queryClient.invalidateQueries({ queryKey: ['roles'] });

  // ---- User mutations ----
  const createMutation = useMutation({
    mutationFn: () =>
      userService.create({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        role: formData.role || undefined,
        status: formData.status,
      }),
    onSuccess: () => {
      invalidateUsers();
      setIsCreateOpen(false);
      showToast('Yangi xodim muvaffaqiyatli qo\'shildi!');
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      userService.update(selectedUser!.uuid, {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role || undefined,
        status: formData.status,
      }),
    onSuccess: () => {
      invalidateUsers();
      setIsEditOpen(false);
      showToast('Xodim ma\'lumotlari yangilandi!');
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => userService.remove(uuid),
    onSuccess: () => {
      invalidateUsers();
      showToast('Xodim o\'chirildi!');
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  // ---- Role mutations ----
  const roleMutation = useMutation({
    mutationFn: () =>
      editingRole
        ? roleService.update(editingRole.id, { name: roleName, permissions: selectedPermissions })
        : roleService.create({ name: roleName, permissions: selectedPermissions }),
    onSuccess: () => {
      invalidateRoles();
      setIsRoleModalOpen(false);
      showToast(editingRole ? 'Rol yangilandi!' : 'Yangi rol yaratildi!');
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => roleService.remove(id),
    onSuccess: () => {
      invalidateRoles();
      showToast('Rol o\'chirildi!');
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  const openCreate = () => {
    setErrorMessage(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '+998 90 ',
      password: '',
      role: roles[0]?.name || '',
      status: 'active',
    });
    setIsCreateOpen(true);
  };

  const openEdit = (u: UserDTO) => {
    setErrorMessage(null);
    setSelectedUser(u);
    setFormData({
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      phone: u.phone || '',
      password: '',
      role: u.roles?.[0] || '',
      status: u.status || 'active',
    });
    setIsEditOpen(true);
  };

  const openRoleModal = (role?: RoleDTO) => {
    setErrorMessage(null);
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setSelectedPermissions(role.permissions || []);
    } else {
      setEditingRole(null);
      setRoleName('');
      setSelectedPermissions([]);
    }
    setIsRoleModalOpen(true);
  };

  const togglePermission = (permName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName],
    );
  };

  const totalPages = meta?.last_page || 1;

  const renderError = () =>
    errorMessage && (
      <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{errorMessage}</span>
      </div>
    );

  const permissionsByModule = allPermissions.reduce<Record<string, { id: number; name: string }[]>>(
    (acc, p) => {
      (acc[p.module] ||= []).push({ id: p.id, name: p.name });
      return acc;
    },
    {},
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
            Xodimlar & Rollar Boshqaruvi
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Agentlar, kuryerlar, menejerlar va tizimdagi rollar/ruxsatlar matritsasi.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Yangi Xodim
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'staff' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Xodimlar Ro'yxati
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'permissions' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Rollar & Ruxsatlar (RBAC)
        </button>
      </div>

      {/* STAFF TAB */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
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
                placeholder="Xodim ismi yoki emaili bo'yicha qidirish..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold w-full sm:w-auto"
            >
              <option value="ALL">Barcha Rollar</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-6">Xodim</th>
                    <th className="py-3 px-6">Rol</th>
                    <th className="py-3 px-6">Telefon / Email</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {isLoading && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                      </td>
                    </tr>
                  )}
                  {isError && (
                    <tr>
                      <td colSpan={5} className="py-8 px-6 text-center text-rose-500 font-semibold">
                        {extractErrorMessage(error)}
                      </td>
                    </tr>
                  )}
                  {!isLoading && !isError && users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                        Xodimlar topilmadi
                      </td>
                    </tr>
                  )}
                  {users.map((u) => {
                    const role = u.roles?.[0] || '—';
                    const badge =
                      roleBadgeColor[role] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';
                    return (
                      <tr key={u.uuid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0">
                              {getInitials(u.full_name)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{u.full_name}</div>
                              <div className="text-[11px] text-slate-500">
                                Qo'shilgan: {formatDate(u.created_at || undefined)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${badge}`}>
                            {role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div>{u.phone || '—'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              u.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                            }`}
                          >
                            {u.status === 'active' ? 'Faol' : u.status || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(u.uuid)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-600"
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

            <div className="py-4 px-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Jami {meta?.total ?? 0} ta xodim</span>
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
        </div>
      )}

      {/* PERMISSIONS TAB */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-600" />
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Rollar va Ruxsatlar (RBAC)
                </h3>
                <p className="text-xs text-slate-500">Har bir rol uchun tizim ruxsatlarini boshqaring.</p>
              </div>
            </div>
            <button
              onClick={() => openRoleModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md"
            >
              <Plus className="w-4 h-4" /> Yangi Rol
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">{role.name}</h4>
                      <span className="text-[11px] text-slate-500">
                        {role.users_count ?? 0} ta foydalanuvchi · {role.permissions.length} ta ruxsat
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openRoleModal(role)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteRoleMutation.mutate(role.id)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {role.permissions.length === 0 ? (
                    <span className="text-[11px] text-slate-400">Ruxsatlar yo'q</span>
                  ) : (
                    role.permissions.slice(0, 20).map((p) => (
                      <span
                        key={p}
                        className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded"
                      >
                        {p}
                      </span>
                    ))
                  )}
                  {role.permissions.length > 20 && (
                    <span className="text-[10px] text-slate-400">+{role.permissions.length - 20} ta</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* USER MODAL (create/edit) */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {isCreateOpen ? 'Yangi Xodim Qo\'shish' : 'Xodimni Tahrirlash'}
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setErrorMessage(null);
                isCreateOpen ? createMutation.mutate() : updateMutation.mutate();
              }}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              {renderError()}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ism</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Familiya</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              {isCreateOpen && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parol (min. 8 belgi)
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Kamida 8 belgi, harf va raqam"
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rol</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                  >
                    <option value="">— Tanlanmagan —</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                    <option value="suspended">Bloklangan</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROLE MODAL */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {editingRole ? 'Rolni Tahrirlash' : 'Yangi Rol Yaratish'}
              </h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {renderError()}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rol Nomi</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Masalan: Omborchi"
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Ruxsatlar</span>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(permissionsByModule).map(([module, perms]) => (
                    <div key={module} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
                      <div className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 mb-2">
                        {module}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {perms.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-center gap-2 text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            <span
                              onClick={() => togglePermission(p.name)}
                              className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                                selectedPermissions.includes(p.name)
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {selectedPermissions.includes(p.name) && <Check className="w-3 h-3" />}
                            </span>
                            <span onClick={() => togglePermission(p.name)}>{p.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(permissionsByModule).length === 0 && (
                    <p className="text-xs text-slate-400">Ruxsatlar yuklanmoqda...</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  setErrorMessage(null);
                  if (!roleName.trim()) {
                    setErrorMessage('Rol nomini kiriting.');
                    return;
                  }
                  roleMutation.mutate();
                }}
                disabled={roleMutation.isPending}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-md flex items-center gap-2"
              >
                {roleMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
