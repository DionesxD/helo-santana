import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const db = new PrismaClient()

function pad(n: number) {
  return n.toString().padStart(2, '0')
}
function dateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function main() {
  console.log('Criando conta da nail designer (admin)...')
  const manicure = await db.usuario.upsert({
    where: { email: 'helo@naildesigner.app' },
    update: {},
    create: {
      nome: 'Helo Santana',
      telefone: '11988887777',
      email: 'helo@naildesigner.app',
      senhaHash: hashPassword('123456'),
      tipo: 'manicure',
    },
  })

  console.log('Criando serviços padrão...')
  await db.servico.createMany({
    data: [
      { manicureId: manicure.id, nome: 'Esmaltação em gel', descricao: 'Esmaltação duradoura em gel', preco: 50, duracaoMinutos: 60 },
      { manicureId: manicure.id, nome: 'Alongamento de unhas', descricao: 'Alongamento com fibra de vidro', preco: 150, duracaoMinutos: 120 },
      { manicureId: manicure.id, nome: 'Manicure simples', descricao: 'Manicure tradicional com esmalte comum', preco: 35, duracaoMinutos: 45 },
      { manicureId: manicure.id, nome: 'Nail art', descricao: 'Arte e decoração nas unhas', preco: 80, duracaoMinutos: 90 },
    ],
  })

  console.log('Criando cores de esmalte...')
  const cores = [
    { nome: 'Vermelho Paixão', hex: '#C81D25', categoria: 'vermelho' },
    { nome: 'Nude Bege', hex: '#D9A98C', categoria: 'nude' },
    { nome: 'Rosa Chá', hex: '#E8B4B8', categoria: 'rosa' },
    { nome: 'Bordô', hex: '#6E0D25', categoria: 'vermelho' },
    { nome: 'Preto Fosco', hex: '#1C1C1C', categoria: 'escuro' },
    { nome: 'Laranja Vibrante', hex: '#FF6B35', categoria: 'laranja' },
    { nome: 'Marsala', hex: '#8E3B46', categoria: 'vermelho' },
    { nome: 'Pérola', hex: '#F0E6DA', categoria: 'nude' },
    { nome: 'Azul Petróleo', hex: '#1B4D5A', categoria: 'azul' },
    { nome: 'Verde Esmeralda', hex: '#0F5132', categoria: 'verde' },
    { nome: 'Dourado Metálico', hex: '#C9A227', categoria: 'metalizado' },
    { nome: 'Lilás', hex: '#9B7EBD', categoria: 'roxo' },
    { nome: 'Coral', hex: '#FF7F50', categoria: 'laranja' },
    { nome: 'Branco Leitoso', hex: '#F4F4F0', categoria: 'claro' },
    { nome: 'Roxo Profundo', hex: '#4B0082', categoria: 'roxo' },
    { nome: 'Champagne', hex: '#E8D4A8', categoria: 'nude' },
  ]
  await db.corEsmalte.createMany({ data: cores })

  console.log('Criando grade de horários (próximos 10 dias)...')
  const hoje = new Date()
  const slotsData: { manicureId: string; data: string; horaInicio: string; horaFim: string; status: string }[] = []
  for (let i = 0; i < 10; i++) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)
    if (d.getDay() === 0) continue
    for (let h = 9; h < 18; h++) {
      if (h === 12) continue
      slotsData.push({
        manicureId: manicure.id,
        data: dateStr(d),
        horaInicio: `${pad(h)}:00`,
        horaFim: `${pad(h + 1)}:00`,
        status: 'livre',
      })
    }
  }
  await db.horarioDisponivel.createMany({ data: slotsData })

  console.log('')
  console.log('✅ Setup de produção concluído!')
  console.log('---')
  console.log('Nail Designer (admin): helo@naildesigner.app / 11988887777 / senha: 123456')
  console.log('⚠️  TROQUE A SENHA APÓS O PRIMEIRO LOGIN!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
