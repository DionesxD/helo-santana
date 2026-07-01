'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/status-badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { CalendarX, Clock, CalendarDays, Tag, MessageSquare } from 'lucide-react'
import { toast } from '@/components/ui/custom-toast'
import { queryFn } from '@/lib/query-fn'
import { formatDataCurta, formatDataHora, esmalteStyle } from '@/lib/format'
import type { StatusAgendamento } from '@/lib/constants'

interface Agendamento {
  id: string
  status: StatusAgendamento
  servico: { id: string; nome: string; preco: number; duracaoMinutos: number }
  corEsmalte: { id: string; nome: string; hex: string } | null
  horario: { id: string; data: string; horaInicio: string; horaFim: string }
  observacoesCliente: string | null
  confirmadoAutomaticamente: boolean
}

type Filtro = 'todos' | 'pendente' | 'confirmado' | 'concluido' | 'cancelado' | 'recusado'

export function ClientAppointments({ onAgendar }: { onAgendar: () => void }) {
  const qc = useQueryClient()
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => queryFn<Agendamento[]>('/api/agendamentos', 'agendamentos'),
  })

  const cancelar = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/agendamentos/${id}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao cancelar')
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['agendamentos'] })
      if (data.alertaPrazo) {
        toast.warning('Cancelamento fora do prazo recomendado (4h). A manicure foi avisada.')
      } else {
        toast.success('Agendamento cancelado.')
      }
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const filtrados = agendamentos
    ? filtro === 'todos'
      ? agendamentos
      : agendamentos.filter((a) => a.status === filtro)
    : []

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Meus agendamentos</h1>

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
        <TabsList className="grid grid-cols-5 w-full h-auto">
          <TabsTrigger value="todos" className="text-xs py-1.5">Todos</TabsTrigger>
          <TabsTrigger value="pendente" className="text-xs py-1.5">Pend.</TabsTrigger>
          <TabsTrigger value="confirmado" className="text-xs py-1.5">Confir.</TabsTrigger>
          <TabsTrigger value="concluido" className="text-xs py-1.5">Feitos</TabsTrigger>
          <TabsTrigger value="cancelado" className="text-xs py-1.5">Canc.</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        [0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
      ) : filtrados.length === 0 ? (
        <Card className="bg-card/50 border-dashed border-border">
          <CardContent className="p-8 text-center">
            <CalendarX className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Nenhum agendamento aqui.</p>
            <Button onClick={onAgendar} size="sm">
              <CalendarDays className="h-4 w-4 mr-1.5" /> Agendar agora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtrados.map((a) => {
            const podeCancelar = ['pendente', 'confirmado'].includes(a.status)
            return (
              <Card key={a.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{a.servico.nome}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDataHora(a.horario.data, a.horario.horaInicio)}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {a.corEsmalte && (
                      <span className="flex items-center gap-1.5">
                        <span className="h-4 w-4 rounded-full border border-border" style={esmalteStyle(a.corEsmalte.hex)} />
                        <Tag className="h-3 w-3" /> {a.corEsmalte.nome}
                      </span>
                    )}
                    <span className="font-semibold text-primary">R$ {a.servico.preco.toFixed(2).replace('.', ',')}</span>
                  </div>

                  {a.observacoesCliente && (
                    <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <p className="line-clamp-2">{a.observacoesCliente}</p>
                    </div>
                  )}

                  {a.confirmadoAutomaticamente && a.status === 'confirmado' && (
                    <p className="text-[11px] text-emerald-600 mt-2">✓ Confirmado automaticamente (cliente de confiança)</p>
                  )}

                  {podeCancelar && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full mt-3 text-rose-600 border-rose-500/30 hover:bg-rose-500/10">
                          Cancelar agendamento
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja cancelar seu agendamento de {formatDataCurta(a.horario.data)} às {a.horario.horaInicio}?
                            Cancelamentos com menos de 4h de antecedência geram um alerta para a manicure.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Manter</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelar.mutate(a.id)}
                            className="bg-rose-500 hover:bg-rose-600 text-white"
                          >
                            Sim, cancelar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
