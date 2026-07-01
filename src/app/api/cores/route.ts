import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cores — lista todas as cores de esmalte ativas (público para clientes logados)
export async function GET() {
  const cores = await db.corEsmalte.findMany({
    where: { ativo: true },
    orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
  })
  return NextResponse.json({ cores })
}
