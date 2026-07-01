'use client'

import { Badge } from '@/components/ui/badge'
import { STATUS_AGENDAMENTO_CORES, STATUS_AGENDAMENTO_LABELS, type StatusAgendamento } from '@/lib/constants'

export function StatusBadge({ status }: { status: StatusAgendamento }) {
  const cls = STATUS_AGENDAMENTO_CORES[status] || 'bg-muted text-muted-foreground border-border'
  return (
    <Badge variant="outline" className={`${cls} border font-medium`}>
      {STATUS_AGENDAMENTO_LABELS[status] || status}
    </Badge>
  )
}
