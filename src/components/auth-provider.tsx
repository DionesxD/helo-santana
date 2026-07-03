'use client'

import { create } from 'zustand'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export interface AuthUser {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  tipo: 'cliente' | 'manicure'
  fotoUrl: string | null
  eClienteConfianca: boolean
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null })
  },
}))

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        setUser(data.user || null)
      })
      .catch(() => {
        if (mounted) setUser(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [setUser, setLoading])

  // Quando o usuário muda (login/logout/troca de conta), limpa TODO o cache
  // do React Query para evitar que dados de uma sessão apareçam para outra.
  useEffect(() => {
    qc.clear()
  }, [user?.id, qc])

  return <>{children}</>
}