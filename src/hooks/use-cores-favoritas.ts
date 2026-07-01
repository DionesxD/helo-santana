'use client'

import { useState, useEffect } from 'react'

// Hook para gerenciar cores favoritas no localStorage
export function useCoresFavoritas() {
  const [favoritas, setFavoritas] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cores-favoritas')
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFavoritas(JSON.parse(stored))
      }
    } catch {
      // ignora
    }
  }, [])

  function toggle(corId: string) {
    setFavoritas((prev) => {
      const novo = prev.includes(corId) ? prev.filter((id) => id !== corId) : [...prev, corId]
      try {
        localStorage.setItem('cores-favoritas', JSON.stringify(novo))
      } catch {
        // ignora
      }
      return novo
    })
  }

  function isFavorita(corId: string) {
    return favoritas.includes(corId)
  }

  return { favoritas, toggle, isFavorita }
}
