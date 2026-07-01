'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { AvatarBubble } from '@/components/avatar-bubble'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Search, Star, Phone, Mail, Plus, StickyNote, Calendar, Wallet, Clock, KeyRound, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/custom-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { formatDataCurta, formatMoeda } from '@/lib/format'

interface Cliente {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  eClienteConfianca: boolean
  totalAtendimentos: number
  criadoEm: string
}
interface HistoricoItem {
  id: string
  dataAtendimento: string
  servicoNome: string
  corUsada: string | null
  valorPago: number | null
  observacoes: string | null
}
interface NotaItem {
  id: string
  observacao: string
  criadoEm: string
}
interface DetalheCliente {
  cliente: Cliente
  historico: HistoricoItem[]
  notas: NotaItem[]
  resumo: { totalAtendimentos: number; totalGasto: number; ultimoAtendimento: string | null }
}

export function AdminTrustedClients() {
  const qc = useQueryClient()
  const [busca, setBusca] = useState('')
  const [soConfianca, setSoConfianca] = useState(false)
  const [detalheId, setDetalheId] = useState<string | null>(null)
  const [novaNota, setNovaNota] = useState('')
  const [senhaCliente, setSenhaCliente] = useState<{ id: string; nome: string } | null>(null)
  const [novaSenhaCli, setNovaSenhaCli] = useState('')
  const [excluirCliente, setExcluirCliente] = useState<Cliente | null>(null)

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes', busca, soConfianca],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (busca) params.set('busca', busca)
      if (soConfianca) params.set('confianca', 'true')
      const res = await fetch(`/api/clientes?${params}`)
      const j = await res.json()
      return j.clientes as Cliente[]
    },
  })

  const { data: detalhe } = useQuery({
    queryKey: ['cliente', detalheId],
    queryFn: async () => {
      const res = await fetch(`/api/clientes/${detalheId}/historico`)
      const j = await res.json()
      return j as DetalheCliente
    },
    enabled: !!detalheId,
  })

  const toggleConfianca = useMutation({
    mutationFn: async ({ id, valor }: { id: string; valor: boolean }) => {
      const res = await fetch(`/api/clientes/${id}/confianca`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eClienteConfianca: valor }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      qc.invalidateQueries({ queryKey: ['cliente', detalheId] })
      toast.success(d.cliente.eClienteConfianca ? 'Marcada como cliente de confiança ⭐' : 'Removida de confiança')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const addNota = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clientes/${detalheId}/notas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacao: novaNota }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cliente', detalheId] })
      setNovaNota('')
      toast.success('Observação adicionada.')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const redefinirSenha = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clientes/${senhaCliente!.id}/senha`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novaSenha: novaSenhaCli }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      toast.success('Senha redefinida com sucesso!')
      setSenhaCliente(null)
      setNovaSenhaCli('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const excluirClienteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente excluído.')
      setExcluirCliente(null)
      setDetalheId(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">Gerencie confiança e histórico</p>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone..."
          className="pl-9"
        />
      </div>

      {/* Filtro confiança */}
      <div className="flex items-center gap-2 px-1">
        <Switch id="conf" checked={soConfianca} onCheckedChange={setSoConfianca} />
        <label htmlFor="conf" className="text-sm flex items-center gap-1.5 cursor-pointer">
          <Star className="h-4 w-4 text-amber-600" /> Apenas clientes de confiança
        </label>
      </div>

      {/* Lista */}
      {isLoading ? (
        [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
      ) : clientes && clientes.length > 0 ? (
        <div className="space-y-2">
          {clientes.map((c) => (
            <Card key={c.id} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-3">
                <button onClick={() => setDetalheId(c.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <AvatarBubble nome={c.nome} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold truncate">{c.nome}</p>
                      {c.eClienteConfianca && <Star className="h-3.5 w-3.5 text-amber-600 fill-amber-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.totalAtendimentos} atendimento{c.totalAtendimentos !== 1 ? 's' : ''}
                      {c.telefone && ` · ${c.telefone}`}
                    </p>
                  </div>
                </button>
                <Switch
                  checked={c.eClienteConfianca}
                  onCheckedChange={(v) => toggleConfianca.mutate({ id: c.id, valor: v })}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado.
          </CardContent>
        </Card>
      )}

      {/* Sheet de detalhes */}
      <Sheet open={!!detalheId} onOpenChange={(o) => !o && setDetalheId(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {detalhe?.cliente && <AvatarBubble nome={detalhe.cliente.nome} size="sm" />}
              {detalhe?.cliente.nome}
              {detalhe?.cliente.eClienteConfianca && (
                <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                  <Star className="h-3 w-3 mr-1 fill-emerald-500" /> Confiança
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {detalhe && (
            <ScrollArea className="flex-1 -mx-6 px-8">
              <div className="space-y-7 pb-10">
                {/* Contato */}
                <div className="space-y-3 text-sm">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contato</h3>
                  {detalhe.cliente.telefone && (
                    <p className="flex items-center gap-2.5 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" /> {detalhe.cliente.telefone}
                    </p>
                  )}
                  {detalhe.cliente.email && (
                    <p className="flex items-center gap-2.5 text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" /> {detalhe.cliente.email}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-primary border-primary/30 hover:bg-primary/10"
                      onClick={() => setSenhaCliente({ id: detalhe.cliente.id, nome: detalhe.cliente.nome })}
                    >
                      <KeyRound className="h-4 w-4 mr-1.5" /> Redefinir senha
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                      onClick={() => setExcluirCliente(detalhe.cliente)}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" /> Excluir
                    </Button>
                  </div>
                </div>

                {/* Resumo */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Resumo</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-card border border-border p-3 text-center">
                      <Calendar className="h-4 w-4 mx-auto text-primary mb-1.5" />
                      <p className="text-lg font-bold">{detalhe.resumo.totalAtendimentos}</p>
                      <p className="text-[10px] text-muted-foreground">Atendimentos</p>
                    </div>
                    <div className="rounded-xl bg-card border border-border p-3 text-center">
                      <Wallet className="h-4 w-4 mx-auto text-primary mb-1.5" />
                      <p className="text-sm font-bold leading-tight">{formatMoeda(detalhe.resumo.totalGasto)}</p>
                      <p className="text-[10px] text-muted-foreground">Total gasto</p>
                    </div>
                    <div className="rounded-xl bg-card border border-border p-3 text-center">
                      <Clock className="h-4 w-4 mx-auto text-primary mb-1.5" />
                      <p className="text-xs font-semibold leading-tight">
                        {detalhe.resumo.ultimoAtendimento ? formatDataCurta(detalhe.resumo.ultimoAtendimento) : '—'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Último</p>
                    </div>
                  </div>
                </div>

                {/* Observações / notas */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <StickyNote className="h-3.5 w-3.5" /> Observações
                  </h3>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={novaNota}
                      onChange={(e) => setNovaNota(e.target.value)}
                      placeholder="Ex: alergia, preferência..."
                      onKeyDown={(e) => { if (e.key === 'Enter' && novaNota.trim()) addNota.mutate() }}
                    />
                    <Button size="icon" onClick={() => addNota.mutate()} disabled={!novaNota.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {detalhe.notas.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Nenhuma observação ainda.</p>
                  ) : (
                    <ul className="space-y-2">
                      {detalhe.notas.map((n) => (
                        <li key={n.id} className="text-sm p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <p>{n.observacao}</p>
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            {new Date(n.criadoEm).toLocaleDateString('pt-BR')}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Histórico de atendimentos */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Histórico de atendimentos</h3>
                  {detalhe.historico.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Sem atendimentos registrados.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {detalhe.historico.map((h) => (
                        <li key={h.id} className="text-sm p-3.5 rounded-xl bg-card border border-border">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-medium">{h.servicoNome}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{formatDataCurta(h.dataAtendimento)}</p>
                            </div>
                            {h.valorPago != null && (
                              <span className="text-sm font-semibold text-primary">{formatMoeda(h.valorPago)}</span>
                            )}
                          </div>
                          {h.corUsada && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>🎨 {h.corUsada}</span>
                            </div>
                          )}
                          {h.observacoes && <p className="text-xs text-muted-foreground mt-2 italic">"{h.observacoes}"</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog de redefinição de senha */}
      <Dialog open={!!senhaCliente} onOpenChange={(o) => { if (!o) { setSenhaCliente(null); setNovaSenhaCli('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Defina uma nova senha para <span className="font-medium text-foreground">{senhaCliente?.nome}</span>. Ela poderá usar esta senha para entrar.
            </p>
            <div className="space-y-2">
              <Label htmlFor="ns-cli">Nova senha</Label>
              <Input
                id="ns-cli"
                type="text"
                value={novaSenhaCli}
                onChange={(e) => setNovaSenhaCli(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Dica: use uma senha temporária simples e peça para a cliente trocar após o primeiro acesso.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSenhaCliente(null); setNovaSenhaCli('') }}>Cancelar</Button>
            <Button onClick={() => redefinirSenha.mutate()} disabled={redefinirSenha.isPending || novaSenhaCli.length < 4}>
              {redefinirSenha.isPending ? 'Redefinindo...' : 'Redefinir senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de exclusão de cliente */}
      <AlertDialog open={!!excluirCliente} onOpenChange={(o) => !o && setExcluirCliente(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {excluirCliente && (
                <>
                  <span className="font-medium text-foreground">{excluirCliente.nome}</span> será excluída permanentemente.
                  O histórico de atendimentos será mantido, mas a cliente não poderá mais acessar a plataforma.
                  Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => excluirCliente && excluirClienteMut.mutate(excluirCliente.id)}
              className="bg-rose-500 hover:bg-rose-600 text-white"
              disabled={excluirClienteMut.isPending}
            >
              {excluirClienteMut.isPending ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
