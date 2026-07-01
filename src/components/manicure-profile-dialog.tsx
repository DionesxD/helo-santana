'use client'

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvatarBubble } from '@/components/avatar-bubble'
import { Camera, Loader2, Lock, LogOut, User as UserIcon, Phone, Mail, Check } from 'lucide-react'
import { toast } from '@/components/ui/custom-toast'
import { useAuthStore } from '@/components/auth-provider'

export function ManicureProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState(user?.nome ?? '')
  const [telefone, setTelefone] = useState(user?.telefone ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [fotoUrl, setFotoUrl] = useState(user?.fotoUrl ?? null)

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')

  const uploadFoto = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d.url as string
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const salvarPerfil = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, telefone, email, fotoUrl }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: (data) => {
      setUser(data.user)
      qc.invalidateQueries()
      toast.success('Perfil atualizado!')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const trocarSenha = useMutation({
    mutationFn: async () => {
      if (novaSenha !== confirmar) throw new Error('As senhas não coincidem')
      const res = await fetch('/api/auth/senha', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!')
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('')
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadFoto.mutateAsync(file)
    setFotoUrl(url)
    toast.success('Foto enviada! Salve para confirmar.')
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Meu perfil</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="dados"><UserIcon className="h-3.5 w-3.5 mr-1.5 inline" /> Dados</TabsTrigger>
            <TabsTrigger value="senha"><Lock className="h-3.5 w-3.5 mr-1.5 inline" /> Senha</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                {fotoUrl ? (
                  <img src={fotoUrl} alt={user.nome} className="h-20 w-20 rounded-full object-cover border-2 border-border" />
                ) : (
                  <AvatarBubble nome={nome || user.nome} size="lg" />
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center border-2 border-background shadow"
                  aria-label="Trocar foto"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto} className="hidden" />
              </div>
              <p className="text-xs text-muted-foreground">Toque na câmera para trocar a foto</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-nome">Nome</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="p-nome" value={nome} onChange={(e) => setNome(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-tel">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="p-tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="pl-9" placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="voce@email.com" />
              </div>
            </div>

            <Button className="w-full" onClick={() => salvarPerfil.mutate()} disabled={salvarPerfil.isPending || !nome.trim()}>
              {salvarPerfil.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Salvando...</> : <><Check className="h-4 w-4 mr-1" /> Salvar</>}
            </Button>
          </TabsContent>

          <TabsContent value="senha" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sa">Senha atual</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="sa" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ns">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="ns" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="pl-9" placeholder="Mínimo 4 caracteres" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cs">Confirmar nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="cs" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} className="pl-9" />
              </div>
            </div>
            <Button className="w-full" onClick={() => trocarSenha.mutate()} disabled={trocarSenha.isPending || !senhaAtual || !novaSenha}>
              {trocarSenha.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Alterando...</> : 'Alterar senha'}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t border-border pt-4 -mx-6 px-6">
          <Button variant="outline" className="w-full text-rose-600 border-rose-500/30 hover:bg-rose-500/10" onClick={() => { onOpenChange(false); logout() }}>
            <LogOut className="h-4 w-4 mr-1.5" /> Sair da conta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
