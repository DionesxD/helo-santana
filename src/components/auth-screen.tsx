'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, Mail, Lock, User, ShieldCheck, Sparkles, Calendar, Palette, Wallet, KeyRound } from 'lucide-react'
import { toast } from '@/components/ui/custom-toast'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/components/auth-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { hapticSuccess, hapticError, confetti } from '@/lib/feedback'

export function AuthScreen() {
  const setUser = useAuthStore((s) => s.setUser)
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)

  const [identifier, setIdentifier] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senhaCad, setSenhaCad] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, senha }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erro ao entrar'); hapticError(); return }
      hapticSuccess()
      // Reload garante que o cookie está setado e todas as queries começam limpas
      window.location.href = '/'
    } catch { toast.error('Erro de conexão'); hapticError() }
    finally { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, telefone, senha: senhaCad }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erro ao cadastrar'); hapticError(); return }
      hapticSuccess(); confetti({ emojis: ['💅', '✨', '💖'] })
      window.location.href = '/'
    } catch { toast.error('Erro de conexão'); hapticError() }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background relative overflow-hidden">
      {/* Toggle de tema */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      {/* === LADO ESQUERDO: HERO (desktop only) === */}
      <div className="hidden md:flex md:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        {/* Background: blobs dinâmicos que flutuam — mais vibrantes no modo claro */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-primary/35 dark:bg-primary/20 blur-3xl blob-1" />
          <div className="absolute bottom-0 -left-20 h-80 w-80 rounded-full bg-[#F2B6C6]/50 dark:bg-[#F2B6C6]/30 blur-3xl blob-2" />
          <div className="absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-primary/20 dark:bg-primary/10 blur-3xl blob-3" />
          <div className="absolute top-1/4 right-1/4 h-48 w-48 rounded-full bg-[#E8A33D]/20 dark:bg-[#E8A33D]/10 blur-3xl blob-3" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center max-w-sm"
        >
          {/* Logo grande em card glass */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 -m-8 rounded-[3rem] bg-gradient-to-br from-primary/30 via-[#F2B6C6]/35 to-primary/15 blur-3xl blob-1" />
            <div className="relative rounded-[2rem] px-14 py-10 backdrop-blur-2xl backdrop-saturate-150 bg-white/60 dark:bg-white/10 border border-white/50 dark:border-white/15 shadow-2xl shadow-primary/10">
              <img src="/logo.png" alt="Helo Santana — Nail Designer" className="h-60 w-auto mx-auto object-contain drop-shadow-lg brightness-[0.65] dark:brightness-100" />
            </div>
          </div>

          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Suas unhas, <span className="text-primary">impecáveis</span>.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            Agende online, experimente cores no provador virtual e acompanhe seu histórico — tudo em um só lugar.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Calendar, label: 'Agende\nonline' },
              { icon: Palette, label: 'Provador\nde cores' },
              { icon: Wallet, label: 'Histórico\ncompleto' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl backdrop-blur-md bg-white/15 dark:bg-white/5 border border-white/20 dark:border-white/10"
              >
                <f.icon className="h-6 w-6 text-primary" />
                <span className="text-xs text-muted-foreground whitespace-pre-line text-center leading-tight">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* === LADO DIREITO: FORM (desktop) / CENTRAL (mobile) === */}
      <div className="flex-1 md:w-1/2 flex items-center justify-center p-6 relative z-10">
        {/* blobs dinâmicos no mobile — mais vibrantes no modo claro */}
        <div aria-hidden className="pointer-events-none absolute inset-0 md:hidden overflow-hidden">
          <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-primary/25 dark:bg-primary/15 blur-3xl blob-1" />
          <div className="absolute top-1/3 -left-24 h-64 w-64 rounded-full bg-[#F2B6C6]/40 dark:bg-[#F2B6C6]/25 blur-3xl blob-2" />
          <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-primary/15 dark:bg-primary/10 blur-3xl blob-3" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Logo grande no mobile */}
          <div className="text-center mb-6 md:hidden">
            <div className="relative inline-block mb-3">
              <div className="absolute inset-0 -m-6 rounded-[2.5rem] bg-gradient-to-br from-primary/30 via-[#F2B6C6]/35 to-primary/15 blur-2xl blob-1" />
              <div className="relative rounded-[1.5rem] px-8 py-5 backdrop-blur-2xl backdrop-saturate-150 bg-white/60 dark:bg-white/10 border border-white/50 dark:border-white/15 shadow-xl">
                <img src="/logo.png" alt="Helo Santana" className="h-36 w-auto mx-auto object-contain drop-shadow-md brightness-[0.65] dark:brightness-100" />
              </div>
            </div>
          </div>

          {/* Card de login glass */}
          <Card className="border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-2xl shadow-primary/5">
            <CardContent className="pt-6">
              <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Criar conta</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="id">E-mail ou telefone</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="id" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="ana@exemplo.com" className="pl-9" autoComplete="username" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="senha">Senha</Label>
                        <button type="button" onClick={() => toast.info('Entre em contato para redefinir sua senha.')} className="text-xs text-primary hover:underline flex items-center gap-1">
                          <KeyRound className="h-3 w-3" /> Esqueceu?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••" className="pl-9" autoComplete="current-password" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={loading}>
                      {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Seus dados estão seguros.</span>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-cad">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="email-cad" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tel-cad">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="tel-cad" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="senha-cad">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="senha-cad" type="password" value={senhaCad} onChange={(e) => setSenhaCad(e.target.value)} placeholder="Mínimo 4 caracteres" className="pl-9" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={loading}>
                      {loading ? 'Criando...' : 'Criar conta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Features no mobile */}
          <div className="mt-5 flex items-center justify-center gap-5 text-[11px] text-muted-foreground md:hidden">
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" /> Agende</span>
            <span className="h-3 w-px bg-border" />
            <span className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5 text-primary" /> Provador</span>
            <span className="h-3 w-px bg-border" />
            <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-primary" /> Histórico</span>
          </div>
        </motion.div>
      </div>

      {/* Rodapé */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-4 text-center">
        <p className="text-[10px] text-muted-foreground/60">© {new Date().getFullYear()} Helo Santana — Nail Designer</p>
        <div className="mt-1 flex items-center justify-center gap-3 text-[10px]">
          <a href="/termos" className="text-muted-foreground/60 hover:text-primary transition-colors">Termos</a>
          <span className="h-2 w-px bg-border" />
          <a href="/privacidade" className="text-muted-foreground/60 hover:text-primary transition-colors">Privacidade</a>
        </div>
      </footer>
    </div>
  )
}
