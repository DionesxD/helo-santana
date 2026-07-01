'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/components/auth-provider'

// Hook compartilhado: conta notificações não lidas do usuário logado.
// Usado pelo NotificationBell (badge) e pelo avatar (ring pulsante).
export function useNotificacoesNaoLidas() {
  const user = useAuthStore((s) => s.user)
  const { data } = useQuery({
    queryKey: ['notificacoes-nao-lidas', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/notificacoes', { credentials: 'include' })
      if (!res.ok) return 0
      const j = await res.json()
      return (j.naoLidas as number) ?? 0
    },
    enabled: !!user,
    refetchInterval: 30000,
  })
  return data || 0
}
