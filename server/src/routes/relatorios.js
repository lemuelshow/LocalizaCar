import { Router } from 'express';
import { rota, falha } from '../lib/http.js';
import { carregarTudo, dataCustoOS } from '../lib/dados.js';
import { totalItens, consumoKmL, kmRodadoPneu, mesDe, isoDate, OS_TIPOS, PNEU_STATUS, ENTREGA_STATUS, CATEGORIAS_DESPESA, CATEGORIAS_RECEITA } from '@localizacar/shared';

const soma = (lista, f) => lista.reduce((s, x) => s + (Number(f(x)) || 0), 0);
const noPeriodo = (data, de, ate) => !!data && data.slice(0, 10) >= de && data.slice(0, 10) <= ate;
const agrupar = (lista, chave) => lista.reduce((m, x) => { const k = chave(x); (m[k] ||= []).push(x); return m; }, {});

function mesesEntre(de, ate) {
  const out = [];
  let [y, m] = de.split('-').map(Number);
  const [y2, m2] = ate.split('-').map(Number);
  while (y < y2 || (y === y2 && m <= m2)) {
    const d = new Date(y, m - 1, 1);
    out.push({ chave: isoDate(d).slice(0, 7), rotulo: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('. de ', '/').replace('.', '') });
    m++; if (m > 12) { m = 1; y++; }
    if (out.length > 36) break;
  }
  return out;
}

