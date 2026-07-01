import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PATCH /api/clientes/[id]/confianca — marca/desmarca cliente como confiança
//   body: { eClienteConfianca: boolean }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  const { eClienteConfianca } = await req.json()
  try {
    const cliente = await db.usuario.findUnique({ where: { id } })
    if (!cliente || cliente.tipo !== 'cliente') {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }
    const atualizado = await db.usuario.update({
      where: { id },
      data: { eClienteConfianca: !!eClienteConfianca },
      select: { id: true, nome: true, eClienteConfianca: true },
    })
    return NextResponse.json({ cliente: atualizado })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
