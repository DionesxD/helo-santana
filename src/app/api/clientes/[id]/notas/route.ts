import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/clientes/[id]/notas — lista observações da manicure sobre o cliente
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  const notas = await db.notaCliente.findMany({
    where: { clienteId: id, manicureId: user.id },
    orderBy: { criadoEm: 'desc' },
  })
  return NextResponse.json({ notas })
}

// POST /api/clientes/[id]/notas — adicionar observação
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  const { observacao } = await req.json()
  if (!observacao || !observacao.trim()) {
    return NextResponse.json({ error: 'Observação não pode ser vazia' }, { status: 400 })
  }
  const nota = await db.notaCliente.create({
    data: { clienteId: id, manicureId: user.id, observacao: observacao.trim() },
  })
  return NextResponse.json({ nota })
}
