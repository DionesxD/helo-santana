import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PATCH /api/galeria/[id] — editar descrição e tags do modelo (manicure)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  try {
    const existente = await db.galeriaModelo.findUnique({ where: { id } })
    if (!existente || existente.manicureId !== user.id) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }
    const { descricao, tags } = await req.json()
    const atualizado = await db.galeriaModelo.update({
      where: { id },
      data: {
        ...(descricao != null ? { descricao } : {}),
        ...(tags != null ? { tags: JSON.stringify(tags) } : {}),
      },
    })
    return NextResponse.json({
      modelo: { ...atualizado, tags: atualizado.tags ? JSON.parse(atualizado.tags) : [] },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE /api/galeria/[id] — remover modelo (manicure)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  try {
    const existente = await db.galeriaModelo.findUnique({ where: { id } })
    if (!existente || existente.manicureId !== user.id) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }
    await db.galeriaModelo.update({ where: { id }, data: { ativo: false } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
