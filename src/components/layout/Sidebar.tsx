import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Warehouse,
  Users,
  UserCheck,
  ShoppingCart,
  MapPin,
  CreditCard,
  Navigation,
  FileText,
  Settings,
  Truck,
  X,
  Boxes,
} from 'lucide-react';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useAuthStore } from '@/store/useAuthStore';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { title: 'Boshqaruv Paneli', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Mahsulotlar', href: '/products', icon: ShoppingBag },
  { title: 'Ombor & Zaxira', href: '/inventory', icon: Warehouse },
  { title: 'Mijozlar (CRM)', href: '/crm', icon: Users },
  { title: 'Xodimlar & Agentlar', href: '/employees', icon: UserCheck },
  { title: 'Buyurtmalar', href: '/orders', icon: ShoppingCart, badge: '38' },
  { title: 'Hududlar & Marshrutlar', href: '/territories', icon: MapPin },
  { title: 'Moliya & Qarzlar', href: '/finance', icon: CreditCard },
  { title: 'GPS Kuzatuvi', href: '/gps', icon: Navigation },
  { title: 'Hisobotlar', href: '/reports', icon: FileText },
  { title: 'Sozlamalar', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [isMounted, setIsMounted] = useState(false);
    const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebarStore();
  const user = useAuthStore((s) => s.user);
  const initials =
    (user?.first_name?.[0] || '') + (user?.last_name?.[0] || '') || 'U';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const collapsed = isMounted ? isCollapsed : false;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`bg-slate-950 text-slate-400 transition-all duration-300 ease-in-out flex flex-col border-r border-slate-800/80 fixed lg:static inset-y-0 left-0 z-50 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-20' : 'w-64'} min-h-screen select-none`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center shrink-0 ring-1 ring-white/20">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-slate-100 text-sm tracking-tight truncate">
                  LogiDist Pro
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400 truncate">
                  Tarqatish Tizimi
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-semibold ring-1 ring-indigo-400/30'
                    : 'hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:translate-x-0.5'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  }`}
                />
                {(!collapsed || isMobileOpen) && <span className="truncate tracking-wide">{item.title}</span>}
                {(!collapsed || isMobileOpen) && item.badge && (
                  <span className="ml-auto bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-500/20 shadow-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

                {/* Footer User Info */}
        {(!collapsed || isMobileOpen) && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30 shrink-0 shadow-inner">
                {initials}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-slate-200 truncate">{user?.full_name || 'Foydalanuvchi'}</span>
                <span className="text-[10px] text-slate-500 truncate font-mono">
                  {user?.roles?.[0] || 'Xodim'}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
