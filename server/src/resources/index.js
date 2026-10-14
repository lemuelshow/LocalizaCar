// Definicao dos recursos da API: campos aceitos, permissoes e regras de negocio.
// Cada regra roda dentro da mesma transacao da gravacao (ctx.tx).
import {
  VEICULO_STATUS, OS_STATUS, OS_ABERTAS, OS_PENDENTES, OS_TIPOS, PRIORIDADES, PNEU_STATUS,
  ENTREGA_STATUS, PEDIDO_STATUS, FRETE_STATUS, CATEGORIAS_DESPESA, CATEGORIAS_RECEITA,
  hoje, diasAte, normalizarPlaca, placaValida, lucroFrete,
} from '@localizacar/shared';
import { falha } from '../lib/http.js';

const txt = (rotulo, extra = {}) => ({ tipo: 'string', rotulo, ...extra });
const int = (rotulo, extra = {}) => ({ tipo: 'int', rotulo, ...extra });
const num = (rotulo, extra = {}) => ({ tipo: 'float', rotulo, ...extra });
const bool = (rotulo) => ({ tipo: 'bool', rotulo });
const json = (rotulo) => ({ tipo: 'json', rotulo });
const req = { obrigatorio: true };

const TODOS = ['ADMIN', 'GESTOR', 'OPERADOR'];
const fmtKm = (n) => Number(n || 0).toLocaleString('pt-BR');

async function veiculo(tx, id) {
  if (!id) return null;
  const v = await tx.veiculo.findUnique({ where: { id } });
  if (!v) throw falha('Veículo não encontrado.', 'veiculoId');
  return v;
}

async function subirKm(tx, veiculoId, km) {
  if (!veiculoId || km == null) return;
  const v = await tx.veiculo.findUnique({ where: { id: veiculoId } });
  if (v && Number(km) > v.km) await tx.veiculo.update({ where: { id: v.id }, data: { km: Number(km) } });
}

