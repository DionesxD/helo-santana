import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/notificacoes — lista notificações do usuário (não lidas + últimas lidas)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const apenasNaoLidas = searchParams.get('naoLidas') === 'true'

  const where: { usuarioId: string; lida?: boolean } = { usuarioId: user.id }
  if (apenasNaoLidas) where.lida = false

  const notificacoes = await db.notificacao.findMany({
    where,
    orderBy: { enviadaEm: 'desc' },
    take: 50,
  })
  const naoLidas = await db.notificacao.count({ where: { usuarioId: user.id, lida: false } })
  return NextResponse.json({ notificacoes, naoLidas })
}

// POST /api/notificacoes — marcar como lidas
//   body: { ids?: string[] } | { todas: true }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { ids, todas } = await req.json()
  if (todas) {
    await db.notificacao.updateMany({ where: { usuarioId: user.id, lida: false }, data: { lida: true } })
  } else if (Array.isArray(ids) && ids.length) {
    await db.notificacao.updateMany({ where: { id: { in: ids }, usuarioId: user.id }, data: { lida: true } })
  }
  return NextResponse.json({ ok: true })
}
