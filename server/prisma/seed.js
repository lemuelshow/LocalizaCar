// Cria os usuarios iniciais e, com --demo, dados de exemplo para conhecer o sistema.
// Uso: node prisma/seed.js           -> so usuarios
//      node prisma/seed.js --demo    -> usuarios + exemplos (apaga os dados operacionais existentes)
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { isoDate, isoDateTime } from '@localizacar/shared';

const prisma = new PrismaClient();
const demo = process.argv.includes('--demo');

const D = (dias) => { const d = new Date(); d.setDate(d.getDate() + dias); return isoDate(d); };
const DT = (dias, hora) => { const d = new Date(); d.setDate(d.getDate() + dias); const [h, m] = hora.split(':'); d.setHours(+h, +m, 0, 0); return isoDateTime(d); };

async function usuarios() {
  const senha = await bcrypt.hash('localizacar', 10);
  const lista = [
    { nome: 'Administrador', email: 'admin@localizacar.com.br', perfil: 'ADMIN' },
    { nome: 'Gestor de frota', email: 'gestor@localizacar.com.br', perfil: 'GESTOR' },
    { nome: 'Portaria', email: 'portaria@localizacar.com.br', perfil: 'OPERADOR' },
  ];
  for (const u of lista) {
    await prisma.usuario.upsert({ where: { email: u.email }, update: {}, create: { ...u, senhaHash: senha } });
  }
  console.log('Usuários prontos (senha inicial: localizacar)');
}