export const recursos = {
  veiculos: {
    modelo: 'veiculo',
    ordem: { placa: 'asc' },
    campos: {
      placa: txt('a placa', req), marca: txt('a marca', req), modelo: txt('o modelo', req), ano: int('Ano'),
      tipo: txt('Tipo'), cor: txt('Cor'), combustivel: txt('Combustível'), renavam: txt('Renavam'), chassi: txt('Chassi'),
      km: int('Hodômetro'), status: txt('Situação', { opcoes: VEICULO_STATUS }),
      documentacao: txt('Documentação', { opcoes: ['OK', 'Pendente'] }),
      licenciamento: txt('Licenciamento'), seguro: txt('Seguro'), motoristaAtualId: txt('Motorista atual'), obs: txt('Observações'),
    },
    validar(d) {
      if (d.placa != null && !placaValida(d.placa)) throw falha('Placa inválida. Use o padrão ABC1D23 ou ABC1234.', 'placa');
    },
    antes(d) { if (d.placa != null) d.placa = normalizarPlaca(d.placa); },
  },

  motoristas: {
    modelo: 'motorista',
    ordem: { nome: 'asc' },
    campos: {
      nome: txt('o nome', req), cpf: txt('CPF'), rg: txt('RG'), telefone: txt('Telefone'), endereco: txt('Endereço'),
      cidade: txt('Cidade'), uf: txt('UF'), cnh: txt('o número da CNH', req), categoria: txt('Categoria'),
      validadeCnh: txt('a validade da CNH', req), aptidao: txt('Aptidão', { opcoes: ['Apto', 'Inapto'] }),
      status: txt('Situação', { opcoes: ['Ativo', 'Inativo'] }), obs: txt('Observações'),
    },
  },

  fornecedores: {
    modelo: 'fornecedor',
    ordem: { nome: 'asc' },
    campos: { nome: txt('o nome', req), tipo: txt('o tipo', req), cnpj: txt('CNPJ'), contato: txt('Contato'), telefone: txt('Telefone'), cidade: txt('Cidade'), obs: txt('Observações') },
  },

  clientes: {
    modelo: 'cliente',
    ordem: { nome: 'asc' },
    campos: { nome: txt('o nome', req), documento: txt('CPF/CNPJ'), contato: txt('Contato'), telefone: txt('Telefone'), endereco: txt('Endereço'), cidade: txt('Cidade'), uf: txt('UF'), obs: txt('Observações') },
  },

  movimentos: {
    modelo: 'movimento',
    ordem: { dataHora: 'desc' },
    escrita: TODOS,
    campos: {
      tipo: txt('o movimento', { ...req, opcoes: ['Saída', 'Entrada'] }), dataHora: txt('a data e hora', req),
      veiculoId: txt('o veículo', req), motoristaId: txt('o motorista', req), km: int('o hodômetro', req),
      combustivel: txt('Combustível'), destino: txt('Destino'), obs: txt('Observações'),
    },
    async validar(d, { tx, novo }) {
      if (!novo) return;
      const v = await veiculo(tx, d.veiculoId);
      if (d.tipo === 'Saída' && v.status !== 'Disponível') throw falha(`O veículo ${v.placa} está com situação "${v.status}". Registre a entrada ou conclua a OS antes de uma nova saída.`, 'veiculoId');
      if (d.tipo === 'Entrada' && v.status !== 'Em uso') throw falha(`O veículo ${v.placa} não tem saída em aberto.`, 'veiculoId');
      if (Number(d.km) < v.km) throw falha(`O hodômetro informado (${fmtKm(d.km)} km) é menor que o último registrado para ${v.placa} (${fmtKm(v.km)} km).`, 'km');
      if (d.tipo === 'Saída') {
        const m = await tx.motorista.findUnique({ where: { id: d.motoristaId } });
        if (!m) throw falha('Motorista não encontrado.', 'motoristaId');
        if (m.status !== 'Ativo') throw falha(`${m.nome} está inativo.`, 'motoristaId');
        if (m.aptidao === 'Inapto') throw falha(`${m.nome} está marcado como inapto para dirigir.`, 'motoristaId');
        if (diasAte(m.validadeCnh) < 0) throw falha(`A CNH de ${m.nome} está vencida. Atualize o cadastro antes da saída.`, 'motoristaId');
      }
    },
    async depois(m, { tx, novo }) {
      if (!novo) return;
      const v = await veiculo(tx, m.veiculoId);
      await tx.veiculo.update({
        where: { id: v.id },
        data: { km: Math.max(v.km, m.km), status: m.tipo === 'Saída' ? 'Em uso' : 'Disponível', motoristaAtualId: m.tipo === 'Saída' ? m.motoristaId : null },
      });
    },
  },

  manutencoes: {
    modelo: 'planoManutencao',
    campos: {
      veiculoId: txt('o veículo', req), servico: txt('o serviço', req), intervaloKm: int('Intervalo em km'), intervaloDias: int('Intervalo em dias'),
      ultimaData: txt('Última realização'), ultimaKm: int('Km da última realização'), obs: txt('Observações'),
    },
    validar(d) {
      if (!d.intervaloKm && !d.intervaloDias) throw falha('Informe o intervalo em km, em dias ou nos dois.', 'intervaloKm');
    },
  },

  ordens: {
    modelo: 'ordemServico',
    ordem: { numero: 'desc' },
    campos: {
      veiculoId: txt('o veículo', req), tipo: txt('Tipo', { opcoes: OS_TIPOS }), prioridade: txt('Prioridade', { opcoes: PRIORIDADES }),
      fornecedorId: txt('Oficina'), status: txt('Situação', { opcoes: OS_STATUS }), agendadaPara: txt('Data agendada'),
      abertura: txt('a data de abertura', req), previsao: txt('Previsão'), conclusao: txt('Conclusão'), km: int('Hodômetro'),
      solicitante: txt('Solicitante'), responsavel: txt('Responsável'), descricao: txt('o problema ou serviço', req), correcao: txt('Correção'),
      valorPrevisto: num('Valor previsto'), itens: json('Itens'), planoId: txt('Plano'), obs: txt('Observações'),
    },
    validar(d) {
      if (d.status === 'Concluída' && !(d.itens || []).length) throw falha('Inclua ao menos uma peça ou serviço antes de concluir a OS.', 'itens');
      if (d.status === 'Agendada' && !d.agendadaPara) throw falha('Informe a data agendada.', 'agendadaPara');
    },
    async antes(d, { tx, novo, final }) {
      if (novo) {
        const max = await tx.ordemServico.aggregate({ _max: { numero: true } });
        d.numero = (max._max.numero || 0) + 1;
      }
      if (final.status === 'Concluída' && !final.conclusao) d.conclusao = hoje();
    },
    async depois(os, { tx }) {
      const v = await veiculo(tx, os.veiculoId);
      const dados = {};
      if (os.km && os.km > v.km) dados.km = os.km;
      if (OS_ABERTAS.includes(os.status) && v.status === 'Disponível') dados.status = 'Manutenção';
      if (!OS_ABERTAS.includes(os.status) && v.status === 'Manutenção') {
        const outras = await tx.ordemServico.count({ where: { veiculoId: v.id, id: { not: os.id }, status: { in: OS_ABERTAS } } });
        if (!outras) dados.status = 'Disponível';
      }
      if (Object.keys(dados).length) await tx.veiculo.update({ where: { id: v.id }, data: dados });
      if (os.status === 'Concluída' && os.planoId) {
        const p = await tx.planoManutencao.findUnique({ where: { id: os.planoId } });
        if (p && p.ultimaData !== os.conclusao) {
          await tx.planoManutencao.update({ where: { id: p.id }, data: { ultimaData: os.conclusao, ultimaKm: os.km || dados.km || v.km } });
        }
      }
    },
  },

  abastecimentos: {
    modelo: 'abastecimento',
    ordem: { data: 'desc' },
    escrita: TODOS,
    campos: {
      veiculoId: txt('o veículo', req), motoristaId: txt('Motorista'), fornecedorId: txt('Posto'), data: txt('a data', req),
      combustivel: txt('Combustível'), km: int('o hodômetro', req), litros: num('os litros', req), valor: num('o valor', req),
      tanque: txt('Nível do tanque'), obs: txt('Observações'),
    },
    async validar(d, { tx, novo }) {
      if (d.litros <= 0) throw falha('A quantidade de litros deve ser maior que zero.', 'litros');
      const v = await veiculo(tx, d.veiculoId);
      if (novo && d.km < v.km - 5000) throw falha(`O hodômetro informado está muito abaixo do registrado para ${v.placa} (${fmtKm(v.km)} km). Confira o valor.`, 'km');
    },
    async depois(a, { tx }) { await subirKm(tx, a.veiculoId, a.km); },
  },

  pneus: {
    modelo: 'pneu',
    ordem: { codigo: 'asc' },
    campos: {
      codigo: txt('o número de fogo', req), marca: txt('a marca', req), modelo: txt('Modelo'), medida: txt('Medida'), dot: txt('DOT'),
      validade: txt('Validade'), valor: num('Valor'), status: txt('Situação', { opcoes: PNEU_STATUS }), veiculoId: txt('Veículo'),
      posicao: txt('Posição'), sulcoInicial: num('Sulco inicial'), sulcoAtual: num('Sulco atual'), kmInstalacao: int('Km na instalação'),
      kmAcumulado: int('Km acumulado'), recapagens: int('Recapagens'), custoRecapagens: num('Custo das recapagens'), obs: txt('Observações'),
    },
    async validar(d, { tx }) {
      if (d.status === 'Em uso') {
        if (!d.veiculoId) throw falha('Informe o veículo onde o pneu está montado.', 'veiculoId');
        if (!d.posicao) throw falha('Informe a posição do pneu no veículo.', 'posicao');
        const ocupado = await tx.pneu.findFirst({ where: { veiculoId: d.veiculoId, posicao: d.posicao, status: 'Em uso', id: d.id ? { not: d.id } : undefined } });
        if (ocupado) throw falha(`A posição "${d.posicao}" já está ocupada pelo pneu ${ocupado.codigo}.`, 'posicao');
      }
    },
    async antes(d, { tx, atual, final }) {
      const estavaEmUso = atual?.status === 'Em uso';
      const ficaEmUso = final.status === 'Em uso';
      // Saindo do veiculo (ou trocando de veiculo): soma o km rodado no acumulado.
      if (estavaEmUso && (!ficaEmUso || atual.veiculoId !== final.veiculoId)) {
        const v = await tx.veiculo.findUnique({ where: { id: atual.veiculoId } });
        if (v && atual.kmInstalacao != null) d.kmAcumulado = (atual.kmAcumulado || 0) + Math.max(0, v.km - atual.kmInstalacao);
        if (!ficaEmUso) { d.veiculoId = null; d.posicao = null; d.kmInstalacao = null; }
      }
      // Entrando em um veiculo: registra o hodometro de instalacao.
      if (ficaEmUso && (!estavaEmUso || atual.veiculoId !== final.veiculoId)) {
        const v = await veiculo(tx, final.veiculoId);
        if (final.kmInstalacao == null || estavaEmUso) d.kmInstalacao = v.km;
      }
    },
  },

  servicosPneu: {
    modelo: 'servicoPneu',
    ordem: { data: 'desc' },
    campos: {
      pneuId: txt('o pneu', req), veiculoId: txt('Veículo'), data: txt('a data', req),
      tipo: txt('o tipo de serviço', { ...req, opcoes: ['Recapagem', 'Conserto', 'Rodízio', 'Calibragem', 'Alinhamento e balanceamento', 'Troca', 'Inspeção'] }),
      classe: txt('Classe', { opcoes: ['Preventiva', 'Corretiva', 'Preditiva'] }), fornecedorId: txt('Fornecedor'), descricao: txt('Descrição'),
      custo: num('Custo'), status: txt('Situação', { opcoes: ['Pendente', 'Em andamento', 'Concluído', 'Cancelado'] }), obs: txt('Observações'),
    },
    antes(d, { final, atual }) {
      if (final.tipo === 'Recapagem' && final.status === 'Concluído' && !atual?.aplicado) d.aplicado = true;
    },
    async depois(s, { tx, atual }) {
      if (s.aplicado && !atual?.aplicado) {
        const p = await tx.pneu.findUnique({ where: { id: s.pneuId } });
        if (p) await tx.pneu.update({
          where: { id: p.id },
          data: { recapagens: p.recapagens + 1, custoRecapagens: p.custoRecapagens + (s.custo || 0), status: p.status === 'Recapagem' ? 'Estoque' : p.status },
        });
      }
      if (s.tipo === 'Recapagem' && s.status === 'Em andamento') {
        const p = await tx.pneu.findUnique({ where: { id: s.pneuId } });
        if (p && p.status !== 'Em uso') await tx.pneu.update({ where: { id: p.id }, data: { status: 'Recapagem' } });
      }
    },
  },

  inspecoes: {
    modelo: 'inspecaoPneu',
    ordem: { data: 'desc' },
    escrita: TODOS,
    campos: { data: txt('a data', req), veiculoId: txt('o veículo', req), motoristaId: txt('Responsável'), itens: json('Itens'), obs: txt('Observações') },
    validar(d) { if (!(d.itens || []).length) throw falha('Preencha o checklist.', 'itens'); },
    antes(d, { final }) {
      const nc = (final.itens || []).filter((i) => i.conforme === false).length;
      d.naoConformes = nc;
      d.resultado = nc ? 'Não conforme' : 'Conforme';
    },
  },

  pedidos: {
    modelo: 'pedido',
    ordem: { criadoEm: 'desc' },
    campos: {
      codigo: txt('Código'), clienteId: txt('o cliente', req), descricao: txt('a descrição', req), quantidade: int('Quantidade'),
      endereco: txt('Endereço'), contato: txt('Contato'), dataSaida: txt('Data de saída'), prazo: txt('Prazo'), dataEntrega: txt('Data de entrega'),
      status: txt('Situação', { opcoes: PEDIDO_STATUS }), obs: txt('Observações'),
    },
    async antes(d, { tx, novo }) {
      if (novo && !d.codigo) {
        const n = (await tx.pedido.count()) + 1;
        let codigo = 'PED-' + String(n).padStart(4, '0');
        for (let k = n; await tx.pedido.findUnique({ where: { codigo } }); k++) codigo = 'PED-' + String(k + 1).padStart(4, '0');
        d.codigo = codigo;
      }
    },
  },

  entregas: {
    modelo: 'entrega',
    ordem: { data: 'desc' },
    escrita: TODOS,
    campos: {
      data: txt('a data', req), motoristaId: txt('o motorista', req), veiculoId: txt('o veículo', req), clienteId: txt('Cliente'), pedidoId: txt('Pedido'),
      origem: txt('Origem'), ufOrigem: txt('UF de origem'), destino: txt('o destino', req), ufDestino: txt('UF de destino'),
      produto: txt('Produto'), qtdProdutos: int('Quantidade de produtos'), kmRodados: int('Km rodados'), prazo: txt('Prazo'), dataEntrega: txt('Data da entrega'),
      status: txt('Situação', { opcoes: ENTREGA_STATUS }), obs: txt('Observações'),
    },
    antes(d, { final }) {
      if (['Realizada', 'Realizada com atraso'].includes(final.status)) {
        const quando = final.dataEntrega || hoje();
        d.dataEntrega = quando;
        if (final.prazo) d.status = quando > final.prazo ? 'Realizada com atraso' : 'Realizada';
      }
    },
    async depois(e, { tx }) {
      if (!e.pedidoId) return;
      const mapa = { 'Programada': 'Pendente', 'Em andamento': 'Em transporte', 'Realizada': 'Entregue', 'Realizada com atraso': 'Entregue com atraso', 'Não realizada': 'Não entregue' };
      const p = await tx.pedido.findUnique({ where: { id: e.pedidoId } });
      if (p) await tx.pedido.update({ where: { id: p.id }, data: { status: mapa[e.status], dataEntrega: e.dataEntrega || p.dataEntrega, dataSaida: p.dataSaida || e.data } });
    },
  },

  fretes: {
    modelo: 'frete',
    ordem: { data: 'desc' },
    campos: {
      data: txt('a data', req), clienteId: txt('Cliente'), veiculoId: txt('o veículo', req), motoristaId: txt('Motorista'), mercadoria: txt('a mercadoria', req),
      quantidade: num('Quantidade'), pesoT: num('Peso'), valorMercadoria: num('Valor da mercadoria'), origem: txt('Origem'), ufOrigem: txt('UF de origem'),
      destino: txt('Destino'), ufDestino: txt('UF de destino'), valorFrete: num('Valor do frete'), despCombustivel: num('Combustível'),
      despPedagio: num('Pedágio'), despOutras: num('Outras despesas'), status: txt('Situação', { opcoes: FRETE_STATUS }), obs: txt('Observações'),
    },
    antes(d, { final }) { d.lucro = lucroFrete(final); },
  },

  lancamentos: {
    modelo: 'lancamento',
    ordem: { data: 'desc' },
    campos: {
      data: txt('a data', req), tipo: txt('o tipo', { ...req, opcoes: ['Receita', 'Despesa'] }), categoria: txt('a categoria', req), descricao: txt('a descrição', req),
      valor: num('o valor', req), vencimento: txt('Vencimento'), pago: bool('Pago'), dataPagamento: txt('Data do pagamento'), veiculoId: txt('Veículo'), obs: txt('Observações'),
    },
    validar(d) {
      const ok = d.tipo === 'Receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
      if (!ok.includes(d.categoria)) throw falha(`Categoria "${d.categoria}" não vale para ${d.tipo.toLowerCase()}.`, 'categoria');
      if (d.valor <= 0) throw falha('O valor deve ser maior que zero.', 'valor');
    },
    antes(d, { final }) {
      if (final.pago && !final.dataPagamento) d.dataPagamento = hoje();
      if (!final.pago) d.dataPagamento = null;
    },
  },
};

export { OS_PENDENTES };
