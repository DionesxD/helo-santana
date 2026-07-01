'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ============================================================
// usePullToRefresh — puxar para baixo no topo da página para atualizar
// ============================================================
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const threshold = 70

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY
      setPulling(true)
    }
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling || refreshing) return
    const diff = e.touches[0].clientY - startY.current
    if (diff > 0) {
      // resistência (fica mais difícil puxar)
      const resisted = Math.min(diff * 0.5, threshold * 1.5)
      setPullDistance(resisted)
    }
  }, [pulling, refreshing])

  const onTouchEnd = useCallback(async () => {
    if (!pulling) return
    setPulling(false)
    if (pullDistance >= threshold) {
      setRefreshing(true)
      setPullDistance(threshold)
      try {
        await onRefresh()
      } finally {
        setTimeout(() => {
          setRefreshing(false)
          setPullDistance(0)
        }, 300)
      }
    } else {
      setPullDistance(0)
    }
  }, [pulling, pullDistance, refreshing, onRefresh])

  useEffect(() => {
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [onTouchStart, onTouchMove, onTouchEnd])

  return { pullDistance, refreshing, threshold }
}

// ============================================================
// useLongPress — pressione e segure para ação rápida
// ============================================================
export function useLongPress(onLongPress: () => void, delay = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggered = useRef(false)

  const start = useCallback(() => {
    triggered.current = false
    timer.current = setTimeout(() => {
      triggered.current = true
      onLongPress()
    }, delay)
  }, [onLongPress, delay])

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear,
  }
}
