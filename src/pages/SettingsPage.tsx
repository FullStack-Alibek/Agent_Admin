import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  Palette,
  Sun,
  Moon,
  Monitor,
  User,
  Lock,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { profileService } from '@/services/profileService';
import { extractErrorMessage } from '@/services/api';
import { useThemeStore, type ThemeMode } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';

const themeOptions: {
  id: ThemeMode;
  title: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'light', title: 'Yorug\' rejim', label: 'Light', description: 'Yorug\', oq fon — enterprise ko\'rinish', icon: Sun },
  { id: 'dark', title: 'Qorong\'i rejim', label: 'Dark', description: 'Qorong\'i, ko\'zni charchatmaydigan rejim', icon: Moon },
  { id: 'system', title: 'Tizimga mos', label: 'System', description: 'Operatsion tizim sozlamasiga moslashadi', icon: Monitor },
];

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { mode: themeMode, setMode } = useThemeStore();
  const authUser = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'theme'>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---- Profile data ----
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.show(),
  });

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    timezone: 'Asia/Tashkent',
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone || '',
        timezone: profile.timezone || 'Asia/Tashkent',
      });
    }
  }, [profile]);

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    password: '',
    confirm: '',
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      profileService.update({
        first_name: profileForm.firstName.trim(),
        last_name: profileForm.lastName.trim(),
        phone: profileForm.phone.trim() || undefined,
        timezone: profileForm.timezone,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (authUser) {
        useAuthStore.setState({
          user: { ...authUser, full_name: data.full_name, first_name: data.first_name, last_name: data.last_name },
        });
      }
      showToast('Profil muvaffaqiyatli saqlandi!');
    },
    onError: (err) => setErrorMessage(extractErrorMessage(err)),
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      profileService.changePassword({
        current_password: passwordForm.current,
        password: passwordForm.password,
        password_confirmation: passwordForm.confirm,
      }),
    onSuccess: () => {
      setPasswordForm({ current: '', password: '', confirm: '' });
      showToast('Parol muvaffaqiyatli o\'zgartirildi!');
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
    <div className="space-y-6 relative animate-fadeIn">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Tizim Sozlamalari</h1>
        <p className="text-sm text-slate-500 font-medium">
          Profil ma'lumotlari, xavfsizlik va mavzu sozlamalari.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <User className="w-3.5 h-3.5" /> Profil
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'security' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Lock className="w-3.5 h-3.5" /> Xavfsizlik
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'theme' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Palette className="w-3.5 h-3.5" /> Mavzu (Theme)
        </button>
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-2xl space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black flex items-center justify-center text-xl shadow-md">
              {(profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '') || 'U'}
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                {profile?.full_name || 'Foydalanuvchi'}
              </h3>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                {profile?.roles?.[0] || '—'}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setErrorMessage(null);
                updateMutation.mutate();
              }}
              className="space-y-4"
            >
              {renderError()}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ism</label>
                  <input
                    type="text"
                    required
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Familiya</label>
                  <input
                    type="text"
                    required
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className={`${inputCls} opacity-60 cursor-not-allowed font-mono`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vaqt zonasi</label>
                  <input
                    type="text"
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Saqlash
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-2xl space-y-5">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">Parolni O'zgartirish</h3>
            <p className="text-xs text-slate-500">Hisobingiz xavfsizligi uchun kuchli parol tanlang.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setErrorMessage(null);
              if (passwordForm.password !== passwordForm.confirm) {
                setErrorMessage('Parollar mos kelmadi.');
                return;
              }
              passwordMutation.mutate();
            }}
            className="space-y-4"
          >
            {renderError()}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Joriy parol</label>
              <input
                type="password"
                required
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Yangi parol</label>
                <input
                  type="password"
                  required
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  placeholder="Min. 8 belgi"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tasdiqlash</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-md flex items-center gap-2"
              >
                {passwordMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Parolni O'zgartirish
              </button>
            </div>
          </form>
        </div>
      )}

      {/* THEME TAB */}
      {activeTab === 'theme' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-600" /> Mavzu (Theme) sozlamasi
            </h3>
            <p className="text-xs text-slate-500">Interfeys mavzusini tanlang. Tanlov brauzerda saqlanadi.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = themeMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setMode(opt.id);
                    showToast(`Mavzu almashtirildi: ${opt.title}`);
                  }}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    active
                      ? 'border-indigo-600 bg-indigo-500/5 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-6 h-6 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {active && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{opt.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
