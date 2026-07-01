import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/clientes/[id]/historico — histórico de atendimentos + perfil do cliente
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  const cliente = await db.usuario.findUnique({
    where: { id },
    select: { id: true, nome: true, telefone: true, email: true, eClienteConfianca: true, criadoEm: true },
  })
  if (!cliente || cliente.id === undefined) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  const [historico, notas] = await Promise.all([
    db.historicoAtendimento.findMany({
      where: { clienteId: id, manicureId: user.id },
      orderBy: { dataAtendimento: 'desc' },
    }),
    db.notaCliente.findMany({
      where: { clienteId: id, manicureId: user.id },
      orderBy: { criadoEm: 'desc' },
    }),
  ])

  const totalGasto = historico.reduce((acc, h) => acc + (h.valorPago || 0), 0)
  const ultimoAtendimento = historico[0]?.dataAtendimento || null

  return NextResponse.json({
    cliente,
    historico,
    notas,
    resumo: { totalAtendimentos: historico.length, totalGasto, ultimoAtendimento },
  })
}
