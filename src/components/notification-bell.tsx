'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellRing } from 'lucide-react'
import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthStore } from '@/components/auth-provider'
import { useNotificacoesWs, type NotificacaoLive } from '@/hooks/use-notificacoes-ws'
import { formatDataCurta } from '@/lib/format'
import { toast } from '@/components/ui/custom-toast'
import { TIPO_NOTIFICACAO, type TipoNotificacao } from '@/lib/constants'

const ICONES: Partial<Record<TipoNotificacao, string>> = {
  agendamento_confirmado: '✅',
  agendamento_recusado: '❌',
  lembrete_atendimento: '⏰',
  horario_vago: ' openings',
  agendamento_cancelado: '🚫',
}

interface NotifAPI {
  id: string
  tipo: string
  mensagem: string
  enviadaEm: string
  lida: boolean
}

export function NotificationBell() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ['notificacoes', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/notificacoes', { credentials: 'include' })
      const j = await res.json()
      return j as { notificacoes: NotifAPI[]; naoLidas: number }
    },
    enabled: !!user,
    refetchInterval: 30000,
  })

  // websocket: ao receber notificação ao vivo, invalida e mostra toast
  useNotificacoesWs((n: NotificacaoLive) => {
    qc.invalidateQueries({ queryKey: ['notificacoes', user?.id] })
    toast(n.mensagem, {
      icon: ICONES[n.tipo as TipoNotificacao] || '🔔',
    })
  })

  const marcarLidas = useMutation({
    mutationFn: async () => {
      await fetch('/api/notificacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todas: true }),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes', user?.id] }),
  })

  const naoLidas = data?.naoLidas || 0
  const lista = data?.notificacoes || []

  return (
    <Popover open={open} onOpenChange={(o) => {
      setOpen(o)
      if (o && naoLidas > 0) setTimeout(() => marcarLidas.mutate(), 800)
    }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          {naoLidas > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {naoLidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] max-w-sm p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-semibold text-sm">Notificações</p>
          {naoLidas > 0 && (
            <span className="text-xs text-muted-foreground">{naoLidas} nova(s)</span>
          )}
        </div>
        <ScrollArea className="h-[min(60vh,360px)]">
          {lista.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Nenhuma notificação ainda.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {lista.map((n) => (
                <li key={n.id} className={`px-4 py-3 ${n.lida ? 'opacity-60' : 'bg-primary/5'}`}>
                  <div className="flex gap-2">
                    <span className="text-base leading-none mt-0.5">{ICONES[n.tipo as TipoNotificacao] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{n.mensagem}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {new Date(n.enviadaEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
