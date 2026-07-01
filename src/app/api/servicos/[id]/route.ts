import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PATCH /api/servicos/[id] — editar serviço (manicure)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  const data = await req.json()
  try {
    const existente = await db.servico.findUnique({ where: { id } })
    if (!existente || existente.manicureId !== user.id) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }
    const servico = await db.servico.update({
      where: { id },
      data: {
        nome: data.nome ?? existente.nome,
        descricao: data.descricao ?? existente.descricao,
        preco: data.preco != null ? Number(data.preco) : existente.preco,
        duracaoMinutos: data.duracaoMinutos != null ? Number(data.duracaoMinutos) : existente.duracaoMinutos,
        ativo: data.ativo ?? existente.ativo,
      },
    })
    return NextResponse.json({ servico })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE /api/servicos/[id] — desativar serviço
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  try {
    const existente = await db.servico.findUnique({ where: { id } })
    if (!existente || existente.manicureId !== user.id) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }
    await db.servico.update({ where: { id }, data: { ativo: false } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
