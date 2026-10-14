import { Router } from 'express';
import { rota, falha } from '../lib/http.js';
import { carregarTudo, dataCustoOS } from '../lib/dados.js';
import { totalItens, hoje, CATEGORIAS_DESPESA, CATEGORIAS_RECEITA } from '@localizacar/shared';

// Fluxo de caixa anual: lancamentos manuais + custos e receitas que o sistema ja conhece
// (OS concluidas, abastecimentos, servicos de pneus e fretes concluidos).
export function rotasFinanceiro(prisma) {
  const r = Router();

  r.get('/', rota(async (req, res) => {
    const ano = Number(req.query.ano || new Date().getFullYear());
    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) throw falha('Ano inválido.');
    const D = await carregarTudo(prisma);
    const doAno = (data) => !!data && data.startsWith(String(ano));
    const mesIdx = (data) => Number(data.slice(5, 7)) - 1;

    const linhas = new Map();
    const somar = (tipo, categoria, origem, data, valor) => {
      if (!doAno(data) || !valor) return;
      const k = `${tipo}|${categoria}|${origem}`;
      if (!linhas.has(k)) linhas.set(k, { tipo, categoria, origem, valores: Array(12).fill(0) });
      linhas.get(k).valores[mesIdx(data)] += Number(valor);
    };

    for (const o of D.ordens.filter((x) => x.status === 'Concluída')) somar('Despesa', 'Manutenção', 'Ordens de serviço', dataCustoOS(o), totalItens(o.itens));
    for (const a of D.abastecimentos) somar('Despesa', 'Combustível', 'Abastecimentos', a.data, a.valor);
    for (const s of D.servicosPneu.filter((x) => x.status === 'Concluído')) somar('Despesa', 'Pneus', 'Serviços de pneus', s.data, s.custo);
    for (const f of D.fretes.filter((x) => x.status === 'Concluída')) {
      somar('Receita', 'Fretes', 'Fretes concluídos', f.data, f.valorFrete);
      somar('Despesa', 'Despesas de viagem', 'Fretes concluídos', f.data, (f.despCombustivel || 0) + (f.despPedagio || 0) + (f.despOutras || 0));
    }
    for (const l of D.lancamentos) somar(l.tipo, l.categoria, 'Lançamentos', l.data, l.valor);

    const ordemCat = [...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA, 'Pneus', 'Despesas de viagem'];
    const lista = [...linhas.values()]
      .map((l) => ({ ...l, total: l.valores.reduce((a, b) => a + b, 0) }))
      .sort((a, b) => (a.tipo === b.tipo ? ordemCat.indexOf(a.categoria) - ordemCat.indexOf(b.categoria) : a.tipo === 'Receita' ? -1 : 1));

    const totalPor = (tipo) => Array.from({ length: 12 }, (_, i) => lista.filter((l) => l.tipo === tipo).reduce((s, l) => s + l.valores[i], 0));
    const receitas = totalPor('Receita');
    const despesas = totalPor('Despesa');
    const saldo = receitas.map((v, i) => v - despesas[i]);
    let acc = 0;
    const acumulado = saldo.map((v) => (acc += v));

    const h = hoje();
    const abertos = D.lancamentos.filter((l) => !l.pago);
    res.json({
      ano,
      linhas: lista,
      receitas, despesas, saldo, acumulado,
      totais: { receitas: receitas.reduce((a, b) => a + b, 0), despesas: despesas.reduce((a, b) => a + b, 0) },
      aPagar: abertos.filter((l) => l.tipo === 'Despesa').reduce((s, l) => s + l.valor, 0),
      aReceber: abertos.filter((l) => l.tipo === 'Receita').reduce((s, l) => s + l.valor, 0),
      vencidos: abertos.filter((l) => l.vencimento && l.vencimento < h).length,
    });
  }));

  return r;
}
