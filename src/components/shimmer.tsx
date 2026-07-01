'use client'

import { cn } from '@/lib/utils'

// Skeleton com shimmer animado (gradiente deslizando)
export function Shimmer({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-md', className)} />
}
