'use client'

import { useState, type ReactNode } from 'react'
import { LayoutDashboard, CalendarClock, Star, Wallet, Images, Scissors } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@/components/auth-provider'
import { NotificationBell } from '@/components/notification-bell'
import { AvatarBubble } from '@/components/avatar-bubble'
import { ThemeToggle } from '@/components/theme-toggle'
import { ManicureProfileDialog } from '@/components/manicure-profile-dialog'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { AdminPending } from '@/components/admin/admin-pending'
import { AdminTrustedClients } from '@/components/admin/admin-trusted-clients'
import { AdminCash } from '@/components/admin/admin-cash'
import { AdminGallery } from '@/components/admin/admin-gallery'
import { AdminServices } from '@/components/admin/admin-services'
import { cn } from '@/lib/utils'
import { useNotificacoesNaoLidas } from '@/hooks/use-notificacoes-nao-lidas'
import { ScrollArea } from '@/components/ui/scroll-area'

type Tab = 'dashboard' | 'pendentes' | 'confianca' | 'caixa' | 'galeria' | 'servicos'

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Agenda', icon: LayoutDashboard },
  { id: 'pendentes', label: 'Pendentes', icon: CalendarClock },
  { id: 'confianca', label: 'Confiança', icon: Star },
  { id: 'caixa', label: 'Caixa', icon: Wallet },
  { id: 'galeria', label: 'Galeria', icon: Images },
  { id: 'servicos', label: 'Serviços', icon: Scissors },
]

export function ManicureApp() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [perfilOpen, setPerfilOpen] = useState(false)
  const naoLidas = useNotificacoesNaoLidas()

  if (!user) return null

  const screens: Record<Tab, ReactNode> = {
    dashboard: <AdminDashboard />,
    pendentes: <AdminPending />,
    confianca: <AdminTrustedClients />,
    caixa: <AdminCash />,
    galeria: <AdminGallery />,
    servicos: <AdminServices />,
  }

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-md mx-auto w-full">
      {/* Header — vidro fosco */}
      <header className="sticky top-0 z-30 glass-bar border-b backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Avatar clicável → abre perfil */}
          <button onClick={() => setPerfilOpen(true)} className="flex items-center gap-2.5 min-w-0 group">
            {user.fotoUrl ? (
              <img src={user.fotoUrl} alt={user.nome} className={cn('h-9 w-9 rounded-full object-cover border border-border group-active:scale-95 transition-transform', naoLidas > 0 && 'pulse-ring')} />
            ) : (
              <AvatarBubble nome={user.nome} size="sm" className={cn('group-active:scale-95 transition-transform', naoLidas > 0 && 'pulse-ring')} />
            )}
            <div className="min-w-0 text-left">
              <p className="text-xs text-muted-foreground leading-none">Painel da manicure</p>
              <p className="text-sm font-semibold truncate leading-tight">{user.nome}</p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Conteúdo — transição animada entre tabs */}
      <main className="flex-1 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {screens[tab]}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav (6 itens, scrollável em telas pequenas) — vidro fosco */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass-bar border-t z-40 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150">
        <ScrollArea className="w-full no-scrollbar">
          <ul className="grid grid-cols-6 min-w-full">
            {TABS.map((t) => {
              const Icon = t.icon
              const ativo = tab === t.id
              return (
                <li key={t.id} className="flex">
                  <button
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'w-full flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors px-1',
                      ativo ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 transition-transform', ativo && 'scale-110')} />
                    <span className="truncate">{t.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </ScrollArea>
      </nav>

      {/* Dialog de perfil */}
      <ManicureProfileDialog open={perfilOpen} onOpenChange={setPerfilOpen} />
    </div>
  )
}
