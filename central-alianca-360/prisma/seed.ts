import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Users
  const adminHash = await hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aliancamoveis.com.br' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@aliancamoveis.com.br',
      passwordHash: adminHash,
      role: 'admin',
    },
  })

  const gestorHash = await hash('gestor123', 10)
  await prisma.user.upsert({
    where: { email: 'gestor@aliancamoveis.com.br' },
    update: {},
    create: {
      name: 'Gestor Comercial',
      email: 'gestor@aliancamoveis.com.br',
      passwordHash: gestorHash,
      role: 'gestor',
    },
  })

  // Consultores
  const consultores = await Promise.all([
    prisma.consultor.upsert({
      where: { id: 'consultor-1' },
      update: {},
      create: { id: 'consultor-1', nome: 'Carlos Ferreira', nomeNormalizado: 'CARLOS FERREIRA', telefone: '11999990001', email: 'carlos@alianca.com' },
    }),
    prisma.consultor.upsert({
      where: { id: 'consultor-2' },
      update: {},
      create: { id: 'consultor-2', nome: 'Mariana Souza', nomeNormalizado: 'MARIANA SOUZA', telefone: '11999990002', email: 'mariana@alianca.com' },
    }),
    prisma.consultor.upsert({
      where: { id: 'consultor-3' },
      update: {},
      create: { id: 'consultor-3', nome: 'Ricardo Lima', nomeNormalizado: 'RICARDO LIMA', telefone: '11999990003', email: 'ricardo@alianca.com' },
    }),
  ])

  // Clientes
  const clientes = await Promise.all([
    prisma.cliente.create({ data: { nome: 'Ana Paula Martins', nomeNormalizado: 'ANA PAULA MARTINS', telefone: '11988880001', cidade: 'São Paulo', estado: 'SP' } }),
    prisma.cliente.create({ data: { nome: 'João Roberto Silva', nomeNormalizado: 'JOAO ROBERTO SILVA', telefone: '11988880002', cidade: 'São Paulo', estado: 'SP' } }),
    prisma.cliente.create({ data: { nome: 'Fernanda Costa', nomeNormalizado: 'FERNANDA COSTA', telefone: '11988880003', cidade: 'Guarulhos', estado: 'SP' } }),
    prisma.cliente.create({ data: { nome: 'Pedro Almeida', nomeNormalizado: 'PEDRO ALMEIDA', telefone: '11988880004', cidade: 'São Paulo', estado: 'SP' } }),
    prisma.cliente.create({ data: { nome: 'Lucia Pereira', nomeNormalizado: 'LUCIA PEREIRA', telefone: '11988880005', cidade: 'São Paulo', estado: 'SP' } }),
  ])

  const hoje = new Date()
  const diasAtras = (n: number) => new Date(hoje.getTime() - n * 86400000)

  // Visitas
  const visitas = await Promise.all([
    prisma.visita.create({ data: { clienteId: clientes[0].id, consultorId: consultores[0].id, nomeClienteOriginal: clientes[0].nome, tipoVisita: 'consultor_externo', dataVisita: diasAtras(10), status: 'realizada', contaParaConversao: true, contaParaPagamento: true, origem: 'seed' } }),
    prisma.visita.create({ data: { clienteId: clientes[1].id, consultorId: consultores[0].id, nomeClienteOriginal: clientes[1].nome, tipoVisita: 'consultor_externo', dataVisita: diasAtras(8), status: 'realizada', contaParaConversao: true, contaParaPagamento: true, origem: 'seed' } }),
    prisma.visita.create({ data: { clienteId: clientes[2].id, consultorId: consultores[1].id, nomeClienteOriginal: clientes[2].nome, tipoVisita: 'checklist', dataVisita: diasAtras(5), status: 'realizada', contaParaConversao: false, contaParaPagamento: true, origem: 'seed' } }),
    prisma.visita.create({ data: { clienteId: clientes[3].id, consultorId: consultores[1].id, nomeClienteOriginal: clientes[3].nome, tipoVisita: 'consultor_externo', dataVisita: diasAtras(3), status: 'realizada', contaParaConversao: true, contaParaPagamento: true, origem: 'seed' } }),
    prisma.visita.create({ data: { clienteId: clientes[4].id, consultorId: consultores[2].id, nomeClienteOriginal: clientes[4].nome, tipoVisita: 'consultor_externo', dataVisita: diasAtras(1), status: 'realizada', contaParaConversao: true, contaParaPagamento: true, origem: 'seed' } }),
  ])

  // Vendas
  const vendas = await Promise.all([
    prisma.venda.create({ data: { clienteId: clientes[0].id, consultorId: consultores[0].id, numeroVenda: 'V-001', nomeClienteOriginal: clientes[0].nome, vendedor: 'Lucas Vendas', dataVenda: diasAtras(7), valorVendido: 15000, valorRevertido: 0, status: 'aprovada', cancelada: false, origem: 'seed' } }),
    prisma.venda.create({ data: { clienteId: clientes[1].id, consultorId: consultores[0].id, numeroVenda: 'V-002', nomeClienteOriginal: clientes[1].nome, vendedor: 'Lucas Vendas', dataVenda: diasAtras(6), valorVendido: 8500, valorRevertido: 500, status: 'aprovada', cancelada: false, origem: 'seed' } }),
    prisma.venda.create({ data: { clienteId: clientes[3].id, consultorId: consultores[1].id, numeroVenda: 'V-003', nomeClienteOriginal: clientes[3].nome, vendedor: 'Priscila Vendas', dataVenda: diasAtras(2), valorVendido: 22000, valorRevertido: 0, status: 'aprovada', cancelada: false, origem: 'seed' } }),
    prisma.venda.create({ data: { nomeClienteOriginal: 'Cliente Sem Consultor', numeroVenda: 'V-004', vendedor: 'Priscila Vendas', dataVenda: diasAtras(4), valorVendido: 5000, valorRevertido: 0, status: 'aprovada', cancelada: false, origem: 'seed' } }),
    prisma.venda.create({ data: { clienteId: clientes[4].id, consultorId: consultores[2].id, numeroVenda: 'V-005', nomeClienteOriginal: clientes[4].nome, vendedor: 'Lucas Vendas', dataVenda: diasAtras(1), valorVendido: 3200, valorRevertido: 0, status: 'cancelada', cancelada: true, origem: 'seed' } }),
  ])

  // Montagens
  await Promise.all([
    prisma.montagem.create({ data: { clienteId: clientes[0].id, vendaId: vendas[0].id, numeroVenda: 'V-001', nomeClienteOriginal: clientes[0].nome, endereco: 'Rua das Flores, 123', montador: 'Equipe A', dataAgendada: diasAtras(-5), status: 'agendada', atrasada: false, origem: 'seed' } }),
    prisma.montagem.create({ data: { clienteId: clientes[1].id, vendaId: vendas[1].id, numeroVenda: 'V-002', nomeClienteOriginal: clientes[1].nome, endereco: 'Av. Paulista, 1000', montador: 'Equipe B', dataAgendada: diasAtras(3), dataRealizada: diasAtras(3), status: 'concluida', atrasada: false, origem: 'seed' } }),
    prisma.montagem.create({ data: { clienteId: clientes[3].id, vendaId: vendas[2].id, numeroVenda: 'V-003', nomeClienteOriginal: clientes[3].nome, endereco: 'Rua dos Ipês, 45', montador: 'Equipe A', dataAgendada: diasAtras(1), status: 'atrasada', atrasada: true, reagendada: true, problema: 'Peça faltando', origem: 'seed' } }),
  ])

  // Checklists
  await Promise.all([
    prisma.checklist.create({ data: { clienteId: clientes[2].id, consultorId: consultores[1].id, nomeClienteOriginal: clientes[2].nome, tipo: 'pos-venda', dataChecklist: diasAtras(5), status: 'pendente', pendente: true, origem: 'seed' } }),
    prisma.checklist.create({ data: { clienteId: clientes[0].id, consultorId: consultores[0].id, nomeClienteOriginal: clientes[0].nome, tipo: 'entrega', dataChecklist: diasAtras(3), status: 'concluido', pendente: false, origem: 'seed' } }),
  ])

  // Divergências
  await Promise.all([
    prisma.divergencia.create({ data: { tipo: 'venda_sem_consultor', entidadeOrigem: 'venda', origemId: vendas[3].id, descricao: 'Venda V-004 sem consultor vinculado', percentualSimilaridade: 0, dadosOrigemJson: { nomeCliente: 'Cliente Sem Consultor', numeroVenda: 'V-004', valor: 5000 } } }),
    prisma.divergencia.create({ data: { tipo: 'cliente_semelhante', entidadeOrigem: 'visita', entidadeDestino: 'venda', descricao: 'Clientes com nomes similares encontrados', percentualSimilaridade: 72, dadosOrigemJson: { nome: 'Ana Paula Martins', telefone: '11988880001' }, dadosDestinoJson: { nome: 'Ana P. Martins', numeroVenda: 'V-006' } } }),
  ])

  // SyncStatus inicial
  await Promise.all([
    prisma.syncStatus.upsert({
      where: { sistema_tipo: { sistema: 'exact', tipo: 'completo' } },
      update: {},
      create: { sistema: 'exact', tipo: 'completo', ultimoStatus: 'nunca_executado', ultimaExecucao: null },
    }),
    prisma.syncStatus.upsert({
      where: { sistema_tipo: { sistema: 'minha-visita', tipo: 'completo' } },
      update: {},
      create: { sistema: 'minha-visita', tipo: 'completo', ultimoStatus: 'nunca_executado', ultimaExecucao: null },
    }),
  ])

  console.log('✅ Seed concluído!')
  console.log('   Usuários: admin@aliancamoveis.com.br (senha: admin123)')
  console.log('             gestor@aliancamoveis.com.br (senha: gestor123)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
