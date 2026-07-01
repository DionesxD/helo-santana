// Cliente para o mini-serviço de notificações websocket (porta 3003)
// Envia evento "notify" para um usuário específico via HTTP interno.

const WS_NOTIFY_URL = process.env.WS_NOTIFY_URL || 'http://localhost:3003'

export async function notifyWs(usuarioId: string, payload: unknown): Promise<void> {
  try {
    await fetch(`${WS_NOTIFY_URL}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, payload }),
    })
  } catch {
    // best-effort: ignora se o serviço estiver fora do ar
  }
}
