import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
import { TIPO_USUARIO } from '@/lib/constants'

// POST /api/auth/register
export async function POST(req: NextRequest) {
  try {
    const { nome, email, telefone, senha } = await req.json()
    if (!nome || !senha || (!email && !telefone)) {
      return NextResponse.json({ error: 'Preencha nome, senha e ao menos um contato (e-mail ou telefone).' }, { status: 400 })
    }
    if (senha.length < 4) {
      return NextResponse.json({ error: 'A senha deve ter ao menos 4 caracteres.' }, { status: 400 })
    }

    // verifica duplicidade
    const existente = await db.usuario.findFirst({
      where: {
        OR: [{ email: email || undefined }, { telefone: telefone || undefined }],
      },
    })
    if (existente) {
      return NextResponse.json({ error: 'Já existe uma conta com este e-mail ou telefone.' }, { status: 409 })
    }

    const user = await db.usuario.create({
      data: {
        nome,
        email: email || null,
        telefone: telefone || null,
        senhaHash: hashPassword(senha),
        tipo: TIPO_USUARIO.cliente,
      },
    })

    await createSession(user.id, TIPO_USUARIO.cliente)

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
    console.error('register error', e)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
