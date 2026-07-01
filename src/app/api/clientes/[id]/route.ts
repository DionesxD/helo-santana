import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// DELETE /api/clientes/[id] — manicure exclui (desativa) um cliente
// Não deleta fisicamente (para preservar histórico), apenas marca ativo=false
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  try {
    const cliente = await db.usuario.findUnique({ where: { id } })
    if (!cliente || cliente.tipo !== 'cliente') {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Desativa a conta (não deleta fisicamente — preserva histórico e referências)
    await db.usuario.update({
      where: { id },
      data: { ativo: false },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
