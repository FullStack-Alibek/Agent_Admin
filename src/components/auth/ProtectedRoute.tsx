import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/authService';
import { tokenStorage } from '@/services/api';

/**
 * Himoyalangan route: token bo'lmasa — login sahifasiga yo'naltiradi.
 * Token bo'lsa, foydalanuvchi ma'lumotlarini backend'dan yangilaydi.
 */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, setUser, clear } = useAuthStore();
  const [isChecking, setIsChecking] = useState(!isAuthenticated);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const token = tokenStorage.get();
      if (!token) {
        if (active) {
          clear();
          setIsChecking(false);
        }
        return;
      }

      // Local'da user bo'lsa ham, sessiya haqiqiyligini backend bilan tasdiqlaymiz.
      try {
        const user = await authService.me();
        if (active) setUser(user);
      } catch {
        if (active) clear();
      } finally {
        if (active) setIsChecking(false);
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [setUser, clear]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};
