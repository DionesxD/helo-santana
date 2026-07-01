import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { FORMA_PAGAMENTO } from '@/lib/constants'

// GET /api/caixa/relatorio?de=YYYY-MM-DD&ate=YYYY-MM-DD
//   Retorna transações + totais por dia e por forma de pagamento
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const hoje = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const dateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  const de = searchParams.get('de') || dateStr(new Date(hoje.getTime() - 30 * 86400000))
  const ate = searchParams.get('ate') || dateStr(hoje)

  const transacoes = await db.transacaoCaixa.findMany({
    where: { manicureId: user.id, data: { gte: de, lte: ate } },
    orderBy: { data: 'desc' },
    include: {
      agendamento: { include: { cliente: { select: { nome: true } }, servico: { select: { nome: true } } } },
    },
  })

  const total = transacoes.reduce((acc, t) => acc + t.valor, 0)

  // totais por dia
  const porDiaMap = new Map<string, number>()
  const porFormaMap = new Map<string, number>()
  for (const t of transacoes) {
    porDiaMap.set(t.data, (porDiaMap.get(t.data) || 0) + t.valor)
    porFormaMap.set(t.formaPagamento, (porFormaMap.get(t.formaPagamento) || 0) + t.valor)
  }
  const porDia = Array.from(porDiaMap.entries())
    .map(([data, valor]) => ({ data, valor }))
    .sort((a, b) => a.data.localeCompare(b.data))
  const porForma = Object.values(FORMA_PAGAMENTO).map((forma) => ({
    forma,
    valor: porFormaMap.get(forma) || 0,
  }))

  return NextResponse.json({
    transacoes,
    resumo: { total, quantidade: transacoes.length, periodo: { de, ate } },
    porDia,
    porForma,
  })
}

// POST /api/caixa/relatorio — registrar transação avulsa
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  try {
    const { valor, formaPagamento, data, observacao, agendamentoId } = await req.json()
    if (!valor || !formaPagamento || !data) {
      return NextResponse.json({ error: 'Valor, forma de pagamento e data são obrigatórios' }, { status: 400 })
    }
    const transacao = await db.transacaoCaixa.create({
      data: {
        manicureId: user.id,
        agendamentoId: agendamentoId || null,
        valor: Number(valor),
        formaPagamento,
        data,
        observacao: observacao || null,
      },
    })
    return NextResponse.json({ transacao })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
