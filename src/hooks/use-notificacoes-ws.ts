'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/components/auth-provider'

export interface NotificacaoLive {
  id?: string
  tipo: string
  mensagem: string
  enviadaEm?: string
}

// Hook para conectar ao websocket de notificações.
// Em dev: conecta via gateway local (/?XTransformPort=3003).
// Em produção (Vercel): se NEXT_PUBLIC_WS_URL não estiver definida, NÃO tenta
// conectar — o NotificationBell já faz polling a cada 30s como fallback.
export function useNotificacoesWs(onNotificacao: (n: NotificacaoLive) => void) {
  const user = useAuthStore((s) => s.user)
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  // URL do WS: em dev usa o gateway local, em prod usa NEXT_PUBLIC_WS_URL
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL

  useEffect(() => {
    if (!user) return
    // Se não há URL de WS configurada (ex: Vercel sem o serviço), não conecta.
    // O polling do NotificationBell (30s) garante que as notificações cheguem.
    if (!wsUrl) return

    const socket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('register', { usuarioId: user.id })
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('notificacao', (data: NotificacaoLive) => {
      onNotificacao(data)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?.id, wsUrl])

  return { connected }
}
