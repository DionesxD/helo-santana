// Constantes e tipos compartilhados entre frontend e backend

export const STATUS_AGENDAMENTO = {
  pendente: 'pendente',
  confirmado: 'confirmado',
  recusado: 'recusado',
  concluido: 'concluido',
  cancelado: 'cancelado',
} as const
export type StatusAgendamento = keyof typeof STATUS_AGENDAMENTO

export const STATUS_HORARIO = {
  livre: 'livre',
  reservado: 'reservado',
  bloqueado: 'bloqueado',
} as const
export type StatusHorario = keyof typeof STATUS_HORARIO

export const TIPO_USUARIO = {
  cliente: 'cliente',
  manicure: 'manicure',
} as const
export type TipoUsuario = keyof typeof TIPO_USUARIO

export const FORMA_PAGAMENTO = {
  pix: 'pix',
  dinheiro: 'dinheiro',
  cartao_debito: 'cartao_debito',
  cartao_credito: 'cartao_credito',
  outro: 'outro',
} as const
export type FormaPagamento = keyof typeof FORMA_PAGAMENTO

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao_debito: 'Cartão de débito',
  cartao_credito: 'Cartão de crédito',
  outro: 'Outro',
}

export const TIPO_NOTIFICACAO = {
  agendamento_confirmado: 'agendamento_confirmado',
  agendamento_recusado: 'agendamento_recusado',
  lembrete_atendimento: 'lembrete_atendimento',
  horario_vago: 'horario_vago',
  agendamento_cancelado: 'agendamento_cancelado',
} as const
export type TipoNotificacao = keyof typeof TIPO_NOTIFICACAO

export const STATUS_AGENDAMENTO_LABELS: Record<StatusAgendamento, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  recusado: 'Recusado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

// Cores de status alinhadas à paleta da marca (com variantes dark)
export const STATUS_AGENDAMENTO_CORES: Record<StatusAgendamento, string> = {
  pendente: 'bg-[#E8A33D]/15 text-[#9A6B1F] border-[#E8A33D]/40 dark:text-[#F5C876]',
  confirmado: 'bg-[#4F9A6E]/15 text-[#2F6B4A] border-[#4F9A6E]/40 dark:text-[#7FD4A4]',
  recusado: 'bg-[#C44C4C]/15 text-[#8A2E2E] border-[#C44C4C]/40 dark:text-[#F08A8A]',
  concluido: 'bg-[#D85A78]/10 text-[#B23A5C] border-[#D85A78]/30 dark:text-[#F2B6C6]',
  cancelado: 'bg-[#8A8782]/15 text-[#5A5752] border-[#8A8782]/40 dark:text-[#BCBAB6]',
}

// Política de cancelamento: até 4 horas antes do horário
export const CANCELAMENTO_HORAS_MIN = 4
