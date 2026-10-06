import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initTheme } from '@/store/useThemeStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Apply the persisted / system theme on mount and keep it in sync
  // with the OS preference while "System" mode is selected.
  useEffect(() => initTheme(), []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
