"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // QueryClient isolé par instance → pas de partage entre users en SSR
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:        60 * 1000,       // 1 min
            gcTime:           5 * 60 * 1000,   // 5 min
            retry:            1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"        // World Connect = always dark (navy brand)
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}

        {/* Toast global — stylé via globals.css [data-sonner-toaster] */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background:  "var(--background-card)",
              border:      "1px solid var(--border)",
              color:       "var(--foreground)",
              fontFamily:  "var(--font-sans)",
              borderRadius:"var(--radius-md)",
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
