'use client'

import { useEffect, useRef, useState } from 'react'

// ============================================================
// HandModelLayers — Provador por camadas usando <canvas>
//
// Composição:
//   1. HAND-BASE  → mão com pele (fundo transparente)
//   2. NAIL-COLOR → cor sólida recortada pela mask, desenhada
//                   com 'multiply' + alpha adaptativo (translucidez)
//                   SEM brilho especular artificial — a textura natural
//                   da unha (visível via multiply) dá o realismo.
// ============================================================

const BASE_URL = '/hand-model/hand-base.png'
const MASK_URL = '/hand-model/hand-nail-mask.png'

let baseImg: HTMLImageElement | null = null
let maskImg: HTMLImageElement | null = null
let loadPromise: Promise<void> | null = null

function loadImages(): Promise<void> {
  if (loadPromise) return loadPromise
  loadPromise = new Promise((resolve, reject) => {
    let loaded = 0
    const need = 2
    function done() { loaded++; if (loaded === need) resolve() }
    baseImg = new Image()
    baseImg.crossOrigin = 'anonymous'
    baseImg.onload = done
    baseImg.onerror = reject
    baseImg.src = BASE_URL
    maskImg = new Image()
    maskImg.crossOrigin = 'anonymous'
    maskImg.onload = done
    maskImg.onerror = reject
    maskImg.src = MASK_URL
  })
  return loadPromise
}

interface Props {
  corHex: string
  className?: string
}

export function HandModelLayers({ corHex, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadImages().then(() => { if (!cancelled) setLoaded(true) }).catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!loaded || !baseImg || !maskImg) return
    const canvas = canvasRef.current
    if (!canvas) return

    const W = baseImg.naturalWidth
    const H = baseImg.naturalHeight
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // limpa
    ctx.clearRect(0, 0, W, H)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'

    // 1. base (mão com pele)
    ctx.drawImage(baseImg, 0, 0, W, H)

    // 2. COR nas unhas com blend MULTIPLY — SEM brilho especular
    //    A textura natural da unha (visível via multiply) dá o realismo.
    //    Sem gradiente, sem gloss artificial — uniforme em todas as 5 unhas.
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const offCtx = off.getContext('2d')
    if (offCtx) {
      offCtx.fillStyle = corHex
      offCtx.fillRect(0, 0, W, H)
      offCtx.globalCompositeOperation = 'destination-in'
      offCtx.drawImage(maskImg, 0, 0, W, H)

      // alpha adaptativo: cores escuras = mais opacas, claras = mais translúcidas
      const hex = corHex.replace('#', '')
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      const alpha = 0.82 + (1 - lum) * 0.10

      ctx.globalAlpha = alpha
      ctx.globalCompositeOperation = 'multiply'
      ctx.drawImage(off, 0, 0, W, H)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }
  }, [loaded, corHex])

  if (error) {
    return (
      <div className={`w-full h-full grid place-items-center text-xs text-muted-foreground ${className ?? ''}`}>
        Não foi possível carregar o modelo.
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full ${className ?? ''}`} style={{ aspectRatio: '512 / 671' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ imageRendering: 'auto' }} />
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  )
}
