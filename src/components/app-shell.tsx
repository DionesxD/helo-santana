'use client'

import { type ReactNode } from 'react'
import { useAuthStore } from '@/components/auth-provider'
import { AuthScreen } from '@/components/auth-screen'
import { ClientApp } from '@/components/client-app'
import { ManicureApp } from '@/components/manicure-app'
import { Loader2 } from 'lucide-react'

export function AppShell() {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  // key força remount completo quando o usuário muda (login/troca de conta)
  // Isso garante que TODAS as queries internas re-executam com o novo usuário
  const appKey = `${user.tipo}-${user.id}-${user._v}`

  return user.tipo === 'manicure' 
    ? <ManicureApp key={appKey} /> 
    : <ClientApp key={appKey} />
}
