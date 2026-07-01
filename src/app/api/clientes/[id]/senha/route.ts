import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hashPassword } from '@/lib/password'

// PATCH /api/clientes/[id]/senha — manicure redefine a senha de uma cliente
// body: { novaSenha }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  try {
    const { novaSenha } = await req.json()
    if (!novaSenha || novaSenha.length < 4) {
      return NextResponse.json({ error: 'A senha deve ter ao menos 4 caracteres' }, { status: 400 })
    }

    const cliente = await db.usuario.findUnique({ where: { id } })
    if (!cliente || cliente.tipo !== 'cliente') {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    await db.usuario.update({
      where: { id },
      data: { senhaHash: hashPassword(novaSenha) },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