export function rotasRelatorios(prisma) {
  const r = Router();

  r.get('/', rota(async (req, res) => {
    const ano = new Date().getFullYear();
    const de = String(req.query.de || `${ano}-01-01`);
    const ate = String(req.query.ate || `${ano}-12-31`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(de) || !/^\d{4}-\d{2}-\d{2}$/.test(ate) || de > ate) throw falha('Período inválido.');

    const D = await carregarTudo(prisma);
    const ordens = D.ordens.filter((o) => o.status !== 'Cancelada' && noPeriodo(dataCustoOS(o), de, ate));
    const abast = D.abastecimentos.filter((a) => noPeriodo(a.data, de, ate));
    const servPneu = D.servicosPneu.filter((s) => s.status !== 'Cancelado' && noPeriodo(s.data, de, ate));
    const movs = D.movimentos.filter((m) => noPeriodo(m.dataHora, de, ate));
    const entregas = D.entregas.filter((e) => noPeriodo(e.data, de, ate));
    const fretes = D.fretes.filter((f) => f.status !== 'Cancelada' && noPeriodo(f.data, de, ate));
    const lanc = D.lancamentos.filter((l) => noPeriodo(l.data, de, ate));
    const insp = D.inspecoes.filter((i) => noPeriodo(i.data, de, ate));

    // Km rodados no periodo: soma dos percursos (entrada - saida anterior) de cada veiculo.
    const kmPorVeiculo = {};
    for (const [vid, lista] of Object.entries(agrupar([...D.movimentos].sort((a, b) => a.dataHora.localeCompare(b.dataHora)), (m) => m.veiculoId))) {
      let saida = null;
      for (const m of lista) {
        if (m.tipo === 'Saída') saida = m;
        else if (saida && noPeriodo(m.dataHora, de, ate)) { kmPorVeiculo[vid] = (kmPorVeiculo[vid] || 0) + Math.max(0, m.km - saida.km); saida = null; }
      }
    }

    const porVeiculo = D.veiculos.map((v) => {
      const manutencao = soma(ordens.filter((o) => o.veiculoId === v.id), (o) => totalItens(o.itens));
      const combustivel = soma(abast.filter((a) => a.veiculoId === v.id), (a) => a.valor);
      const pneus = soma(servPneu.filter((s) => s.veiculoId === v.id), (s) => s.custo);
      const litros = soma(abast.filter((a) => a.veiculoId === v.id), (a) => a.litros);
      const consumos = abast.filter((a) => a.veiculoId === v.id).map((a) => consumoKmL(a, D.abastecimentos)).filter((c) => c != null && c > 0 && c < 80);
      const km = kmPorVeiculo[v.id] || 0;
      const total = manutencao + combustivel + pneus;
      return {
        id: v.id, placa: v.placa, veiculo: `${v.marca} ${v.modelo}`, manutencao, combustivel, pneus, total, litros, km,
        custoKm: km ? total / km : null,
        consumo: consumos.length ? consumos.reduce((a, b) => a + b, 0) / consumos.length : null,
        os: ordens.filter((o) => o.veiculoId === v.id).length,
      };
    }).filter((x) => x.total || x.km || x.os).sort((a, b) => b.total - a.total);

    const meses = mesesEntre(de, ate).map((m) => ({
      ...m,
      manutencao: soma(ordens.filter((o) => mesDe(dataCustoOS(o)) === m.chave), (o) => totalItens(o.itens)),
      combustivel: soma(abast.filter((a) => mesDe(a.data) === m.chave), (a) => a.valor),
      pneus: soma(servPneu.filter((s) => mesDe(s.data) === m.chave), (s) => s.custo),
      receitaFretes: soma(fretes.filter((f) => mesDe(f.data) === m.chave), (f) => f.valorFrete),
      lucroFretes: soma(fretes.filter((f) => mesDe(f.data) === m.chave), (f) => f.lucro),
      entregas: entregas.filter((e) => mesDe(e.data) === m.chave).length,
    }));

    const motoristaNome = (id) => D.motoristaPorId[id]?.nome || 'Sem motorista';
    const contarPor = (lista, chave, ordem) => {
      const g = agrupar(lista, chave);
      const nomes = ordem || Object.keys(g);
      return nomes.map((n) => ({ nome: n, quantidade: (g[n] || []).length })).filter((x) => x.quantidade);
    };

    res.json({
      periodo: { de, ate },
      totais: {
        manutencao: soma(ordens, (o) => totalItens(o.itens)), combustivel: soma(abast, (a) => a.valor), pneus: soma(servPneu, (s) => s.custo),
        litros: soma(abast, (a) => a.litros), km: Object.values(kmPorVeiculo).reduce((a, b) => a + b, 0), os: ordens.length,
        viagens: movs.filter((m) => m.tipo === 'Saída').length, entregas: entregas.length, fretes: fretes.length,
        receitaFretes: soma(fretes, (f) => f.valorFrete), lucroFretes: soma(fretes, (f) => f.lucro),
      },
      porVeiculo,
      meses,
      osPorTipo: OS_TIPOS.map((t) => ({ nome: t, quantidade: ordens.filter((o) => o.tipo === t).length, valor: soma(ordens.filter((o) => o.tipo === t), (o) => totalItens(o.itens)) })).filter((x) => x.quantidade),
      osPorPrioridade: contarPor(ordens.filter((o) => o.tipo === 'Corretiva'), (o) => o.prioridade, ['Alta', 'Média', 'Baixa']),
      oficinas: Object.entries(agrupar(ordens.filter((o) => o.fornecedorId), (o) => o.fornecedorId)).map(([fid, l]) => {
        const f = D.fornecedores.find((x) => x.id === fid);
        const dias = l.filter((o) => o.conclusao).map((o) => Math.max(0, (new Date(o.conclusao) - new Date(o.abertura)) / 864e5));
        return { nome: f?.nome || 'Fornecedor removido', os: l.length, valor: soma(l, (o) => totalItens(o.itens)), previsto: soma(l, (o) => o.valorPrevisto), diasMedios: dias.length ? dias.reduce((a, b) => a + b, 0) / dias.length : null };
      }).sort((a, b) => b.valor - a.valor),
      combustivelPorTipo: Object.entries(agrupar(abast, (a) => a.combustivel || 'Não informado')).map(([nome, l]) => ({ nome, litros: soma(l, (a) => a.litros), valor: soma(l, (a) => a.valor) })).sort((a, b) => b.valor - a.valor),
      entregasPorStatus: contarPor(entregas, (e) => e.status, ENTREGA_STATUS),
      entregasPorMotorista: Object.entries(agrupar(entregas, (e) => e.motoristaId)).map(([id, l]) => ({ nome: motoristaNome(id), quantidade: l.length, noPrazo: l.filter((e) => e.status === 'Realizada').length, km: soma(l, (e) => e.kmRodados) })).sort((a, b) => b.quantidade - a.quantidade),
      fretesPorCliente: Object.entries(agrupar(fretes, (f) => f.clienteId || '')).map(([id, l]) => ({ nome: D.clientes.find((c) => c.id === id)?.nome || 'Sem cliente', fretes: l.length, receita: soma(l, (f) => f.valorFrete), lucro: soma(l, (f) => f.lucro) })).sort((a, b) => b.receita - a.receita),
      pneusPorStatus: PNEU_STATUS.map((s) => ({ nome: s, quantidade: D.pneus.filter((p) => p.status === s).length })).filter((x) => x.quantidade),
      pneus: D.pneus.map((p) => ({ codigo: p.codigo, marca: p.marca, km: kmRodadoPneu(p, D.veiculoPorId[p.veiculoId]), recapagens: p.recapagens, custo: (p.valor || 0) + p.custoRecapagens })).map((p) => ({ ...p, custoKm: p.km ? p.custo / p.km : null })).sort((a, b) => b.km - a.km),
      inspecoes: { total: insp.length, conformes: insp.filter((i) => i.resultado === 'Conforme').length, itensNaoConformes: soma(insp, (i) => i.naoConformes) },
      lancamentos: {
        despesas: CATEGORIAS_DESPESA.map((c) => ({ nome: c, valor: soma(lanc.filter((l) => l.tipo === 'Despesa' && l.categoria === c), (l) => l.valor) })).filter((x) => x.valor),
        receitas: CATEGORIAS_RECEITA.map((c) => ({ nome: c, valor: soma(lanc.filter((l) => l.tipo === 'Receita' && l.categoria === c), (l) => l.valor) })).filter((x) => x.valor),
      },
    });
  }));

  return r;
}
