'use client'

import { useState, type ReactNode } from 'react'
import { Home, CalendarDays, Palette, History } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@/components/auth-provider'
import { NotificationBell } from '@/components/notification-bell'
import { AvatarBubble } from '@/components/avatar-bubble'
import { ThemeToggle } from '@/components/theme-toggle'
import { ClientHome } from '@/components/client/client-home'
import { ClientBooking } from '@/components/client/client-booking'
import { ClientColorTester } from '@/components/client/client-color-tester'
import { ClientAppointments } from '@/components/client/client-appointments'
import { ClientProfileDialog } from '@/components/client/client-profile-dialog'
import { cn } from '@/lib/utils'
import { useNotificacoesNaoLidas } from '@/hooks/use-notificacoes-nao-lidas'
import { usePullToRefresh } from '@/hooks/use-gestures'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

type Tab = 'home' | 'agendar' | 'provador' | 'agendamentos'

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'agendar', label: 'Agendar', icon: CalendarDays },
  { id: 'provador', label: 'Provador', icon: Palette },
  { id: 'agendamentos', label: 'Meus', icon: History },
]

export function ClientApp() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('home')
  const [perfilOpen, setPerfilOpen] = useState(false)
  const naoLidas = useNotificacoesNaoLidas()
  const qc = useQueryClient()
  const { pullDistance, refreshing, threshold } = usePullToRefresh(async () => {
    await qc.invalidateQueries()
  })

  if (!user) return null

  const screens: Record<Tab, ReactNode> = {
    home: <ClientHome onAgendar={() => setTab('agendar')} onProvador={() => setTab('provador')} />,
    agendar: <ClientBooking />,
    provador: <ClientColorTester />,
    agendamentos: <ClientAppointments onAgendar={() => setTab('agendar')} />,
  }

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-md mx-auto w-full">
      {/* Header — vidro fosco */}
      <header className="sticky top-0 z-30 glass-bar border-b backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Avatar clicável → abre perfil */}
          <button onClick={() => setPerfilOpen(true)} className="flex items-center gap-2.5 min-w-0 group">
            <div key={user?.fotoUrl || 'no-photo'}>
              {user?.fotoUrl ? (
                <img src={user.fotoUrl} alt={user.nome} className={cn('h-9 w-9 rounded-full object-cover border border-border group-active:scale-95 transition-transform', naoLidas > 0 && 'pulse-ring')} />
              ) : (
                <AvatarBubble nome={user.nome} size="sm" className={cn('group-active:scale-95 transition-transform', naoLidas > 0 && 'pulse-ring')} />
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs text-muted-foreground leading-none">Olá,</p>
              <p className="text-sm font-semibold truncate leading-tight">{user.nome.split(' ')[0]}</p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Conteúdo — transição animada entre tabs */}
      {/* Indicador de pull-to-refresh */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-none"
          style={{ height: pullDistance }}
        >
          <RefreshCw
            className={cn('h-5 w-5 text-primary', refreshing && 'ptr-spinner')}
            style={{
              transform: `rotate(${pullDistance * 3}deg)`,
              opacity: Math.min(pullDistance / threshold, 1),
            }}
          />
        </div>
      )}
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

      {/* Bottom nav — vidro fosco */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass-bar border-t z-40 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150">
        <ul className="grid grid-cols-4">
          {TABS.map((t) => {
            const Icon = t.icon
            const ativo = tab === t.id
            return (
              <li key={t.id}>
                <button
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'w-full flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                    ativo ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <motion.span
                    animate={ativo ? { scale: 1.15, y: -1 } : { scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="relative"
                  >
                    <Icon className="h-5 w-5" />
                    {ativo && (
                      <motion.span
                        layoutId="nav-dot-client"
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      />
                    )}
                  </motion.span>
                  {t.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Dialog de perfil */}
      <ClientProfileDialog open={perfilOpen} onOpenChange={setPerfilOpen} />
    </div>
  )
}
