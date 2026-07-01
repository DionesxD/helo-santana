'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarBubble } from '@/components/avatar-bubble'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, Clock, Tag, MessageSquare, CalendarClock } from 'lucide-react'
import { toast } from '@/components/ui/custom-toast'
import { queryFn } from '@/lib/query-fn'
import { formatDataHora, esmalteStyle } from '@/lib/format'
import { useState } from 'react'
import type { StatusAgendamento } from '@/lib/constants'

interface Agendamento {
  id: string
  status: StatusAgendamento
  servico: { id: string; nome: string; preco: number; duracaoMinutos: number }
  corEsmalte: { id: string; nome: string; hex: string } | null
  horario: { id: string; data: string; horaInicio: string; horaFim: string }
  cliente: { id: string; nome: string; telefone: string | null; email: string | null; eClienteConfianca: boolean }
  observacoesCliente: string | null
  criadoEm: string
}

export function AdminPending() {
  const qc = useQueryClient()
  const [recusando, setRecusando] = useState<Agendamento | null>(null)
  const [motivo, setMotivo] = useState('')

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ['agendamentos', 'pendente'],
    queryFn: () => queryFn<Agendamento[]>('/api/agendamentos?status=pendente', 'agendamentos'),
  })

  const aprovar = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/agendamentos/${id}/aprovar`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agendamentos'] })
      toast.success('Confirmado! Cliente será notificada.')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const recusar = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/agendamentos/${recusando!.id}/recusar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivo || undefined }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agendamentos'] })
      toast.success('Recusado. Cliente notificada.')
      setRecusando(null); setMotivo('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const ordenados = agendamentos
    ? [...agendamentos].sort((a, b) =>
        (a.horario.data + a.horario.horaInicio).localeCompare(b.horario.data + b.horario.horaInicio)
      )
    : []

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Solicitações pendentes</h1>
        <p className="text-sm text-muted-foreground">
          {ordenados.length} aguardando sua aprovação
        </p>
      </div>

      {isLoading ? (
        [0, 1].map((i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)
      ) : ordenados.length === 0 ? (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="p-10 text-center">
            <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Tudo em dia! 🎉</p>
            <p className="text-sm text-muted-foreground mt-1">Nenhuma solicitação pendente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ordenados.map((a) => (
            <Card key={a.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AvatarBubble nome={a.cliente.nome} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{a.cliente.nome}</p>
                      {a.cliente.eClienteConfianca && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                          Confiança
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-primary font-medium mt-0.5">{a.servico.nome}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDataHora(a.horario.data, a.horario.horaInicio)}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {a.corEsmalte && (
                        <span className="flex items-center gap-1">
                          <span className="h-3.5 w-3.5 rounded-full border border-border" style={esmalteStyle(a.corEsmalte.hex)} />
                          <Tag className="h-3 w-3" /> {a.corEsmalte.nome}
                        </span>
                      )}
                      <span className="font-semibold text-primary">R$ {a.servico.preco.toFixed(2).replace('.', ',')}</span>
                    </div>

                    {a.observacoesCliente && (
                      <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <p className="italic line-clamp-3">"{a.observacoesCliente}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => aprovar.mutate(a.id)}
                    disabled={aprovar.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" /> Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                    onClick={() => { setRecusando(a); setMotivo('') }}
                  >
                    <X className="h-4 w-4 mr-1" /> Recusar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog recusar com motivo */}
      <AlertDialog open={!!recusando} onOpenChange={(o) => !o && setRecusando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar agendamento?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>{recusando?.cliente.nome} será notificada da recusa.</p>
                <Textarea
                  className="mt-3"
                  placeholder="Motivo (opcional) — ex: horário indisponível, conflito de agenda..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => recusar.mutate()}
              className="bg-rose-500 hover:bg-rose-600 text-white"
              disabled={recusar.isPending}
            >
              {recusar.isPending ? 'Recusando...' : 'Sim, recusar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
