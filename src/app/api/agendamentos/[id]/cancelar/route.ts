import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_AGENDAMENTO, STATUS_HORARIO, CANCELAMENTO_HORAS_MIN } from '@/lib/constants'
import { criarNotificacao, msgCancelado } from '@/lib/notifications'

function formatData(dataStr: string, hora: string) {
  const [y, m, d] = dataStr.split('-').map(Number)
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const dt = new Date(y, m - 1, d)
  return `${dias[dt.getDay()]}, ${d} ${meses[m - 1]} às ${hora}`
}

// POST /api/agendamentos/[id]/cancelar
//   - cliente: cancela próprio agendamento (apenas confirmado/pendente), respeitando política
//   - manicure: cancela qualquer agendamento ativo
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params

  try {
    const { motivo } = await req.json().catch(() => ({}))
    const ag = await db.agendamento.findUnique({
      where: { id },
      include: { horario: true, cliente: true },
    })
    if (!ag) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    // permissões
    if (user.tipo === 'cliente' && ag.clienteId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    if (user.tipo === 'manicure' && ag.manicureId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (!['pendente', 'confirmado'].includes(ag.status)) {
      return NextResponse.json({ error: 'Agendamento não pode ser cancelado' }, { status: 400 })
    }

    // política de prazo para cliente: alerta visual, mas não bloqueia na v1
    let alertaPrazo = false
    if (user.tipo === 'cliente') {
      const [y, m, d] = ag.horario.data.split('-').map(Number)
      const [hh, mm] = ag.horario.horaInicio.split(':').map(Number)
      const dtAtendimento = new Date(y, m - 1, d, hh, mm)
      const diffHoras = (dtAtendimento.getTime() - Date.now()) / 3600000
      if (diffHoras < CANCELAMENTO_HORAS_MIN) alertaPrazo = true
    }

    const atualizado = await db.agendamento.update({
      where: { id },
      data: { status: STATUS_AGENDAMENTO.cancelado, motivoRecusa: motivo || null },
    })
    // libera horário
    await db.horarioDisponivel.update({
      where: { id: ag.horarioId },
      data: { status: STATUS_HORARIO.livre },
    })

    // notifica cliente do cancelamento
    await criarNotificacao({
      usuarioId: ag.clienteId,
      agendamentoId: ag.id,
      tipo: 'agendamento_cancelado',
      mensagem: msgCancelado(ag.cliente.nome, formatData(ag.horario.data, ag.horario.horaInicio)),
    })

    return NextResponse.json({ agendamento: atualizado, alertaPrazo })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
