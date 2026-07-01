'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wallet, TrendingUp, Receipt, Plus, Heart, Sparkles } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { toast } from '@/components/ui/custom-toast'
import { formatMoeda, hojeStr, addDias, formatDataCurta } from '@/lib/format'
import { FORMA_PAGAMENTO, FORMA_PAGAMENTO_LABELS, type FormaPagamento } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface Transacao {
  id: string
  valor: number
  formaPagamento: string
  data: string
  observacao: string | null
  agendamento: { cliente: { nome: string } | null; servico: { nome: string } | null } | null
}
interface Relatorio {
  transacoes: Transacao[]
  resumo: { total: number; quantidade: number; periodo: { de: string; ate: string } }
  porDia: { data: string; valor: number }[]
  porForma: { forma: string; valor: number }[]
}

const PRESETS = [
  { id: 'hoje', label: 'Hoje', dias: 0 },
  { id: '7', label: '7 dias', dias: 6 },
  { id: '30', label: '30 dias', dias: 29 },
  { id: 'mes', label: 'Mês', dias: 30 },
]

type TipoExtra = 'gorjeta' | 'servico_extra'

const TIPOS_EXTRA: { id: TipoExtra; label: string; icon: typeof Heart; prefixo: string }[] = [
  { id: 'gorjeta', label: 'Gorjeta', icon: Heart, prefixo: 'Gorjeta' },
  { id: 'servico_extra', label: 'Serviço extra', icon: Sparkles, prefixo: 'Serviço extra' },
]

