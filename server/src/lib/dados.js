// Carrega todas as tabelas para os calculos de painel, relatorios e financeiro.
// Frotas tipicas tem centenas a poucos milhares de registros: cabe em memoria com folga.
export async function carregarTudo(prisma) {
  const [veiculos, motoristas, fornecedores, clientes, movimentos, planos, ordensBrutas, abastecimentos, pneus, servicosPneu, inspecoes, pedidos, entregas, fretes, lancamentos] =
    await Promise.all([
      prisma.veiculo.findMany(), prisma.motorista.findMany(), prisma.fornecedor.findMany(), prisma.cliente.findMany(),
      prisma.movimento.findMany({ orderBy: { dataHora: 'desc' } }), prisma.planoManutencao.findMany(), prisma.ordemServico.findMany(),
      prisma.abastecimento.findMany(), prisma.pneu.findMany(), prisma.servicoPneu.findMany(), prisma.inspecaoPneu.findMany(),
      prisma.pedido.findMany(), prisma.entrega.findMany(), prisma.frete.findMany(), prisma.lancamento.findMany(),
    ]);
  const ordens = ordensBrutas.map((o) => ({ ...o, itens: JSON.parse(o.itens || '[]') }));
  const porId = (lista) => Object.fromEntries(lista.map((x) => [x.id, x]));
  return {
    veiculos, motoristas, fornecedores, clientes, movimentos, planos, ordens, abastecimentos, pneus, servicosPneu, inspecoes, pedidos, entregas, fretes, lancamentos,
    veiculoPorId: porId(veiculos), motoristaPorId: porId(motoristas),
  };
}

// Data de referencia de custo de uma OS: conclusao, ou abertura enquanto estiver em andamento.
export const dataCustoOS = (o) => o.conclusao || o.abertura;
