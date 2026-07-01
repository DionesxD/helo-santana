import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_AGENDAMENTO } from '@/lib/constants'
import { criarNotificacao, msgConfirmado } from '@/lib/notifications'

function formatData(dataStr: string, hora: string) {
  const [y, m, d] = dataStr.split('-').map(Number)
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const dt = new Date(y, m - 1, d)
  return `${dias[dt.getDay()]}, ${d} ${meses[m - 1]} às ${hora}`
}

// POST /api/agendamentos/[id]/aprovar — manicure aprova agendamento pendente
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  try {
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
      data: { status: STATUS_AGENDAMENTO.confirmado },
    })

    // notifica cliente
    await criarNotificacao({
      usuarioId: ag.clienteId,
      agendamentoId: ag.id,
      tipo: 'agendamento_confirmado',
      mensagem: msgConfirmado(ag.cliente.nome, formatData(ag.horario.data, ag.horario.horaInicio)),
    })

    return NextResponse.json({ agendamento: atualizado })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
