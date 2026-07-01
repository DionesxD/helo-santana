import { db } from '@/lib/db'
import { TIPO_NOTIFICACAO, type TipoNotificacao } from '@/lib/constants'
import { notifyWs } from '@/lib/ws-client'

interface NotifParams {
  usuarioId: string
  agendamentoId?: string
  tipo: TipoNotificacao
  mensagem: string
}

export async function criarNotificacao({ usuarioId, agendamentoId, tipo, mensagem }: NotifParams) {
  const notif = await db.notificacao.create({
    data: {
      usuarioId,
      agendamentoId: agendamentoId ?? null,
      tipo,
      mensagem,
    },
  })
  // dispara via websocket em tempo real (best-effort)
  notifyWs(usuarioId, {
    id: notif.id,
    tipo,
    mensagem,
    enviadaEm: notif.enviadaEm.toISOString(),
  }).catch(() => {})
  return notif
}

export function msgConfirmado(nomeCliente: string, dataHora: string) {
  return `Olá ${nomeCliente}! Seu agendamento foi confirmado para ${dataHora}. Até lá!`
}
export function msgRecusado(nomeCliente: string, motivo?: string) {
  return `Olá ${nomeCliente}, infelizmente não foi possível confirmar seu agendamento${motivo ? `: ${motivo}` : ''}. Entre em contato para reagendar.`
}
export function msgCancelado(nomeCliente: string, dataHora: string) {
  return `Olá ${nomeCliente}, seu agendamento de ${dataHora} foi cancelado.`
}
export function msgLembrete(nomeCliente: string, dataHora: string) {
  return `Olá ${nomeCliente}! Lembrando do seu atendimento amanhã às ${dataHora}.`
}
