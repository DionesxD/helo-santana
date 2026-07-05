'use client'

import { create } from 'zustand'
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export interface AuthUser {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  tipo: 'cliente' | 'manicure'
  fotoUrl: string | null
  eClienteConfianca: boolean
  _v: number
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  setUser: (user: Omit<AuthUser, '_v'> | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
}

let userVersion = 0

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user: user ? { ...user, _v: ++userVersion } : null }),
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
  const hasInitialized = useRef(false)

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

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      return
    }
    qc.clear()
  }, [user?.id, qc])

  return <>{children}</>
}
