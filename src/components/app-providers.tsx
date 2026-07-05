'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/components/auth-provider'
import { ToastContainer } from '@/components/ui/custom-toast'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Sempre busca dados frescos
            gcTime: 0, // Não mantém cache de queries inativas
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: true, // Re-busca quando o componente monta
          },
        },
      })
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
        <ToastContainer />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
