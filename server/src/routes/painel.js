import { Router } from 'express';
import { rota } from '../lib/http.js';
import { carregarTudo, dataCustoOS } from '../lib/dados.js';
import { hoje, mesDe, diasAte, situacaoPlano, totalItens, numeroOS, vencimento, situacaoSulco, OS_ABERTAS, OS_PENDENTES, isoDate } from '@localizacar/shared';

const soma = (lista, f) => lista.reduce((s, x) => s + (Number(f(x)) || 0), 0);

export function ultimosMeses(n, base = hoje()) {
  const [y, m] = base.split('-').map(Number);
  const meses = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    meses.push({ chave: isoDate(d).slice(0, 7), rotulo: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') });
  }
  return meses;
}

export function rotasPainel(prisma) {
  const r = Router();

  r.get('/', rota(async (_req, res) => {
    const D = await carregarTudo(prisma);
    const h = hoje();
    const mes = h.slice(0, 7);
    const ativos = D.veiculos.filter((v) => v.status !== 'Inativo');
    const contar = (s) => ativos.filter((v) => v.status === s).length;
    const osAbertas = D.ordens.filter((o) => OS_ABERTAS.includes(o.status));
    const placa = (id) => D.veiculoPorId[id]?.placa || '';

    // ---- alertas ----
    const A = [];
    for (const p of D.planos) {
      const s = situacaoPlano(p, D.veiculoPorId[p.veiculoId], D.ordens, h);
      if (s.tom === 'bad' || s.tom === 'warn') A.push({ sev: s.tom === 'bad' ? 0 : 2, tom: s.tom, titulo: `${p.servico} · ${placa(p.veiculoId)}`, detalhe: s.dica, ir: '/manutencoes' });
    }
    for (const o of D.ordens) {
      if (OS_ABERTAS.includes(o.status) && o.previsao && diasAte(o.previsao, h) < 0) A.push({ sev: 1, tom: 'bad', titulo: `${numeroOS(o.numero)} atrasada · ${placa(o.veiculoId)}`, detalhe: `previsão era ${o.previsao.split('-').reverse().join('/')}`, ir: '/ordens' });
      if (o.status === 'Agendada' && o.agendadaPara && diasAte(o.agendadaPara, h) <= 2) A.push({ sev: 2, tom: 'warn', titulo: `${numeroOS(o.numero)} agendada · ${placa(o.veiculoId)}`, detalhe: diasAte(o.agendadaPara, h) < 0 ? 'data agendada já passou' : `agendada para ${o.agendadaPara.split('-').reverse().join('/')}`, ir: '/ordens' });
    }
    for (const m of D.motoristas.filter((x) => x.status === 'Ativo')) {
      const v = vencimento(m.validadeCnh, 30, h);
      if (v && v.tom !== 'ok') A.push({ sev: v.tom === 'bad' ? 0 : 3, tom: v.tom, titulo: `CNH de ${m.nome}`, detalhe: v.texto, ir: '/motoristas' });
      if (m.aptidao === 'Inapto') A.push({ sev: 3, tom: 'warn', titulo: `${m.nome} está inapto`, detalhe: 'não pode registrar saídas', ir: '/motoristas' });
    }
    for (const v of ativos) {
      for (const [k, rot] of [['licenciamento', 'Licenciamento'], ['seguro', 'Seguro']]) {
        const venc = vencimento(v[k], 30, h);
        if (venc && venc.tom !== 'ok') A.push({ sev: venc.tom === 'bad' ? 0 : 3, tom: venc.tom, titulo: `${rot} · ${v.placa}`, detalhe: venc.texto, ir: '/veiculos' });
      }
      if (v.documentacao === 'Pendente') A.push({ sev: 3, tom: 'warn', titulo: `Documentação pendente · ${v.placa}`, detalhe: 'regularize o cadastro do veículo', ir: '/veiculos' });
    }
    for (const p of D.pneus.filter((x) => x.status === 'Em uso')) {
      const s = situacaoSulco(p);
      if (s.tom === 'bad') A.push({ sev: 1, tom: 'bad', titulo: `Pneu ${p.codigo} · ${placa(p.veiculoId)}`, detalhe: `sulco de ${String(p.sulcoAtual).replace('.', ',')} mm, abaixo do mínimo`, ir: '/pneus' });
    }
    for (const l of D.lancamentos.filter((x) => !x.pago && x.vencimento)) {
      const d = diasAte(l.vencimento, h);
      if (d <= 5) A.push({ sev: d < 0 ? 1 : 3, tom: d < 0 ? 'bad' : 'warn', titulo: `${l.tipo === 'Receita' ? 'A receber' : 'A pagar'}: ${l.descricao}`, detalhe: d < 0 ? `vencido há ${-d} dias` : d === 0 ? 'vence hoje' : `vence em ${d} dias`, ir: '/financeiro' });
    }
    A.sort((a, b) => a.sev - b.sev);

    // ---- custos ----
    const custoMes = (chave) => ({
      manutencao: soma(D.ordens.filter((o) => o.status !== 'Cancelada' && mesDe(dataCustoOS(o)) === chave), (o) => totalItens(o.itens)),
      combustivel: soma(D.abastecimentos.filter((a) => mesDe(a.data) === chave), (a) => a.valor),
      pneus: soma(D.servicosPneu.filter((s) => s.status !== 'Cancelado' && mesDe(s.data) === chave), (s) => s.custo),
    });
    const meses = ultimosMeses(6, h).map((m) => ({ ...m, ...custoMes(m.chave) }));
    const atual = custoMes(mes);
    const abastMes = D.abastecimentos.filter((a) => mesDe(a.data) === mes);

    const entregasMes = D.entregas.filter((e) => mesDe(e.data) === mes);
    const fretesMes = D.fretes.filter((f) => mesDe(f.data) === mes && f.status !== 'Cancelada');

    res.json({
      hoje: h,
      frota: { total: ativos.length, disponivel: contar('Disponível'), emUso: contar('Em uso'), manutencao: contar('Manutenção'), kmTotal: soma(ativos, (v) => v.km) },
      os: { abertas: osAbertas.length, valor: soma(osAbertas, (o) => totalItens(o.itens)), agendadas: D.ordens.filter((o) => o.status === 'Agendada').length, pendentes: D.ordens.filter((o) => OS_PENDENTES.includes(o.status)).length },
      custos: { ...atual, litros: soma(abastMes, (a) => a.litros) },
      meses,
      entregas: {
        mes: entregasMes.length,
        realizadas: entregasMes.filter((e) => e.status.startsWith('Realizada')).length,
        noPrazo: entregasMes.filter((e) => e.status === 'Realizada').length,
        emAndamento: D.entregas.filter((e) => e.status === 'Em andamento').length,
      },
      fretes: { mes: fretesMes.length, receita: soma(fretesMes, (f) => f.valorFrete), lucro: soma(fretesMes, (f) => f.lucro) },
      alertas: A,
      movimentos: D.movimentos.slice(0, 6),
    });
  }));

  return r;
}
