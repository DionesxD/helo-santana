import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_HORARIO } from '@/lib/constants'
import { Prisma } from '@prisma/client'

function pad(n: number) {
  return n.toString().padStart(2, '0')
}
function dateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// GET /api/horarios?de=YYYY-MM-DD&ate=YYYY-MM-DD — lista horários disponíveis
//   - cliente: vê apenas 'livre' da manicure
//   - manicure: vê todos os próprios horários
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  let de = searchParams.get('de')
  const ate = searchParams.get('ate')

  // default: próximos 14 dias a partir de hoje
  const hoje = new Date()
  if (!de) de = dateStr(hoje)
  const dataFim = ate || dateStr(new Date(hoje.getTime() + 14 * 86400000))

  let manicureId = user.id
  if (user.tipo === 'cliente') {
    const m = await db.usuario.findFirst({ where: { tipo: 'manicure', ativo: true } })
    manicureId = m?.id ?? ''
  }

  const where: { manicureId: string; data: { gte: string; lte: string }; status?: string } = {
    manicureId,
    data: { gte: de, lte: dataFim },
  }
  if (user.tipo === 'cliente') where.status = STATUS_HORARIO.livre

  const horarios = await db.horarioDisponivel.findMany({
    where,
    orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
  })
  return NextResponse.json({ horarios })
}

// POST /api/horarios — criar/bloquear horário (manicure)
//   body: { data, horaInicio, horaFim, status? }
//   ou { gerarSemana: true } para gerar grade padrão nos próximos 7 dias
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 })
  }
  if (user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Apenas a manicure pode gerar horários.' }, { status: 403 })
  }
  try {
    const body = await req.json()

    // geração automática de grade — próximos 30 dias a partir de hoje
    if (body.gerarSemana) {
      // Se body.regenerar=true, limpa horários livres futuros (sem agendamento)
      // antes de regenerar — útil para resetar a grade
      if (body.regenerar) {
        const hojeStr = dateStr(new Date())
        await db.horarioDisponivel.deleteMany({
          where: {
            manicureId: user.id,
            data: { gte: hojeStr },
            status: 'livre',
            agendamento: null, // só deleta os que não têm agendamento vinculado
          },
        })
      }

      const horarios: Prisma.HorarioDisponivelCreateManyInput[] = []
      const inicio = new Date()
      // percorre 30 dias para sempre ter horários novos disponíveis
      for (let i = 0; i < 30; i++) {
        const d = new Date(inicio)
        d.setDate(inicio.getDate() + i)
        if (d.getDay() === 0) continue // sem domingo
        for (let h = 9; h < 18; h++) {
          if (h === 12) continue
          horarios.push({
            manicureId: user.id,
            data: dateStr(d),
            horaInicio: `${pad(h)}:00`,
            horaFim: `${pad(h + 1)}:00`,
            status: STATUS_HORARIO.livre,
          })
        }
      }
      // busca horários já existentes para evitar duplicados
      const datasUnicas = [...new Set(horarios.map((x) => x.data))]
      const existentes = await db.horarioDisponivel.findMany({
        where: { manicureId: user.id, data: { in: datasUnicas } },
        select: { data: true, horaInicio: true },
      })
      const existentesSet = new Set(existentes.map((x) => `${x.data}|${x.horaInicio}`))
      const novos = horarios.filter((x) => !existentesSet.has(`${x.data}|${x.horaInicio}`))

      if (novos.length > 0) {
        await db.horarioDisponivel.createMany({ data: novos })
      }
      return NextResponse.json({ ok: true, gerados: novos.length })
    }

    const { data, horaInicio, horaFim, status } = body
    if (!data || !horaInicio || !horaFim) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }
    const horario = await db.horarioDisponivel.create({
      data: {
        manicureId: user.id,
        data,
        horaInicio,
        horaFim,
        status: status || STATUS_HORARIO.livre,
      },
    })
    return NextResponse.json({ horario })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
