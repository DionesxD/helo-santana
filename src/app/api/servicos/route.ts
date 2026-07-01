import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/servicos — lista serviços ativos da manicure
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // cliente vê serviços; manicure vê os próprios
  const where = user.tipo === 'manicure'
    ? { manicureId: user.id }
    : { ativo: true }

  // se cliente, precisa achar a manicure — assume 1 manicure no sistema
  let manicureId: string | undefined
  if (user.tipo === 'cliente') {
    const m = await db.usuario.findFirst({ where: { tipo: 'manicure', ativo: true } })
    manicureId = m?.id
  }

  const servicos = await db.servico.findMany({
    where: manicureId ? { manicureId, ativo: true } : where,
    orderBy: { preco: 'asc' },
  })
  return NextResponse.json({ servicos })
}

// POST /api/servicos — criar serviço (manicure)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  try {
    const { nome, descricao, preco, duracaoMinutos } = await req.json()
    if (!nome || preco == null || !duracaoMinutos) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }
    const servico = await db.servico.create({
      data: {
        manicureId: user.id,
        nome,
        descricao: descricao || null,
        preco: Number(preco),
        duracaoMinutos: Number(duracaoMinutos),
      },
    })
    return NextResponse.json({ servico })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
