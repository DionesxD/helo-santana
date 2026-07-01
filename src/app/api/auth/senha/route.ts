import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { verifyPassword, hashPassword } from '@/lib/password'

// PATCH /api/auth/senha — usuário troca a própria senha
// body: { senhaAtual, novaSenha }
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { senhaAtual, novaSenha } = await req.json()
    if (!senhaAtual || !novaSenha) {
      return NextResponse.json({ error: 'Informe a senha atual e a nova senha' }, { status: 400 })
    }
    if (novaSenha.length < 4) {
      return NextResponse.json({ error: 'A nova senha deve ter ao menos 4 caracteres' }, { status: 400 })
    }

    const full = await db.usuario.findUnique({ where: { id: user.id } })
    if (!full || !verifyPassword(senhaAtual, full.senhaHash)) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    }

    await db.usuario.update({
      where: { id: user.id },
      data: { senhaHash: hashPassword(novaSenha) },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
