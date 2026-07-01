import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_AGENDAMENTO, STATUS_HORARIO } from '@/lib/constants'
import { criarNotificacao, msgConfirmado, msgRecusado } from '@/lib/notifications'

// GET /api/agendamentos — lista agendamentos
//   - cliente: vê os próprios
//   - manicure: vê todos os seus, com filtros opcionais (status, data)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: {
    clienteId?: string
    manicureId?: string
    status?: string
  } = {}

  if (user.tipo === 'cliente') {
    where.clienteId = user.id
  } else {
    where.manicureId = user.id
  }
  if (status) where.status = status

  const agendamentos = await db.agendamento.findMany({
    where,
    orderBy: { criadoEm: 'desc' },
    include: {
      servico: { select: { id: true, nome: true, preco: true, duracaoMinutos: true } },
      corEsmalte: { select: { id: true, nome: true, hex: true } },
      horario: { select: { id: true, data: true, horaInicio: true, horaFim: true } },
      cliente: { select: { id: true, nome: true, telefone: true, email: true, eClienteConfianca: true } },
    },
  })
  return NextResponse.json({ agendamentos })
}

// POST /api/agendamentos — cliente solicita agendamento
//   body: { horarioId, servicoId, corEsmalteId?, observacoes? }
//   Lógica de cliente de confiança: cria já como 'confirmado' e notifica.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'cliente') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  try {
    const { horarioId, servicoId, corEsmalteId, observacoes } = await req.json()
    if (!horarioId || !servicoId) {
      return NextResponse.json({ error: 'Horário e serviço são obrigatórios' }, { status: 400 })
    }

    // valida horário livre
    const horario = await db.horarioDisponivel.findUnique({ where: { id: horarioId } })
    if (!horario || horario.status !== STATUS_HORARIO.livre) {
      return NextResponse.json({ error: 'Horário indisponível' }, { status: 400 })
    }

    // valida conflito (segurança extra)
    const conflito = await db.agendamento.findUnique({ where: { horarioId } })
    if (conflito) {
      return NextResponse.json({ error: 'Horário já possui agendamento' }, { status: 400 })
    }

    const servico = await db.servico.findUnique({ where: { id: servicoId } })
    if (!servico || !servico.ativo) {
      return NextResponse.json({ error: 'Serviço inválido' }, { status: 400 })
    }

    const eConfianca = user.eClienteConfianca
    const novoStatus = eConfianca ? STATUS_AGENDAMENTO.confirmado : STATUS_AGENDAMENTO.pendente

    const agendamento = await db.agendamento.create({
      data: {
        clienteId: user.id,
        manicureId: horario.manicureId,
        horarioId,
        servicoId,
        corEsmalteId: corEsmalteId || null,
        status: novoStatus,
        confirmadoAutomaticamente: eConfianca,
        observacoesCliente: observacoes || null,
      },
      include: {
        servico: true,
        corEsmalte: true,
        horario: true,
      },
    })

    // marca horário como reservado
    await db.horarioDisponivel.update({
      where: { id: horarioId },
      data: { status: STATUS_HORARIO.reservado },
    })

    const dataHora = `${formatData(horario.data)} às ${horario.horaInicio}`

    if (eConfianca) {
      // notifica cliente da confirmação imediata
      await criarNotificacao({
        usuarioId: user.id,
        agendamentoId: agendamento.id,
        tipo: 'agendamento_confirmado',
        mensagem: msgConfirmado(user.nome, dataHora),
      })
      // notifica a manicure também (informativo)
      await criarNotificacao({
        usuarioId: horario.manicureId,
        agendamentoId: agendamento.id,
        tipo: 'agendamento_confirmado',
        mensagem: `Novo agendamento confirmado automaticamente (cliente de confiança): ${user.nome} em ${dataHora}.`,
      })
    }

    return NextResponse.json({ agendamento })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function formatData(dataStr: string) {
  const [y, m, d] = dataStr.split('-').map(Number)
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const dt = new Date(y, m - 1, d)
  return `${dias[dt.getDay()]}, ${d} ${meses[m - 1]}`
}