export function AdminCash() {
  const qc = useQueryClient()
  const [preset, setPreset] = useState('30')
  const hoje = hojeStr()
  const dias = PRESETS.find((p) => p.id === preset)?.dias ?? 29
  const de = preset === 'hoje' ? hoje : addDias(hoje, -dias)
  const ate = hoje

  // dialog state
  const [abrir, setAbrir] = useState(false)
  const [tipo, setTipo] = useState<TipoExtra>('gorjeta')
  const [valor, setValor] = useState('')
  const [forma, setForma] = useState<FormaPagamento>('pix')
  const [desc, setDesc] = useState('')
  const [data, setData] = useState(hoje)

  const { data: relatorio, isLoading } = useQuery({
    queryKey: ['caixa', de, ate],
    queryFn: async () => {
      const res = await fetch(`/api/caixa/relatorio?de=${de}&ate=${ate}`)
      const j = await res.json()
      return j as Relatorio
    },
  })

  const adicionar = useMutation({
    mutationFn: async () => {
      const v = Number(valor)
      if (!v || v <= 0) throw new Error('Informe um valor válido')
      const observacao = desc.trim()
        ? `${TIPOS_EXTRA.find((t) => t.id === tipo)!.prefixo}: ${desc.trim()}`
        : TIPOS_EXTRA.find((t) => t.id === tipo)!.prefixo
      const res = await fetch('/api/caixa/relatorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: v, formaPagamento: forma, data, observacao }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['caixa'] })
      toast.success('Valor adicionado ao caixa!')
      // reset
      setValor(''); setDesc(''); setTipo('gorjeta'); setForma('pix'); setData(hoje)
      setAbrir(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const chartData = (relatorio?.porDia || []).map((d) => ({
    ...d,
    label: formatDataCurta(d.data).split(',')[1]?.trim() || d.data,
  }))

  // conta gorjetas e extras no período
  const gorjetas = relatorio?.transacoes.filter((t) => t.observacao?.startsWith('Gorjeta')).reduce((s, t) => s + t.valor, 0) || 0
  const extras = relatorio?.transacoes.filter((t) => t.observacao?.startsWith('Serviço extra')).reduce((s, t) => s + t.valor, 0) || 0

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Caixa</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus ganhos</p>
        </div>
        <Button size="sm" onClick={() => setAbrir(true)}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      {/* Presets de período */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={preset === p.id ? 'default' : 'outline'}
            onClick={() => setPreset(p.id)}
            className="shrink-0"
          >
            {p.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : (
        <>
          {/* Total — vidro fosco com gradiente coral */}
          <Card className="glass glass-highlight border-primary/30 bg-gradient-to-br from-primary/15 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Wallet className="h-4 w-4" />
                Total recebido
              </div>
              <p className="text-3xl font-bold mt-1">{formatMoeda(relatorio?.resumo.total || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {relatorio?.resumo.quantidade || 0} transação(ões) · {formatDataCurta(de)} a {formatDataCurta(ate)}
              </p>
            </CardContent>
          </Card>

          {/* Resumo gorjetas + extras */}
          {(gorjetas > 0 || extras > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {gorjetas > 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="p-3 flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                      <Heart className="h-4 w-4 text-rose-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Gorjetas</p>
                      <p className="font-bold text-sm">{formatMoeda(gorjetas)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {extras > 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="p-3 flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Serviços extras</p>
                      <p className="font-bold text-sm">{formatMoeda(extras)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Gráfico */}
          {chartData.length > 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" /> Receita por dia
                </h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip
                        cursor={{ fill: 'oklch(0.62 0.16 10 / 0.08)' }}
                        contentStyle={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          fontSize: 12,
                          color: 'var(--foreground)',
                        }}
                        formatter={(v: number) => [formatMoeda(v), 'Recebido']}
                        labelFormatter={(l) => l}
                      />
                      <Bar dataKey="valor" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Por forma de pagamento */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold mb-3">Por forma de pagamento</h2>
              <ul className="space-y-2">
                {relatorio?.porForma.filter((p) => p.valor > 0).map((p) => (
                  <li key={p.forma} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{FORMA_PAGAMENTO_LABELS[p.forma as FormaPagamento] || p.forma}</span>
                    <span className="font-semibold">{formatMoeda(p.valor)}</span>
                  </li>
                ))}
                {(relatorio?.porForma.every((p) => p.valor === 0)) && (
                  <li className="text-sm text-muted-foreground text-center py-2">Sem transações no período.</li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Transações */}
          <div>
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Receipt className="h-4 w-4" /> Transações
            </h2>
            {(relatorio?.transacoes.length || 0) === 0 ? (
              <Card className="bg-card/50 border-dashed">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Nenhuma transação no período.
                </CardContent>
              </Card>
            ) : (
              <ul className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-thin pr-1">
                {relatorio?.transacoes.map((t) => {
                  const isGorjeta = t.observacao?.startsWith('Gorjeta')
                  const isExtra = t.observacao?.startsWith('Serviço extra')
                  return (
                    <li key={t.id} className="p-3 rounded-xl bg-card border border-border">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-sm truncate">
                              {t.agendamento?.cliente?.nome || t.observacao || 'Transação'}
                            </p>
                            {isGorjeta && <Heart className="h-3 w-3 text-rose-600 shrink-0" />}
                            {isExtra && <Sparkles className="h-3 w-3 text-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDataCurta(t.data)} · {t.agendamento?.servico?.nome || FORMA_PAGAMENTO_LABELS[t.formaPagamento as FormaPagamento]}
                          </p>
                        </div>
                        <span className="font-bold text-primary text-sm shrink-0">{formatMoeda(t.valor)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {/* ====== Dialog Adicionar Valor ====== */}
      <Dialog open={abrir} onOpenChange={setAbrir}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar valor ao caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tipo: gorjeta ou serviço extra */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_EXTRA.map((t) => {
                  const Icon = t.icon
                  const ativo = tipo === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTipo(t.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-all',
                        ativo ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                autoFocus
              />
            </div>

            {/* Forma de pagamento */}
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={forma} onValueChange={(v) => setForma(v as FormaPagamento)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(FORMA_PAGAMENTO).map((f) => (
                    <SelectItem key={f} value={f}>{FORMA_PAGAMENTO_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição opcional */}
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição (opcional)</Label>
              <Input
                id="desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={tipo === 'gorjeta' ? 'Cliente deixou gorjeta' : 'Ex: fez 2 esmaltações no lugar de 1'}
              />
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbrir(false)}>Cancelar</Button>
            <Button onClick={() => adicionar.mutate()} disabled={adicionar.isPending || !valor}>
              {adicionar.isPending ? 'Salvando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
