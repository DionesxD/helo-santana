'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/custom-toast'
import { hojeStr, addDias, semanaDeAte, parseData } from '@/lib/format'
import { cn } from '@/lib/utils'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
// Horários base das 8h às 17h (horários customizados aparecem automaticamente no grid)
const HORAS_BASE = [
  '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
]

interface Horario {
  id: string
  data: string
  horaInicio: string
  horaFim: string
  status: string
  agendamento?: { id: string } | null
}

function horaFim(hora: string): string {
  const h = parseInt(hora) + 1
  return `${h.toString().padStart(2, '0')}:00`
}

export function AdminGradeEditor() {
  const qc = useQueryClient()
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogData, setDialogData] = useState('')
  const [dialogHora, setDialogHora] = useState('')

  const hoje = hojeStr()
  const hojeDate = parseData(hoje)
  const diaSemana = hojeDate.getDay()
  const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana
  const inicioSemana = addDias(hoje, diffParaSegunda + semanaOffset * 7)
  const fimSemana = addDias(inicioSemana, 6)

  const { data: horarios, isLoading } = useQuery({
    queryKey: ['horarios', inicioSemana, fimSemana],
    queryFn: async () => {
      const res = await fetch(`/api/horarios?de=${inicioSemana}&ate=${fimSemana}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Erro ao carregar')
      const j = await res.json()
      return j.horarios as Horario[]
    },
  })

  const horarioMap = useMemo(() => {
    const map = new Map<string, Horario>()
    horarios?.forEach((h) => map.set(`${h.data}|${h.horaInicio}`, h))
    return map
  }, [horarios])

  // lista de horas = base + horas customizadas que existem no banco mas não estão na base
  const todasHoras = useMemo(() => {
    const set = new Set(HORAS_BASE)
    horarios?.forEach((h) => {
      if (!set.has(h.horaInicio)) set.add(h.horaInicio)
    })
    return Array.from(set).sort()
  }, [horarios])

  const diasSemana = useMemo(() => {
    const dias: { data: string; diaSemana: number; label: string; ehHoje: boolean }[] = []
    for (let i = 0; i < 7; i++) {
      const data = addDias(inicioSemana, i)
      const d = parseData(data)
      if (d.getDay() === 0) continue
      dias.push({ data, diaSemana: d.getDay(), label: `${DIAS[d.getDay()]} ${d.getDate()}`, ehHoje: data === hoje })
    }
    return dias
  }, [inicioSemana, hoje])

  const criarHorario = useMutation({
    mutationFn: async ({ data, hora }: { data: string; hora: string }) => {
      const res = await fetch('/api/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data, horaInicio: hora, horaFim: horaFim(hora), status: 'livre' }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Erro ao criar')
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['horarios'] }); toast.success('Horário aberto!') },
    onError: (e: Error) => toast.error(e.message),
  })

  const alterarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/horarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Erro ao alterar')
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['horarios'] }); toast.success('Status alterado!') },
    onError: (e: Error) => toast.error(e.message),
  })

  const deletarHorario = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/horarios/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Erro ao remover')
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['horarios'] }); toast.success('Horário removido.') },
    onError: (e: Error) => toast.error(e.message),
  })

  function handleCell(data: string, hora: string) {
    const key = `${data}|${hora}`
    const h = horarioMap.get(key)
    if (!h) {
      criarHorario.mutate({ data, hora })
    } else if (h.status === 'livre') {
      alterarStatus.mutate({ id: h.id, status: 'bloqueado' })
    } else if (h.status === 'bloqueado') {
      deletarHorario.mutate(h.id)
    }
  }

  function abrirDialogCustomizado(data?: string) {
    setDialogData(data || diasSemana[0]?.data || '')
    setDialogHora('')
    setDialogOpen(true)
  }

  function criarCustomizado() {
    if (!dialogData || !dialogHora) {
      toast.error('Preencha data e hora')
      return
    }
    if (!/^\d{2}:\d{2}$/.test(dialogHora)) {
      toast.error('Use o formato HH:MM (ex: 22:00)')
      return
    }
    criarHorario.mutate({ data: dialogData, hora: dialogHora })
    setDialogOpen(false)
  }

  const isMutating = criarHorario.isPending || alterarStatus.isPending || deletarHorario.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Grade de horários</h1>
          <p className="text-sm text-muted-foreground">Toque para abrir, bloquear ou remover</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => abrirDialogCustomizado()}>
          <Plus className="h-4 w-4 mr-1" /> Horário custom
        </Button>
      </div>

      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-2">
        <Button variant="ghost" size="icon" onClick={() => setSemanaOffset((v) => v - 1)} disabled={semanaOffset <= 0}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">{semanaDeAte(inicioSemana)}</p>
          {semanaOffset === 0 && <p className="text-[10px] text-primary">Esta semana</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSemanaOffset((v) => v + 1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <CardContent className="p-0 overflow-x-auto scrollbar-thin">
            <div className="min-w-[400px]">
              {/* Cabeçalho */}
              <div className="grid sticky top-0 z-10 bg-card" style={{ gridTemplateColumns: `44px repeat(${diasSemana.length}, 1fr)` }}>
                <div className="p-2 text-[10px] text-muted-foreground text-right border-b border-border">h</div>
                {diasSemana.map((d) => (
                  <div key={d.data} className={cn('p-2 text-center border-b border-l border-border', d.ehHoje && 'bg-primary/10')}>
                    <p className="text-[10px] text-muted-foreground uppercase">{DIAS[d.diaSemana]}</p>
                    <p className={cn('text-sm font-bold', d.ehHoje && 'text-primary')}>{d.label.split(' ')[1]}</p>
                  </div>
                ))}
              </div>

              {/* Linhas */}
              {todasHoras.map((hora) => (
                <div key={hora} className="grid" style={{ gridTemplateColumns: `44px repeat(${diasSemana.length}, 1fr)` }}>
                  <div className="p-2 text-[10px] text-muted-foreground text-right border-b border-border flex items-center justify-end">
                    {hora}
                  </div>
                  {diasSemana.map((d) => {
                    const key = `${d.data}|${hora}`
                    const h = horarioMap.get(key)
                    const temAgendamento = h?.agendamento != null
                    const status = h?.status
                    return (
                      <button
                        key={key}
                        onClick={() => !temAgendamento && !isMutating && handleCell(d.data, hora)}
                        disabled={temAgendamento || isMutating}
                        className={cn(
                          'border-b border-l border-border min-h-[34px] flex items-center justify-center text-xs transition-all',
                          temAgendamento
                            ? 'bg-primary/15 cursor-not-allowed'
                            : status === 'livre'
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95'
                              : status === 'bloqueado'
                                ? 'bg-zinc-500/15 hover:bg-rose-500/15 active:scale-95'
                                : 'hover:bg-emerald-500/10 active:scale-95',
                          d.ehHoje && 'border-l-2 border-l-primary/30',
                        )}
                      >
                        {temAgendamento ? '📅' : status === 'livre' ? '●' : status === 'bloqueado' ? '✕' : <span className="text-muted-foreground/30">+</span>}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500/30" /> Livre</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-zinc-500/30" /> Bloqueado</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary/30" /> Agendado</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-border" /> Vazio</span>
      </div>

      {/* Dialog horário customizado */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar horário customizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cust-data">Data</Label>
              <Input id="cust-data" type="date" value={dialogData} onChange={(e) => setDialogData(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-hora">Hora de início (HH:MM)</Label>
              <Input id="cust-hora" value={dialogHora} onChange={(e) => setDialogHora(e.target.value)} placeholder="22:00" />
              <p className="text-[11px] text-muted-foreground">Para horários fora do padrão (ex: 22:00, 06:30)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={criarCustomizado} disabled={criarHorario.isPending}>
              {criarHorario.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
