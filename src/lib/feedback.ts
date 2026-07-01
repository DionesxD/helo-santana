// Utilitários de feedback tátil e visual

// ============================================================
// Haptic feedback — vibra o celular (se suportado)
// ============================================================
export function haptic(pattern: number | number[] = 10) {
  if (typeof window === 'undefined') return
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // ignora se não suportado
    }
  }
}

// Atalhos para padrões comuns
export const hapticTap = () => haptic(8)
export const hapticSuccess = () => haptic([10, 30, 10])
export const hapticError = () => haptic([20, 40, 20])
export const hapticSelect = () => haptic(5)

// ============================================================
// Confetti — celebração em marcos (criar conta, concluir, etc)
// ============================================================
let confettiLib: typeof import('canvas-confetti') | null = null

async function loadConfetti() {
  if (!confettiLib) {
    confettiLib = await import('canvas-confetti')
  }
  return confettiLib.default
}

export async function confetti(opts?: {
  emojis?: string[]
  colors?: string[]
}) {
  try {
    const confettiFn = await loadConfetti()
    const colors = opts?.colors ?? ['#D85A78', '#F2B6C6', '#E8A33D', '#4F9A6E']
    const shapes = opts?.emojis ?? undefined

    // rajada central
    confettiFn({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      ...(shapes ? { shapes: shapes.map((e) => confettiFn.shapeFromText(e)) } : {}),
      scalar: 0.9,
    })
    // rajadas laterais (efeito festa)
    setTimeout(() => {
      confettiFn({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      })
    }, 150)
    setTimeout(() => {
      confettiFn({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      })
    }, 300)
  } catch {
    // best-effort
  }
}
