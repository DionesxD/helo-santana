import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_AGENDAMENTO } from '@/lib/constants'

// POST /api/agendamentos/[id]/concluir — manicure marca como concluído
//   body: { valorPago?, formaPagamento?, corUsada?, observacoes? }
//   Cria histórico de atendimento e transação de caixa (se valorPago informado)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  try {
    const { valorPago, formaPagamento, corUsada, observacoes } = await req.json()
    const ag = await db.agendamento.findUnique({
      where: { id },
      include: { horario: true, servico: true, corEsmalte: true, cliente: true },
    })
    if (!ag || ag.manicureId !== user.id) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }
    if (ag.status !== STATUS_AGENDAMENTO.confirmado) {
      return NextResponse.json({ error: 'Agendamento precisa estar confirmado' }, { status: 400 })
    }

    const atualizado = await db.agendamento.update({
      where: { id },
      data: { status: STATUS_AGENDAMENTO.concluido },
    })

    // histórico permanente
    const nomeCor = corUsada || ag.corEsmalte?.nome || null
    await db.historicoAtendimento.create({
      data: {
        clienteId: ag.clienteId,
        manicureId: ag.manicureId,
        agendamentoId: ag.id,
        dataAtendimento: ag.horario.data,
        servicoNome: ag.servico.nome,
        corUsada: nomeCor,
        valorPago: valorPago != null ? Number(valorPago) : ag.servico.preco,
        observacoes: observacoes || null,
      },
    })

    // caixa (se valor informado)
    if (valorPago != null && Number(valorPago) > 0) {
      await db.transacaoCaixa.create({
        data: {
          manicureId: ag.manicureId,
          agendamentoId: ag.id,
          valor: Number(valorPago),
          formaPagamento: formaPagamento || 'pix',
          data: ag.horario.data,
          observacao: `${ag.servico.nome} — ${ag.cliente.nome}`,
        },
      })
    }

    return NextResponse.json({ agendamento: atualizado })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
