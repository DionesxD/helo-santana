'use client'

import { iniciais } from '@/lib/format'
import { cn } from '@/lib/utils'

export function AvatarBubble({
  nome,
  className,
  size = 'md',
}: {
  nome: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
  }
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-primary/20 text-primary-foreground font-semibold border border-primary/30 shrink-0',
        sizes[size],
        className
      )}
    >
      {iniciais(nome)}
    </div>
  )
}
