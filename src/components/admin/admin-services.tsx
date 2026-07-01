'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Clock, Scissors } from 'lucide-react'
import { toast } from '@/components/ui/custom-toast'

interface Servico {
  id: string
  nome: string
  descricao: string | null
  preco: number
  duracaoMinutos: number
  ativo: boolean
}

export function AdminServices() {
  const qc = useQueryClient()
  const [abrir, setAbrir] = useState(false)
  const [editando, setEditando] = useState<Servico | null>(null)
  const [excluir, setExcluir] = useState<Servico | null>(null)
  const [form, setForm] = useState({ nome: '', descricao: '', preco: '', duracaoMinutos: '' })

  const { data: servicos, isLoading } = useQuery({
    queryKey: ['servicos'],
    queryFn: async () => {
      const res = await fetch('/api/servicos', { credentials: 'include' })
      const j = await res.json()
      return (j.servicos ?? []) as Servico[]
    },
  })

  function abrirNovo() {
    setEditando(null)
    setForm({ nome: '', descricao: '', preco: '', duracaoMinutos: '' })
    setAbrir(true)
  }
  function abrirEditar(s: Servico) {
    setEditando(s)
    setForm({ nome: s.nome, descricao: s.descricao || '', preco: String(s.preco), duracaoMinutos: String(s.duracaoMinutos) })
    setAbrir(true)
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome,
        descricao: form.descricao || null,
        preco: Number(form.preco),
        duracaoMinutos: Number(form.duracaoMinutos),
      }
      if (!payload.nome || !payload.preco || !payload.duracaoMinutos) {
        throw new Error('Preencha nome, preço e duração')
      }
      const url = editando ? `/api/servicos/${editando.id}` : '/api/servicos'
      const method = editando ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servicos'] })
      toast.success(editando ? 'Serviço atualizado!' : 'Serviço criado!')
      setAbrir(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const excluirMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/servicos/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servicos'] })
      toast.success('Serviço removido.')
      setExcluir(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground">Gerencie o menu de serviços</p>
        </div>
        <Button size="sm" onClick={abrirNovo}><Plus className="h-4 w-4 mr-1" /> Novo</Button>
      </div>

      {isLoading ? (
        [0, 1].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
      ) : servicos && servicos.length > 0 ? (
        <div className="space-y-2">
          {servicos.map((s) => (
            <Card key={s.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-primary shrink-0" />
                      <p className="font-semibold truncate">{s.nome}</p>
                    </div>
                    {s.descricao && <p className="text-xs text-muted-foreground mt-1">{s.descricao}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="font-bold text-primary">R$ {s.preco.toFixed(2).replace('.', ',')}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {s.duracaoMinutos} min
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => abrirEditar(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => setExcluir(s)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="p-10 text-center">
            <Scissors className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog criar/editar */}
      <Dialog open={abrir} onOpenChange={setAbrir}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Esmaltação em gel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea id="desc" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhes do serviço" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="preco">Preço (R$)</Label>
                <Input id="preco" type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} placeholder="50.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dur">Duração (min)</Label>
                <Input id="dur" type="number" value={form.duracaoMinutos} onChange={(e) => setForm({ ...form, duracaoMinutos: e.target.value })} placeholder="60" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbrir(false)}>Cancelar</Button>
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              "{excluir?.nome}" será desativado. Históricos existentes não são afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => excluir && excluirMut.mutate(excluir.id)} className="bg-rose-500 hover:bg-rose-600 text-white">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
