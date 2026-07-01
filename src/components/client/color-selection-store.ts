'use client'

import { create } from 'zustand'

interface CorSelecionada {
  corId: string
  corNome: string
  corHex: string
}

interface ColorSelectionState {
  cor: CorSelecionada | null
  set: (cor: CorSelecionada | null) => void
  clear: () => void
}

export const useColorSelectionStore = create<ColorSelectionState>((set) => ({
  cor: null,
  set: (cor) => set({ cor }),
  clear: () => set({ cor: null }),
}))
