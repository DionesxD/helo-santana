import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/galeria — lista modelos da galeria
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // assume 1 manicure; cliente vê galeria dela
  let manicureId = user.id
  if (user.tipo === 'cliente') {
    const m = await db.usuario.findFirst({ where: { tipo: 'manicure', ativo: true } })
    manicureId = m?.id ?? ''
  }

  const modelos = await db.galeriaModelo.findMany({
    where: { manicureId, ativo: true },
    orderBy: { criadoEm: 'desc' },
  })
  return NextResponse.json({
    modelos: modelos.map((m) => ({
      ...m,
      tags: m.tags ? JSON.parse(m.tags) : [],
    })),
  })
}

// POST /api/galeria — adicionar modelo (manicure)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  try {
    const { urlImagem, descricao, tags } = await req.json()
    if (!urlImagem) return NextResponse.json({ error: 'URL da imagem é obrigatória' }, { status: 400 })
    const modelo = await db.galeriaModelo.create({
      data: {
        manicureId: user.id,
        urlImagem,
        descricao: descricao || null,
        tags: tags ? JSON.stringify(tags) : null,
      },
    })
    return NextResponse.json({ modelo: { ...modelo, tags: modelo.tags ? JSON.parse(modelo.tags) : [] } })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
