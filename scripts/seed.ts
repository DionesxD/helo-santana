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
  console.log('Limpando banco...')
  await db.notificacao.deleteMany()
  await db.transacaoCaixa.deleteMany()
  await db.historicoAtendimento.deleteMany()
  await db.agendamento.deleteMany()
  await db.horarioDisponivel.deleteMany()
  await db.corEsmalte.deleteMany()
  await db.galeriaModelo.deleteMany()
  await db.servico.deleteMany()
  await db.notaCliente.deleteMany()
  await db.usuario.deleteMany()

  console.log('Criando nail designer (admin)...')
  const manicure = await db.usuario.create({
    data: {
      nome: 'Helo Santana',
      telefone: '11988887777',
      email: 'helo@naildesigner.app',
      senhaHash: hashPassword('123456'),
      tipo: 'manicure',
    },
  })

  console.log('Criando clientes...')
  const ana = await db.usuario.create({
    data: {
      nome: 'Ana Souza',
      telefone: '11912345678',
      email: 'ana@exemplo.com',
      senhaHash: hashPassword('123456'),
      tipo: 'cliente',
      eClienteConfianca: true,
    },
  })
  const carla = await db.usuario.create({
    data: {
      nome: 'Carla Mendes',
      telefone: '11922223333',
      email: 'carla@exemplo.com',
      senhaHash: hashPassword('123456'),
      tipo: 'cliente',
      eClienteConfianca: true,
    },
  })
  const dani = await db.usuario.create({
    data: {
      nome: 'Daniela Rocha',
      telefone: '11933334444',
      email: 'dani@exemplo.com',
      senhaHash: hashPassword('123456'),
      tipo: 'cliente',
      eClienteConfianca: false,
    },
  })
  const elisa = await db.usuario.create({
    data: {
      nome: 'Elisa Castro',
      telefone: '11944445555',
      email: 'elisa@exemplo.com',
      senhaHash: hashPassword('123456'),
      tipo: 'cliente',
      eClienteConfianca: false,
    },
  })

  console.log('Criando serviços...')
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
    // vermelhos
    { nome: 'Vermelho Paixão', hex: '#C81D25', categoria: 'vermelho' },
    { nome: 'Bordô', hex: '#6E0D25', categoria: 'vermelho' },
    { nome: 'Marsala', hex: '#8E3B46', categoria: 'vermelho' },
    { nome: 'Vermelho Clássico', hex: '#D32F2F', categoria: 'vermelho' },
    { nome: 'Carmim', hex: '#960018', categoria: 'vermelho' },
    { nome: 'Tomate', hex: '#E63946', categoria: 'vermelho' },
    { nome: 'Cereja', hex: '#A0153E', categoria: 'vermelho' },
    { nome: 'Vinho', hex: '#5C1A2B', categoria: 'vermelho' },
    // rosa
    { nome: 'Rosa Chá', hex: '#E8B4B8', categoria: 'rosa' },
    { nome: 'Rosa Choque', hex: '#FF1493', categoria: 'rosa' },
    { nome: 'Rosa Bebê', hex: '#F4C2C2', categoria: 'rosa' },
    { nome: 'Rosa Neon', hex: '#FF6EC7', categoria: 'rosa' },
    { nome: 'Magenta', hex: '#C71585', categoria: 'rosa' },
    { nome: 'Rosa Velho', hex: '#D98CA8', categoria: 'rosa' },
    { nome: 'Flamingo', hex: '#F8839C', categoria: 'rosa' },
    { nome: 'Pink Bubblegum', hex: '#FF85A2', categoria: 'rosa' },
    // nude
    { nome: 'Nude Bege', hex: '#D9A98C', categoria: 'nude' },
    { nome: 'Pérola', hex: '#F0E6DA', categoria: 'nude' },
    { nome: 'Champagne', hex: '#E8D4A8', categoria: 'nude' },
    { nome: 'Caramelo', hex: '#C68E5C', categoria: 'nude' },
    { nome: 'Avelã', hex: '#D2B48C', categoria: 'nude' },
    { nome: 'Arenito', hex: '#E1C699', categoria: 'nude' },
    { nome: 'Biscoito', hex: '#D4A574', categoria: 'nude' },
    { nome: 'Café com Leite', hex: '#B5896A', categoria: 'nude' },
    { nome: 'Areia', hex: '#EAD9B8', categoria: 'nude' },
    // roxo
    { nome: 'Lilás', hex: '#9B7EBD', categoria: 'roxo' },
    { nome: 'Roxo Profundo', hex: '#4B0082', categoria: 'roxo' },
    { nome: 'Amora', hex: '#5D3954', categoria: 'roxo' },
    { nome: 'Violeta', hex: '#7F00FF', categoria: 'roxo' },
    { nome: 'Lavanda', hex: '#B097D9', categoria: 'roxo' },
    { nome: 'Ameixa', hex: '#673147', categoria: 'roxo' },
    // azul
    { nome: 'Azul Petróleo', hex: '#1B4D5A', categoria: 'azul' },
    { nome: 'Azul Cobalto', hex: '#0047AB', categoria: 'azul' },
    { nome: 'Azul Tiffany', hex: '#0ABAB5', categoria: 'azul' },
    { nome: 'Azul Marinho', hex: '#1B2A49', categoria: 'azul' },
    { nome: 'Turquesa', hex: '#40E0D0', categoria: 'azul' },
    { nome: 'Azul Bebê', hex: '#AEC6CF', categoria: 'azul' },
    { nome: 'Azul Jeans', hex: '#4A6587', categoria: 'azul' },
    // verde
    { nome: 'Verde Esmeralda', hex: '#0F5132', categoria: 'verde' },
    { nome: 'Verde Menta', hex: '#98FF98', categoria: 'verde' },
    { nome: 'Verde Militar', hex: '#4B5320', categoria: 'verde' },
    { nome: 'Verde Floresta', hex: '#228B22', categoria: 'verde' },
    { nome: 'Pinho', hex: '#0B3D1F', categoria: 'verde' },
    { nome: 'Verde Sagu', hex: '#88B04B', categoria: 'verde' },
    // laranja / amarelo
    { nome: 'Laranja Vibrante', hex: '#FF6B35', categoria: 'laranja' },
    { nome: 'Coral', hex: '#FF7F50', categoria: 'laranja' },
    { nome: 'Tangerina', hex: '#F28500', categoria: 'laranja' },
    { nome: 'Damasco', hex: '#FBCEB1', categoria: 'laranja' },
    { nome: 'Amarelo Mostarda', hex: '#D4A017', categoria: 'amarelo' },
    { nome: 'Ouro Velho', hex: '#C9A227', categoria: 'amarelo' },
    // marrom
    { nome: 'Chocolate', hex: '#3E2723', categoria: 'marrom' },
    { nome: 'Cacau', hex: '#5D4037', categoria: 'marrom' },
    { nome: 'Terracota', hex: '#C66B3D', categoria: 'marrom' },
    { nome: 'Canela', hex: '#A0522D', categoria: 'marrom' },
    { nome: 'Madeira', hex: '#8B4513', categoria: 'marrom' },
    // escuro / preto
    { nome: 'Preto Fosco', hex: '#1C1C1C', categoria: 'escuro' },
    { nome: 'Preto Brilhante', hex: '#0A0A0A', categoria: 'escuro' },
    { nome: 'Grafite', hex: '#383838', categoria: 'escuro' },
    { nome: 'Ébano', hex: '#2D1B14', categoria: 'escuro' },
    { nome: 'Denim Escuro', hex: '#1A1A2E', categoria: 'escuro' },
    // claro / branco
    { nome: 'Branco Leitoso', hex: '#F4F4F0', categoria: 'claro' },
    { nome: 'Branco Nevado', hex: '#FAFAFA', categoria: 'claro' },
    { nome: 'Creme', hex: '#FFFDD0', categoria: 'claro' },
    { nome: 'Marfim', hex: '#FFFFF0', categoria: 'claro' },
    // metalizado
    { nome: 'Dourado Metálico', hex: '#C9A227', categoria: 'metalizado' },
    { nome: 'Prata', hex: '#B0B0B0', categoria: 'metalizado' },
    { nome: 'Rosé', hex: '#B76E79', categoria: 'metalizado' },
    { nome: 'Bronze', hex: '#CD7F32', categoria: 'metalizado' },
    { nome: 'Cobre', hex: '#B87333', categoria: 'metalizado' },
  ]
  await db.corEsmalte.createMany({ data: cores })

  console.log('Criando grade de horários (próximos 10 dias)...')
  const hoje = new Date()
  const slotsData: { manicureId: string; data: string; horaInicio: string; horaFim: string; status: string }[] = []
  for (let i = 0; i < 10; i++) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)
    const diaSemana = d.getDay()
    if (diaSemana === 0) continue
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

  console.log('Criando galeria de modelos...')
  await db.galeriaModelo.createMany({
    data: [
      { manicureId: manicure.id, urlImagem: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600', descricao: 'Francesinha moderna', tags: JSON.stringify(['francesinha', 'nude', 'classico']) },
      { manicureId: manicure.id, urlImagem: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600', descricao: 'Degradê vermelho', tags: JSON.stringify(['degrade', 'vermelho']) },
      { manicureId: manicure.id, urlImagem: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=600', descricao: 'Nail art floral', tags: JSON.stringify(['nail-art', 'floral', 'rosa']) },
      { manicureId: manicure.id, urlImagem: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600', descricao: 'Metalizado dourado', tags: JSON.stringify(['metalizado', 'dourado']) },
      { manicureId: manicure.id, urlImagem: 'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600', descricao: 'Preto fosco com detalhes', tags: JSON.stringify(['preto', 'fosco']) },
      { manicureId: manicure.id, urlImagem: 'https://images.unsplash.com/photo-1607602132700-068258431c6c?w=600', descricao: 'Pedrarias nude', tags: JSON.stringify(['nude', 'pedrarias']) },
    ],
  })

  // Agendamento pendente de exemplo (Dani solicitou)
  const srv = await db.servico.findFirst({ where: { manicureId: manicure.id, nome: 'Esmaltação em gel' } })
  const slotExemplo = await db.horarioDisponivel.findFirst({
    where: { manicureId: manicure.id, status: 'livre' },
  })
  const corExemplo = await db.corEsmalte.findFirst({ where: { nome: 'Vermelho Paixão' } })
  if (srv && slotExemplo && corExemplo) {
    await db.agendamento.create({
      data: {
        clienteId: dani.id,
        manicureId: manicure.id,
        horarioId: slotExemplo.id,
        servicoId: srv.id,
        corEsmalteId: corExemplo.id,
        status: 'pendente',
        observacoesCliente: 'Gostaria de uns detalhes em dourado.',
      },
    })
    await db.horarioDisponivel.update({ where: { id: slotExemplo.id }, data: { status: 'reservado' } })
  }

  // Histórico de atendimento para Ana (cliente de confiança)
  const dataPassada = new Date()
  dataPassada.setDate(dataPassada.getDate() - 15)
  await db.historicoAtendimento.create({
    data: {
      clienteId: ana.id,
      manicureId: manicure.id,
      agendamentoId: null,
      dataAtendimento: dateStr(dataPassada),
      servicoNome: 'Esmaltação em gel',
      corUsada: 'Rosa Chá',
      valorPago: 50,
      observacoes: 'Cliente prefere tons rosados. Unhas um pouco finas, evitar lixar muito.',
    },
  })
  await db.notaCliente.create({
    data: {
      clienteId: ana.id,
      manicureId: manicure.id,
      observacao: 'Alérgica a esmalte com formaldeído. Sempre usar produtos free.',
    },
  })

  console.log('Seed concluído!')
  console.log('---')
  console.log('Nail Designer (admin): helo@naildesigner.app / 11988887777 / senha: 123456')
  console.log('Clientes:')
  console.log('  ana@exemplo.com / 11912345678 (confiança)')
  console.log('  carla@exemplo.com / 11922223333 (confiança)')
  console.log('  dani@exemplo.com / 11933334444')
  console.log('  elisa@exemplo.com / 11944445555')
  console.log('  senha: 123456')
  console.log('Total de cores de esmalte: 60+')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
