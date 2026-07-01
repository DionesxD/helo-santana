import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// GET /api/clientes — lista clientes da manicure (com filtros)
//   ?busca=xxx  ?confianca=true
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const busca = searchParams.get('busca')
  const confianca = searchParams.get('confianca') === 'true'

  const where: Prisma.UsuarioWhereInput = {
    tipo: 'cliente',
    ativo: true,
  }
  if (confianca) where.eClienteConfianca = true
  if (busca) {
    where.OR = [
      { nome: { contains: busca } },
      { telefone: { contains: busca } },
      { email: { contains: busca } },
    ]
  }

  const clientes = await db.usuario.findMany({
    where,
    orderBy: { nome: 'asc' },
    select: {
      id: true,
      nome: true,
      telefone: true,
      email: true,
      eClienteConfianca: true,
      criadoEm: true,
    },
  })

  // inclui contagem de atendimentos por cliente
  const comContagem = await Promise.all(
    clientes.map(async (c) => {
      const total = await db.historicoAtendimento.count({ where: { clienteId: c.id, manicureId: user.id } })
      return { ...c, totalAtendimentos: total }
    })
  )

  return NextResponse.json({ clientes: comContagem })
}
