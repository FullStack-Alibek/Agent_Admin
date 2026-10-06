import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, Command, LogOut, Loader2 } from 'lucide-react';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/authService';

export const Header: React.FC = () => {
  const { toggleSidebar, toggleMobileSidebar } = useSidebarStore();
  const navigate = useNavigate();
  const { user, clear } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const initials =
    ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() || 'U';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } finally {
      clear();
      navigate('/login', { replace: true });
      setIsLoggingOut(false);
    }
  };

  const handleMenuClick = () => {
    if (window.innerWidth < 1024) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-xs transition-colors">
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={handleMenuClick}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Menyuni ochish"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buyurtmalar, mahsulotlar yoki mijozlarni qidirish..."
            className="w-60 lg:w-80 pl-10 pr-10 py-2 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
          />
          <div className="absolute right-3 hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <Command className="w-3 h-3" /> K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[11px] font-semibold tracking-wide shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          GPS Tarmoqda
        </div>

                                <button
          className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Bildirishnomalar"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-ping"></span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0 text-xs">
            {initials}
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {user?.full_name || 'Foydalanuvchi'}
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
              {user?.roles?.[0] || 'Xodim'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Tizimdan chiqish"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-60"
            aria-label="Tizimdan chiqish"
          >
            {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