async function exemplos() {
  for (const m of ['lancamento', 'frete', 'entrega', 'pedido', 'inspecaoPneu', 'servicoPneu', 'pneu', 'abastecimento', 'ordemServico', 'planoManutencao', 'movimento', 'cliente', 'fornecedor', 'motorista', 'veiculo']) {
    await prisma[m].deleteMany();
  }

  const m = {};
  for (const [k, d] of Object.entries({
    carlos: { nome: 'Carlos Henrique Souza', cpf: '321.654.987-00', rg: '32.165.498-7', telefone: '(11) 98765-4321', endereco: 'Rua das Acácias, 120', cidade: 'São Paulo', uf: 'SP', cnh: '04512378901', categoria: 'AB', validadeCnh: D(1300) },
    juliana: { nome: 'Juliana Martins Rocha', cpf: '456.789.123-11', telefone: '(11) 97654-3210', cidade: 'Osasco', uf: 'SP', cnh: '05623489012', categoria: 'D', validadeCnh: D(22) },
    rafael: { nome: 'Rafael Oliveira Lima', cpf: '789.123.456-22', telefone: '(11) 96543-2109', cidade: 'Barueri', uf: 'SP', cnh: '06734590123', categoria: 'AB', validadeCnh: D(870) },
    ana: { nome: 'Ana Paula Ferreira', cpf: '147.258.369-33', telefone: '(11) 95432-1098', cidade: 'São Paulo', uf: 'SP', cnh: '07845601234', categoria: 'E', validadeCnh: D(680) },
    marcos: { nome: 'Marcos Vinícius Alves', cpf: '258.369.147-44', telefone: '(11) 94321-0987', cidade: 'Guarulhos', uf: 'SP', cnh: '08956712345', categoria: 'E', validadeCnh: D(410), aptidao: 'Inapto', obs: 'Afastado por atestado médico até liberação.' },
  })) m[k] = await prisma.motorista.create({ data: d });

  const v = {};
  for (const [k, d] of Object.entries({
    strada: { placa: 'RTA2B45', marca: 'Fiat', modelo: 'Strada Freedom', ano: 2023, tipo: 'Utilitário', cor: 'Branco', combustivel: 'Flex', renavam: '01298745632', km: 48210, licenciamento: D(168), seguro: D(19) },
    gol: { placa: 'QOP7C12', marca: 'Volkswagen', modelo: 'Gol 1.0', ano: 2021, tipo: 'Carro', cor: 'Prata', combustivel: 'Flex', renavam: '01187456321', km: 87540, status: 'Em uso', motoristaAtualId: m.carlos.id, licenciamento: D(17), seguro: D(93) },
    sprinter: { placa: 'SFX3E88', marca: 'Mercedes-Benz', modelo: 'Sprinter 416', ano: 2022, tipo: 'Van', cor: 'Branco', combustivel: 'Diesel', renavam: '01345678912', km: 132900, status: 'Manutenção', licenciamento: D(229), seguro: D(178) },
    hilux: { placa: 'PKL9A01', marca: 'Toyota', modelo: 'Hilux SRV 2.8', ano: 2020, tipo: 'Utilitário', cor: 'Cinza', combustivel: 'Diesel', renavam: '01023456789', km: 154300, licenciamento: D(137), seguro: D(129) },
    kangoo: { placa: 'RJE4F67', marca: 'Renault', modelo: 'Kangoo Express', ano: 2024, tipo: 'Utilitário', cor: 'Branco', combustivel: 'Flex', renavam: '01398765412', km: 21450, status: 'Em uso', motoristaAtualId: m.rafael.id, licenciamento: D(259), seguro: D(142) },
    cg: { placa: 'GHT5D39', marca: 'Honda', modelo: 'CG 160 Cargo', ano: 2023, tipo: 'Moto', cor: 'Vermelho', combustivel: 'Flex', renavam: '01276543219', km: 30880, licenciamento: D(198), seguro: D(106), documentacao: 'Pendente', obs: 'CRLV digital não localizado.' },
    volvo: { placa: 'RKT8H21', marca: 'Volvo', modelo: 'VM 270 6x2', ano: 2021, tipo: 'Caminhão', cor: 'Branco', combustivel: 'Diesel', renavam: '01412365478', km: 210400, licenciamento: D(76), seguro: D(210) },
  })) v[k] = await prisma.veiculo.create({ data: d });

  const f = {};
  for (const [k, d] of Object.entries({
    oficina: { nome: 'Auto Center Paulista', tipo: 'Oficina mecânica', cnpj: '12.345.678/0001-90', contato: 'Marcos', telefone: '(11) 3456-7890', cidade: 'São Paulo/SP' },
    posto: { nome: 'Posto Rota 10', tipo: 'Posto de combustível', cnpj: '23.456.789/0001-01', contato: 'Gerência', telefone: '(11) 3567-8901', cidade: 'São Paulo/SP' },
    borracharia: { nome: 'Pneus & Cia', tipo: 'Borracharia', cnpj: '34.567.890/0001-12', contato: 'Sandra', telefone: '(11) 3678-9012', cidade: 'Osasco/SP' },
    pecas: { nome: 'AutoPeças Brasil', tipo: 'Autopeças', cnpj: '45.678.901/0001-23', contato: 'Vendas', telefone: '(11) 3789-0123', cidade: 'Barueri/SP' },
    diesel: { nome: 'Diesel Center Truck', tipo: 'Oficina mecânica', cnpj: '56.789.012/0001-34', contato: 'Eduardo', telefone: '(11) 3890-1234', cidade: 'Guarulhos/SP' },
  })) f[k] = await prisma.fornecedor.create({ data: d });

  const c = {};
  for (const [k, d] of Object.entries({
    mercado: { nome: 'Mercado Bom Preço Ltda', documento: '11.222.333/0001-44', contato: 'Fernanda', telefone: '(11) 4002-1001', endereco: 'Av. Brasil, 1500', cidade: 'Campinas', uf: 'SP' },
    construtora: { nome: 'Construtora Horizonte', documento: '22.333.444/0001-55', contato: 'Eng. Paulo', telefone: '(11) 4002-2002', endereco: 'Rua Itapura, 300', cidade: 'Jundiaí', uf: 'SP' },
    farmacia: { nome: 'Farmácia Vida', documento: '33.444.555/0001-66', contato: 'Luciana', telefone: '(11) 4002-3003', endereco: 'Rua XV de Novembro, 88', cidade: 'Sorocaba', uf: 'SP' },
    distribuidora: { nome: 'Distribuidora Norte Sul', documento: '44.555.666/0001-77', contato: 'Roberto', telefone: '(31) 4002-4004', endereco: 'Anel Rodoviário, km 12', cidade: 'Belo Horizonte', uf: 'MG' },
  })) c[k] = await prisma.cliente.create({ data: d });

  await prisma.movimento.createMany({ data: [
    { tipo: 'Saída', dataHora: DT(0, '07:40'), veiculoId: v.gol.id, motoristaId: m.carlos.id, km: 87410, combustivel: 'Cheio', destino: 'Entregas zona sul' },
    { tipo: 'Saída', dataHora: DT(0, '08:15'), veiculoId: v.kangoo.id, motoristaId: m.rafael.id, km: 21390, combustivel: '3/4', destino: 'Visita técnica, cliente em Barueri' },
    { tipo: 'Entrada', dataHora: DT(-1, '18:05'), veiculoId: v.strada.id, motoristaId: m.juliana.id, km: 48210, combustivel: '1/2', destino: 'Retorno ao pátio' },
    { tipo: 'Saída', dataHora: DT(-1, '07:55'), veiculoId: v.strada.id, motoristaId: m.juliana.id, km: 47980, combustivel: 'Cheio', destino: 'Rota interior, Jundiaí' },
    { tipo: 'Entrada', dataHora: DT(-2, '17:30'), veiculoId: v.hilux.id, motoristaId: m.ana.id, km: 154300, combustivel: '1/4', destino: 'Retorno ao pátio', obs: 'Ar-condicionado não está gelando.' },
    { tipo: 'Saída', dataHora: DT(-2, '06:50'), veiculoId: v.hilux.id, motoristaId: m.ana.id, km: 153870, combustivel: 'Cheio', destino: 'Coleta de materiais' },
    { tipo: 'Entrada', dataHora: DT(-3, '19:10'), veiculoId: v.gol.id, motoristaId: m.carlos.id, km: 87410, combustivel: '1/2', destino: 'Retorno ao pátio' },
    { tipo: 'Saída', dataHora: DT(-3, '08:00'), veiculoId: v.gol.id, motoristaId: m.carlos.id, km: 87150, combustivel: '3/4', destino: 'Entregas zona oeste' },
    { tipo: 'Entrada', dataHora: DT(-4, '20:40'), veiculoId: v.volvo.id, motoristaId: m.ana.id, km: 210400, combustivel: '1/4', destino: 'Retorno de Belo Horizonte' },
    { tipo: 'Saída', dataHora: DT(-6, '05:30'), veiculoId: v.volvo.id, motoristaId: m.ana.id, km: 209230, combustivel: 'Cheio', destino: 'Frete para Belo Horizonte/MG' },
  ] });

  const planos = {};
  for (const [k, d] of Object.entries({
    oleoGol: { veiculoId: v.gol.id, servico: 'Troca de óleo e filtros', intervaloKm: 10000, intervaloDias: 180, ultimaData: D(-177), ultimaKm: 78100 },
    revisaoHilux: { veiculoId: v.hilux.id, servico: 'Revisão geral', intervaloKm: 20000, intervaloDias: 365, ultimaData: D(-359), ultimaKm: 135000 },
    freioSprinter: { veiculoId: v.sprinter.id, servico: 'Pastilhas e discos de freio', intervaloKm: 30000, ultimaData: D(-308), ultimaKm: 103000 },
    alinhamentoStrada: { veiculoId: v.strada.id, servico: 'Alinhamento e balanceamento', intervaloKm: 10000, intervaloDias: 180, ultimaData: D(-70), ultimaKm: 42000 },
    revisaoKangoo: { veiculoId: v.kangoo.id, servico: 'Revisão geral', intervaloKm: 10000, intervaloDias: 365, ultimaData: D(-381), ultimaKm: 11000 },
    oleoCg: { veiculoId: v.cg.id, servico: 'Troca de óleo e filtros', intervaloKm: 3000, intervaloDias: 120, ultimaData: D(-19), ultimaKm: 29800 },
    oleoVolvo: { veiculoId: v.volvo.id, servico: 'Troca de óleo e filtros', intervaloKm: 30000, intervaloDias: 180, ultimaData: D(-95), ultimaKm: 190000 },
    tacografoVolvo: { veiculoId: v.volvo.id, servico: 'Tacógrafo', intervaloDias: 730, ultimaData: D(-700) },
  })) planos[k] = await prisma.planoManutencao.create({ data: d });

  const it = (desc, tipo, qtd, valor) => ({ desc, tipo, qtd, valor });
  const ordens = [
    { numero: 1, veiculoId: v.cg.id, tipo: 'Preventiva', prioridade: 'Baixa', fornecedorId: f.oficina.id, status: 'Concluída', abertura: D(-155), conclusao: D(-155), km: 24100, solicitante: 'Frota', responsavel: 'Marcos', descricao: 'Troca de óleo e filtro', valorPrevisto: 120, itens: [it('Óleo 10W30 1 L', 'Peça', 1, 42), it('Filtro de óleo', 'Peça', 1, 28), it('Mão de obra', 'Serviço', 1, 40)] },
    { numero: 2, veiculoId: v.sprinter.id, tipo: 'Corretiva', prioridade: 'Alta', fornecedorId: f.pecas.id, status: 'Concluída', abertura: D(-98), conclusao: D(-98), km: 131000, solicitante: 'Ana Paula Ferreira', responsavel: 'Balcão', descricao: 'Van não dá partida pela manhã', correcao: 'Bateria substituída, alternador testado e aprovado.', valorPrevisto: 900, itens: [it('Bateria 150 Ah', 'Peça', 1, 980), it('Instalação e teste do alternador', 'Serviço', 1, 80)] },
    { numero: 3, veiculoId: v.hilux.id, tipo: 'Corretiva', prioridade: 'Média', fornecedorId: f.oficina.id, status: 'Concluída', abertura: D(-57), conclusao: D(-55), km: 152800, solicitante: 'Ana Paula Ferreira', responsavel: 'Marcos', descricao: 'Barulho na suspensão dianteira em pisos irregulares', correcao: 'Bieletas e buchas da bandeja substituídas.', valorPrevisto: 700, itens: [it('Bieleta dianteira', 'Peça', 2, 189.9), it('Bucha da bandeja', 'Peça', 2, 74.5), it('Mão de obra suspensão', 'Serviço', 1, 320)] },
    { numero: 4, veiculoId: v.gol.id, tipo: 'Preventiva', prioridade: 'Média', fornecedorId: f.oficina.id, status: 'Concluída', abertura: D(-35), conclusao: D(-34), km: 86300, solicitante: 'Frota', responsavel: 'Marcos', descricao: 'Troca das pastilhas dianteiras', valorPrevisto: 400, itens: [it('Jogo de pastilhas dianteiras', 'Peça', 1, 238), it('Mão de obra', 'Serviço', 1, 150)] },
    { numero: 5, veiculoId: v.volvo.id, tipo: 'Preditiva', prioridade: 'Média', fornecedorId: f.diesel.id, status: 'Concluída', abertura: D(-21), conclusao: D(-20), km: 208900, solicitante: 'Frota', responsavel: 'Eduardo', descricao: 'Análise de óleo e vibração do eixo traseiro', correcao: 'Sem desgaste anormal. Próxima análise em 20.000 km.', valorPrevisto: 650, itens: [it('Análise laboratorial de óleo', 'Serviço', 1, 280), it('Medição de vibração', 'Serviço', 1, 350)] },
    { numero: 6, veiculoId: v.sprinter.id, tipo: 'Preventiva', prioridade: 'Alta', fornecedorId: f.oficina.id, status: 'Em execução', abertura: D(-4), previsao: D(-1), km: 132900, solicitante: 'Frota', responsavel: 'Marcos', descricao: 'Pastilhas e discos de freio', planoId: planos.freioSprinter.id, valorPrevisto: 1500, itens: [it('Disco de freio dianteiro', 'Peça', 2, 412), it('Jogo de pastilhas', 'Peça', 1, 356), it('Mão de obra freios', 'Serviço', 1, 420)] },
    { numero: 7, veiculoId: v.hilux.id, tipo: 'Corretiva', prioridade: 'Alta', fornecedorId: f.oficina.id, status: 'Aberta', abertura: D(0), previsao: D(2), km: 154300, solicitante: 'Ana Paula Ferreira', descricao: 'Ar-condicionado sem refrigeração', valorPrevisto: 600, itens: [it('Diagnóstico do sistema de ar', 'Serviço', 1, 150)] },
    { numero: 8, veiculoId: v.gol.id, tipo: 'Preventiva', prioridade: 'Média', fornecedorId: f.oficina.id, status: 'Agendada', agendadaPara: D(3), abertura: D(-1), km: 87540, solicitante: 'Frota', descricao: 'Troca de óleo e filtros', planoId: planos.oleoGol.id, valorPrevisto: 320, itens: [] },
  ];
  for (const o of ordens) await prisma.ordemServico.create({ data: { ...o, itens: JSON.stringify(o.itens) } });
  await prisma.veiculo.update({ where: { id: v.hilux.id }, data: { status: 'Manutenção' } });

  const ab = (veic, mot, dias, comb, km, litros, preco, tanque = 'Cheio') => ({ veiculoId: veic.id, motoristaId: mot.id, fornecedorId: f.posto.id, data: D(dias), combustivel: comb, km, litros, valor: Math.round(litros * preco * 100) / 100, tanque });
  await prisma.abastecimento.createMany({ data: [
    ab(v.gol, m.carlos, -147, 'Gasolina comum', 85650, 36, 6.19), ab(v.hilux, m.ana, -125, 'Diesel S10', 152200, 70, 6.09), ab(v.sprinter, m.ana, -104, 'Diesel S10', 130950, 72, 6.09),
    ab(v.gol, m.carlos, -61, 'Gasolina comum', 86080, 38, 6.19), ab(v.hilux, m.ana, -53, 'Diesel S10', 152900, 72, 6.09), ab(v.sprinter, m.juliana, -41, 'Diesel S10', 131600, 73, 6.09),
    ab(v.strada, m.juliana, -26, 'Etanol', 47600, 45, 4.29), ab(v.gol, m.carlos, -19, 'Gasolina comum', 86500, 39, 6.19), ab(v.cg, m.rafael, -16, 'Gasolina comum', 30500, 12, 6.19),
    ab(v.kangoo, m.rafael, -13, 'Gasolina comum', 21000, 42, 6.19), ab(v.sprinter, m.ana, -8, 'Diesel S10', 132300, 76, 6.09), ab(v.strada, m.juliana, -7, 'Etanol', 47950, 44, 4.29),
    ab(v.gol, m.carlos, -5, 'Gasolina comum', 86950, 40, 6.19), ab(v.cg, m.rafael, -4, 'Gasolina comum', 30880, 9, 6.19, 'Suficiente'), ab(v.hilux, m.ana, -3, 'Diesel S10', 153650, 73, 6.09),
    ab(v.volvo, m.ana, -40, 'Diesel S10', 206850, 380, 5.95), ab(v.volvo, m.ana, -6, 'Diesel S10', 209230, 395, 5.95), ab(v.volvo, m.ana, -5, 'Diesel S10', 209900, 190, 6.05, 'Suficiente'),
  ] });

  const pneus = [
    ['HX-001', v.hilux, 'Dianteiro esquerdo', 7.2, 141000], ['HX-002', v.hilux, 'Dianteiro direito', 6.9, 141000],
    ['HX-003', v.hilux, 'Traseiro esquerdo', 5.1, 141000], ['HX-004', v.hilux, 'Traseiro direito', 1.5, 141000],
  ].map(([codigo, veic, posicao, sulcoAtual, kmInstalacao]) => ({ codigo, marca: 'Pirelli', modelo: 'Scorpion ATR', medida: '265/65 R17', dot: '2223', validade: D(1400), valor: 1180, status: 'Em uso', veiculoId: veic.id, posicao, sulcoInicial: 9.5, sulcoAtual, kmInstalacao }));
  pneus.push(
    ...['Dianteiro esquerdo', 'Dianteiro direito', 'Traseiro esquerdo externo', 'Traseiro esquerdo interno', 'Traseiro direito externo', 'Traseiro direito interno'].map((posicao, i) => ({
      codigo: `VL-${String(i + 1).padStart(3, '0')}`, marca: i < 2 ? 'Michelin' : 'Bridgestone', modelo: i < 2 ? 'X Multi Z' : 'R268 Ecopia', medida: '295/80 R22.5', dot: '4122', validade: D(1100),
      valor: 2650, status: 'Em uso', veiculoId: v.volvo.id, posicao, sulcoInicial: 16, sulcoAtual: i < 2 ? 11.5 : 8.2, kmInstalacao: 180000, recapagens: i < 2 ? 0 : 1, custoRecapagens: i < 2 ? 0 : 890,
    })),
    { codigo: 'EST-010', marca: 'Goodyear', modelo: 'Wrangler', medida: '265/65 R17', dot: '1824', validade: D(1600), valor: 1090, status: 'Estoque', sulcoInicial: 9.5, sulcoAtual: 9.5 },
    { codigo: 'VL-007', marca: 'Bridgestone', modelo: 'R268 Ecopia', medida: '295/80 R22.5', dot: '3821', validade: D(700), valor: 2650, status: 'Recapagem', sulcoInicial: 16, sulcoAtual: 3.1, kmAcumulado: 118000, recapagens: 1, custoRecapagens: 870 },
  );
  const pn = {};
  for (const p of pneus) pn[p.codigo] = await prisma.pneu.create({ data: p });

  await prisma.servicoPneu.createMany({ data: [
    { pneuId: pn['VL-003'].id, veiculoId: v.volvo.id, data: D(-80), tipo: 'Recapagem', classe: 'Preventiva', fornecedorId: f.borracharia.id, descricao: 'Recapagem a frio', custo: 890, status: 'Concluído', aplicado: true },
    { pneuId: pn['HX-003'].id, veiculoId: v.hilux.id, data: D(-30), tipo: 'Rodízio', classe: 'Preventiva', fornecedorId: f.borracharia.id, descricao: 'Rodízio em X e calibragem', custo: 80, status: 'Concluído' },
    { pneuId: pn['HX-004'].id, veiculoId: v.hilux.id, data: D(-12), tipo: 'Conserto', classe: 'Corretiva', fornecedorId: f.borracharia.id, descricao: 'Reparo de furo com manchão', custo: 65, status: 'Concluído' },
    { pneuId: pn['VL-007'].id, data: D(-2), tipo: 'Recapagem', classe: 'Preventiva', fornecedorId: f.borracharia.id, descricao: 'Enviado para recapagem', custo: 880, status: 'Em andamento' },
  ] });

  const checklist = (falhas = []) => JSON.stringify(['Calibragem conforme o fabricante', 'Sulco acima do mínimo legal (1,6 mm)', 'Sem desgaste irregular', 'Sem cortes, bolhas ou deformações', 'Válvulas e tampas presentes', 'Porcas e parafusos de roda apertados', 'Estepe em condições de uso', 'Sem vibração ou puxando para um lado']
    .map((item, i) => ({ item, conforme: !falhas.includes(i), obs: falhas.includes(i) ? (i === 1 ? 'Traseiro direito com 1,5 mm' : 'Desgaste na borda externa') : '' })));
  await prisma.inspecaoPneu.createMany({ data: [
    { data: D(-2), veiculoId: v.hilux.id, motoristaId: m.ana.id, itens: checklist([1, 2]), resultado: 'Não conforme', naoConformes: 2, obs: 'Programar troca do traseiro direito.' },
    { data: D(-6), veiculoId: v.volvo.id, motoristaId: m.ana.id, itens: checklist(), resultado: 'Conforme', naoConformes: 0 },
    { data: D(-9), veiculoId: v.strada.id, motoristaId: m.juliana.id, itens: checklist(), resultado: 'Conforme', naoConformes: 0 },
  ] });

  const ped = {};
  for (const [k, d] of Object.entries({
    p1: { codigo: 'PED-0001', clienteId: c.mercado.id, descricao: 'Bebidas e mercearia seca', quantidade: 48, endereco: 'Av. Brasil, 1500 - Campinas/SP', contato: 'Fernanda', dataSaida: D(-12), prazo: D(-11), dataEntrega: D(-11), status: 'Entregue' },
    p2: { codigo: 'PED-0002', clienteId: c.farmacia.id, descricao: 'Medicamentos e perfumaria', quantidade: 22, endereco: 'Rua XV de Novembro, 88 - Sorocaba/SP', contato: 'Luciana', dataSaida: D(-8), prazo: D(-8), dataEntrega: D(-7), status: 'Entregue com atraso' },
    p3: { codigo: 'PED-0003', clienteId: c.construtora.id, descricao: 'Ferramentas e EPIs', quantidade: 15, endereco: 'Rua Itapura, 300 - Jundiaí/SP', contato: 'Eng. Paulo', dataSaida: D(-1), prazo: D(-1), dataEntrega: D(-1), status: 'Entregue' },
    p4: { codigo: 'PED-0004', clienteId: c.mercado.id, descricao: 'Hortifruti', quantidade: 30, endereco: 'Av. Brasil, 1500 - Campinas/SP', contato: 'Fernanda', dataSaida: D(0), prazo: D(0), status: 'Em transporte' },
    p5: { codigo: 'PED-0005', clienteId: c.farmacia.id, descricao: 'Reposição semanal', quantidade: 18, endereco: 'Rua XV de Novembro, 88 - Sorocaba/SP', contato: 'Luciana', prazo: D(2), status: 'Pendente' },
  })) ped[k] = await prisma.pedido.create({ data: d });

  await prisma.entrega.createMany({ data: [
    { data: D(-11), motoristaId: m.juliana.id, veiculoId: v.strada.id, clienteId: c.mercado.id, pedidoId: ped.p1.id, origem: 'São Paulo', ufOrigem: 'SP', destino: 'Campinas', ufDestino: 'SP', produto: 'Bebidas e mercearia', qtdProdutos: 48, kmRodados: 196, prazo: D(-11), dataEntrega: D(-11), status: 'Realizada' },
    { data: D(-7), motoristaId: m.rafael.id, veiculoId: v.kangoo.id, clienteId: c.farmacia.id, pedidoId: ped.p2.id, origem: 'São Paulo', ufOrigem: 'SP', destino: 'Sorocaba', ufDestino: 'SP', produto: 'Medicamentos', qtdProdutos: 22, kmRodados: 210, prazo: D(-8), dataEntrega: D(-7), status: 'Realizada com atraso' },
    { data: D(-1), motoristaId: m.juliana.id, veiculoId: v.strada.id, clienteId: c.construtora.id, pedidoId: ped.p3.id, origem: 'São Paulo', ufOrigem: 'SP', destino: 'Jundiaí', ufDestino: 'SP', produto: 'Ferramentas e EPIs', qtdProdutos: 15, kmRodados: 230, prazo: D(-1), dataEntrega: D(-1), status: 'Realizada' },
    { data: D(0), motoristaId: m.carlos.id, veiculoId: v.gol.id, clienteId: c.mercado.id, pedidoId: ped.p4.id, origem: 'São Paulo', ufOrigem: 'SP', destino: 'Campinas', ufDestino: 'SP', produto: 'Hortifruti', qtdProdutos: 30, prazo: D(0), status: 'Em andamento' },
    { data: D(-15), motoristaId: m.rafael.id, veiculoId: v.kangoo.id, clienteId: c.construtora.id, origem: 'São Paulo', ufOrigem: 'SP', destino: 'Jundiaí', ufDestino: 'SP', produto: 'Material elétrico', qtdProdutos: 9, kmRodados: 118, prazo: D(-15), status: 'Não realizada', obs: 'Cliente ausente no endereço.' },
  ] });

  const fr = (dias, cli, mercadoria, pesoT, destino, uf, valorFrete, comb, ped, outras, status) => ({
    data: D(dias), clienteId: cli.id, veiculoId: v.volvo.id, motoristaId: m.ana.id, mercadoria, quantidade: Math.round(pesoT * 40), pesoT, valorMercadoria: valorFrete * 18,
    origem: 'São Paulo', ufOrigem: 'SP', destino, ufDestino: uf, valorFrete, despCombustivel: comb, despPedagio: ped, despOutras: outras, lucro: valorFrete - comb - ped - outras, status,
  });
  await prisma.frete.createMany({ data: [
    fr(-140, c.distribuidora, 'Cimento ensacado', 14, 'Belo Horizonte', 'MG', 7800, 2350, 410, 300, 'Concluída'),
    fr(-110, c.construtora, 'Vergalhões de aço', 12, 'Jundiaí', 'SP', 2600, 480, 95, 120, 'Concluída'),
    fr(-75, c.distribuidora, 'Bebidas', 13.5, 'Belo Horizonte', 'MG', 7600, 2290, 410, 250, 'Concluída'),
    fr(-40, c.mercado, 'Mercearia seca', 10, 'Campinas', 'SP', 2900, 620, 110, 100, 'Concluída'),
    fr(-6, c.distribuidora, 'Revestimento cerâmico', 14, 'Belo Horizonte', 'MG', 8100, 2350, 410, 280, 'Concluída'),
    fr(2, c.construtora, 'Blocos de concreto', 15, 'Jundiaí', 'SP', 2800, 0, 0, 0, 'Pendente'),
  ] });

  await prisma.lancamento.createMany({ data: [
    { data: D(-130), tipo: 'Despesa', categoria: 'Impostos e taxas', descricao: 'IPVA da frota (parcela única)', valor: 9840, pago: true, dataPagamento: D(-130), vencimento: D(-130) },
    { data: D(-100), tipo: 'Despesa', categoria: 'Seguros', descricao: 'Seguro frota - parcela 4/10', valor: 1850, pago: true, dataPagamento: D(-100), vencimento: D(-100) },
    { data: D(-70), tipo: 'Despesa', categoria: 'Seguros', descricao: 'Seguro frota - parcela 5/10', valor: 1850, pago: true, dataPagamento: D(-70), vencimento: D(-70) },
    { data: D(-40), tipo: 'Despesa', categoria: 'Seguros', descricao: 'Seguro frota - parcela 6/10', valor: 1850, pago: true, dataPagamento: D(-40), vencimento: D(-40) },
    { data: D(-10), tipo: 'Despesa', categoria: 'Seguros', descricao: 'Seguro frota - parcela 7/10', valor: 1850, pago: true, dataPagamento: D(-10), vencimento: D(-10) },
    { data: D(-25), tipo: 'Despesa', categoria: 'Consórcios', descricao: 'Consórcio caminhão - cota 18', valor: 3200, pago: true, dataPagamento: D(-25), vencimento: D(-25) },
    { data: D(5), tipo: 'Despesa', categoria: 'Consórcios', descricao: 'Consórcio caminhão - cota 19', valor: 3200, pago: false, vencimento: D(5) },
    { data: D(-18), tipo: 'Despesa', categoria: 'Multas', descricao: 'Multa por excesso de velocidade - QOP7C12', valor: 195.23, pago: false, vencimento: D(-2), veiculoId: v.gol.id },
    { data: D(-30), tipo: 'Despesa', categoria: 'Administração', descricao: 'Sistema de rastreamento - mensalidade', valor: 420, pago: true, dataPagamento: D(-30), vencimento: D(-30) },
    { data: D(-3), tipo: 'Despesa', categoria: 'Terceiros', descricao: 'Lavagem e higienização da frota', valor: 560, pago: true, dataPagamento: D(-3) },
    { data: D(-20), tipo: 'Receita', categoria: 'Locação', descricao: 'Locação da Hilux para evento', valor: 1800, pago: true, dataPagamento: D(-20) },
    { data: D(-1), tipo: 'Receita', categoria: 'Entregas', descricao: 'Faturamento de entregas - quinzena', valor: 4350, pago: false, vencimento: D(10) },
    ...[150, 120, 90, 60, 30].map((dias, i) => ({ data: D(-dias), tipo: 'Receita', categoria: 'Entregas', descricao: 'Faturamento mensal de entregas', valor: [8200, 7900, 8650, 9100, 8800][i], pago: true, dataPagamento: D(-dias + 10), vencimento: D(-dias + 10) })),
  ] });

  console.log('Dados de exemplo criados.');
}

await usuarios();
if (demo) await exemplos();
await prisma.$disconnect();
