import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PATCH /api/auth/perfil — usuário edita o próprio perfil
// body: { nome?, telefone?, email?, fotoUrl? }
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { nome, telefone, email, fotoUrl } = await req.json()

    // validações de unicidade se vierem preenchidos
    if (email && email !== user.email) {
      const existe = await db.usuario.findFirst({ where: { email, NOT: { id: user.id } } })
      if (existe) return NextResponse.json({ error: 'E-mail já está em uso' }, { status: 409 })
    }
    if (telefone && telefone !== user.telefone) {
      const existe = await db.usuario.findFirst({ where: { telefone, NOT: { id: user.id } } })
      if (existe) return NextResponse.json({ error: 'Telefone já está em uso' }, { status: 409 })
    }

    const atualizado = await db.usuario.update({
      where: { id: user.id },
      data: {
        ...(nome != null && nome.trim() ? { nome: nome.trim() } : {}),
        ...(telefone != null ? { telefone: telefone || null } : {}),
        ...(email != null ? { email: email || null } : {}),
        ...(fotoUrl != null ? { fotoUrl: fotoUrl || null } : {}),
      },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        tipo: true,
        fotoUrl: true,
        eClienteConfianca: true,
      },
    })

    return NextResponse.json({ user: atualizado })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
