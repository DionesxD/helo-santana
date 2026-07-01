import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { verifyPassword } from '@/lib/password'

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const { identifier, senha } = await req.json()
    if (!identifier || !senha) {
      return NextResponse.json({ error: 'Informe e-mail/telefone e senha.' }, { status: 400 })
    }

    const user = await db.usuario.findFirst({
      where: {
        OR: [{ email: identifier }, { telefone: identifier }],
        ativo: true,
      },
    })

    if (!user || !verifyPassword(senha, user.senhaHash)) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }

    await createSession(user.id, user.tipo as 'cliente' | 'manicure')

    return NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        tipo: user.tipo,
        eClienteConfianca: user.eClienteConfianca,
      },
    })
  } catch (e) {
    console.error('login error', e)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
