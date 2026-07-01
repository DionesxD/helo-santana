'use client'

import { motion, type Variants, type Transition } from 'framer-motion'
import { type ReactNode } from 'react'

// ============================================================
// Helpers de animação reutilizáveis (framer-motion)
// ============================================================

const spring: Transition = { type: 'spring', stiffness: 300, damping: 30 }
const ease: Transition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] }

// Container que aplica stagger aos filhos (cada filho direto anima em sequência)
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: ease },
}

// Fade + slide up simples
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: ease },
}

// Scale in (para cards/modais)
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: spring },
}

// Slide horizontal (para troca de tabs)
export const slideIn: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: ease },
}

// ===== Componentes wrapper =====

export function MotionDiv({
  children,
  variant = 'fadeInUp',
  className,
  delay = 0,
}: {
  children: ReactNode
  variant?: 'fadeInUp' | 'scaleIn' | 'slideIn'
  className?: string
  delay?: number
}) {
  const v = { fadeInUp, scaleIn, slideIn }[variant]
  return (
    <motion.div
      variants={v}
      initial="hidden"
      animate="show"
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Lista com stagger — envolva itens com <MotionItem>
export function MotionList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function MotionItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  )
}

// Botão com feedback tátil (scale ao tocar)
export function MotionButtonTap({ children, className, onClick, disabled }: {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ duration: 0.15 }}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}

export { motion, spring, ease }
