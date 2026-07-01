import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_HORARIO } from '@/lib/constants'

// PATCH /api/horarios/[id] — alterar status do horário (bloquear/liberar) (manicure)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  const { status } = await req.json()
  if (!Object.values(STATUS_HORARIO).includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }
  try {
    const existente = await db.horarioDisponivel.findUnique({ where: { id } })
    if (!existente || existente.manicureId !== user.id) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }
    // não pode alterar horário que já tem agendamento ativo
    if (status === STATUS_HORARIO.bloqueado) {
      const ag = await db.agendamento.findFirst({
        where: { horarioId: id, status: { in: ['pendente', 'confirmado'] } },
      })
      if (ag) return NextResponse.json({ error: 'Horário possui agendamento ativo.' }, { status: 400 })
    }
    const horario = await db.horarioDisponivel.update({ where: { id }, data: { status } })
    return NextResponse.json({ horario })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE /api/horarios/[id] — remover horário (manicure)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params
  try {
    const existente = await db.horarioDisponivel.findUnique({ where: { id } })
    if (!existente || existente.manicureId !== user.id) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }
    const ag = await db.agendamento.findFirst({
      where: { horarioId: id, status: { in: ['pendente', 'confirmado'] } },
    })
    if (ag) return NextResponse.json({ error: 'Horário possui agendamento ativo.' }, { status: 400 })
    await db.horarioDisponivel.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
