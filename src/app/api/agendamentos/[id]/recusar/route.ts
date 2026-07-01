import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_AGENDAMENTO, STATUS_HORARIO } from '@/lib/constants'
import { criarNotificacao, msgRecusado } from '@/lib/notifications'

// POST /api/agendamentos/[id]/recusar — manicure recusa agendamento pendente
//   body: { motivo? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  try {
    const { motivo } = await req.json()
    const ag = await db.agendamento.findUnique({
      where: { id },
      include: { horario: true, cliente: true },
    })
    if (!ag || ag.manicureId !== user.id) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }
    if (ag.status !== STATUS_AGENDAMENTO.pendente) {
      return NextResponse.json({ error: 'Agendamento não está pendente' }, { status: 400 })
    }
    const atualizado = await db.agendamento.update({
      where: { id },
      data: { status: STATUS_AGENDAMENTO.recusado, motivoRecusa: motivo || null },
    })
    // libera o horário
    await db.horarioDisponivel.update({
      where: { id: ag.horarioId },
      data: { status: STATUS_HORARIO.livre },
    })
    // notifica cliente
    await criarNotificacao({
      usuarioId: ag.clienteId,
      agendamentoId: ag.id,
      tipo: 'agendamento_recusado',
      mensagem: msgRecusado(ag.cliente.nome, motivo),
    })
    return NextResponse.json({ agendamento: atualizado })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
