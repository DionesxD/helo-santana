'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Trash2, Upload, Link2, ImageIcon, Loader2, Pencil } from 'lucide-react'
import { toast } from '@/components/ui/custom-toast'
import { cn } from '@/lib/utils'

interface Modelo {
  id: string
  urlImagem: string
  descricao: string | null
  tags: string[]
}

export function AdminGallery() {
  const qc = useQueryClient()
  const [abrir, setAbrir] = useState(false)
  const [modo, setModo] = useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [excluir, setExcluir] = useState<Modelo | null>(null)
  const [editando, setEditando] = useState<Modelo | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editTags, setEditTags] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: modelos, isLoading } = useQuery({
    queryKey: ['galeria'],
    queryFn: async () => {
      const res = await fetch('/api/galeria', { credentials: 'include' })
      const j = await res.json()
      return (j.modelos ?? []) as Modelo[]
    },
  })

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d.url as string
    },
  })

  const criar = useMutation({
    mutationFn: async (urlImagem: string) => {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      const res = await fetch('/api/galeria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlImagem, descricao, tags }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['galeria'] })
      toast.success('Modelo adicionado à galeria!')
      reset()
      setAbrir(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const excluirMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/galeria/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['galeria'] })
      toast.success('Modelo removido.')
      setExcluir(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const editarModelo = useMutation({
    mutationFn: async () => {
      const tags = editTags.split(',').map((t) => t.trim()).filter(Boolean)
      const res = await fetch(`/api/galeria/${editando!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: editDesc, tags }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['galeria'] })
      toast.success('Modelo atualizado!')
      setEditando(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function abrirEdicao(m: Modelo) {
    setEditando(m)
    setEditDesc(m.descricao || '')
    setEditTags(m.tags.join(', '))
  }

  function reset() {
    setModo('upload'); setUrlInput(''); setDescricao(''); setTagsInput('')
    setPreview(null); setArquivo(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setArquivo(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit() {
    try {
      let url = ''
      if (modo === 'upload' && arquivo) {
        url = await upload.mutateAsync(arquivo)
      } else if (modo === 'url' && urlInput) {
        url = urlInput
      } else {
        toast.error('Forneça uma imagem.')
        return
      }
      criar.mutate(url)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Galeria</h1>
          <p className="text-sm text-muted-foreground">Inspirações para suas clientes</p>
        </div>
        <Dialog open={abrir} onOpenChange={(o) => { setAbrir(o); if (!o) reset() }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo modelo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Modo */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant={modo === 'upload' ? 'default' : 'outline'} size="sm" onClick={() => setModo('upload')}>
                  <Upload className="h-4 w-4 mr-1.5" /> Enviar arquivo
                </Button>
                <Button variant={modo === 'url' ? 'default' : 'outline'} size="sm" onClick={() => setModo('url')}>
                  <Link2 className="h-4 w-4 mr-1.5" /> URL da imagem
                </Button>
              </div>

              {modo === 'upload' ? (
                <div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className={cn(
                      'w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
                      preview ? 'border-primary/40' : 'border-border hover:border-primary/40'
                    )}
                  >
                    {preview ? (
                      <img src={preview} alt="preview" className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Toque para escolher uma imagem</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="url">URL da imagem</Label>
                  <Input id="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://..." />
                  {urlInput && (
                    <img src={urlInput} alt="preview" className="w-full aspect-video object-cover rounded-xl" />
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="desc">Descrição</Label>
                <Input id="desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Francesinha moderna" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="francesinha, nude, classico" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAbrir(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={criar.isPending || upload.isPending}>
                {(criar.isPending || upload.isPending) ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enviando...</>
                ) : 'Adicionar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      ) : modelos && modelos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {modelos.map((m) => (
            <Card key={m.id} className="bg-card border-border overflow-hidden group relative">
              <img src={m.urlImagem} alt={m.descricao || 'Modelo'} className="w-full aspect-square object-cover" />
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{m.descricao || 'Modelo'}</p>
                {m.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {m.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">{t}</span>
                    ))}
                  </div>
                )}
              </CardContent>
              <button
                onClick={() => setExcluir(m)}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-rose-600 shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => abrirEdicao(m)}
                className="absolute top-2 right-11 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-primary shadow-sm"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="p-10 text-center">
            <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Galeria vazia. Adicione modelos para suas clientes.</p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              O modelo "{excluir?.descricao}" será removido da galeria.
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

      {/* Dialog de edição */}
      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar modelo</DialogTitle>
          </DialogHeader>
          {editando && (
            <div className="space-y-4">
              {/* Preview da imagem atual */}
              <img src={editando.urlImagem} alt={editando.descricao || 'Modelo'} className="w-full aspect-video object-cover rounded-xl" />
              <div className="space-y-2">
                <Label htmlFor="edit-desc">Descrição</Label>
                <Input id="edit-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Ex: Francesinha moderna" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (separadas por vírgula)</Label>
                <Input id="edit-tags" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="francesinha, nude, classico" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={() => editarModelo.mutate()} disabled={editarModelo.isPending}>
              {editarModelo.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
