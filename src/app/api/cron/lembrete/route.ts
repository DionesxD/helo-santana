import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { criarNotificacao, msgLembrete } from '@/lib/notifications'
import { formatDataHora } from '@/lib/format'

// ============================================================
// GET /api/cron/lembrete
// Endpoint chamado pelo Vercel Cron (diariamente às 9h BRT).
// Encontra agendamentos confirmados para o dia seguinte e cria
// notificações de lembrete para as clientes.
//
// Segurança: protegido por CRON_SECRET (header Authorization).
// Em dev, pode ser chamado sem secret para teste.
// ============================================================

export async function GET(req: NextRequest) {
  // Verifica o secret do cron (produção)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Calcula a data de amanhã
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const dataAmanha = `${amanha.getFullYear()}-${pad(amanha.getMonth() + 1)}-${pad(amanha.getDate())}`

    // Busca agendamentos confirmados para amanhã
    const agendamentos = await db.agendamento.findMany({
      where: {
        status: 'confirmado',
        horario: { data: dataAmanha },
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        horario: { select: { data: true, horaInicio: true } },
        servico: { select: { nome: true } },
      },
    })

    console.log(`[cron/lembrete] ${agendamentos.length} agendamentos para amanhã (${dataAmanha})`)

    // Cria notificação para cada cliente
    let enviadas = 0
    for (const ag of agendamentos) {
      const dataHora = formatDataHora(ag.horario.data, ag.horario.horaInicio)
      await criarNotificacao({
        usuarioId: ag.cliente.id,
        agendamentoId: ag.id,
        tipo: 'lembrete_atendimento',
        mensagem: msgLembrete(ag.cliente.nome, dataHora),
      })
      enviadas++
    }

    return NextResponse.json({
      ok: true,
      data: dataAmanha,
      lembretes: enviadas,
    })
  } catch (e) {
    console.error('[cron/lembrete] erro:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
