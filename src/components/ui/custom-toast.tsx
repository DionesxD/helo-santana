'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, Info, AlertCircle, X } from 'lucide-react'

interface ToastItem {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

const TOAST_EVENT = 'helo-toast'
let toastId = 0

// Listener global registrado imediatamente (não espera useEffect)
const globalToasts: ToastItem[] = []
const listeners: Set<(toasts: ToastItem[]) => void> = new Set()

function notifyListeners() {
  listeners.forEach((l) => l([...globalToasts]))
}

function emit(type: ToastItem['type'], message: string) {
  if (typeof window === 'undefined') return
  const item = { id: ++toastId, type, message }
  globalToasts.push(item)
  notifyListeners()
  setTimeout(() => {
    const idx = globalToasts.findIndex((t) => t.id === item.id)
    if (idx >= 0) globalToasts.splice(idx, 1)
    notifyListeners()
  }, 5000)
}

export const toast = {
  success: (msg: string) => emit('success', msg),
  error: (msg: string) => emit('error', msg),
  info: (msg: string) => emit('info', msg),
  warning: (msg: string) => emit('warning', msg),
}

const CONFIG = {
  success: { icon: CheckCircle2, bg: 'bg-emerald-600' },
  error: { icon: XCircle, bg: 'bg-rose-600' },
  info: { icon: Info, bg: 'bg-sky-600' },
  warning: { icon: AlertCircle, bg: 'bg-amber-600' },
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>(globalToasts)

  useEffect(() => {
    listeners.add(setToasts)
    return () => { listeners.delete(setToasts) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((t) => {
        const cfg = CONFIG[t.type]
        const Icon = cfg.icon
        return (
          <div
            key={t.id}
            className={`${cfg.bg} text-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-2.5 w-full animate-fade-in-up pointer-events-auto`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <p className="text-sm font-medium flex-1">{t.message}</p>
          </div>
        )
      })}
    </div>
  )
}
