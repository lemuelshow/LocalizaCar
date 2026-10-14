import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { api } from '../lib/api.js';
import { brl, num, baixarCsv } from '../lib/format.js';
import { Cabecalho, IconeBaixar } from '../components/ui.jsx';
import ListPage from '../components/ListPage.jsx';
import * as E from '../entidades.jsx';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function Financeiro() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const { data: F, error } = useQuery({ queryKey: ['financeiro', ano], queryFn: () => api('/financeiro?ano=' + ano) });

  const exportar = () => {
    baixarCsv(`fluxo-de-caixa-${ano}`, ['Tipo', 'Categoria', 'Origem', ...MESES, 'Total'], [
      ...F.linhas.map((l) => [l.tipo, l.categoria, l.origem, ...l.valores.map((v) => v.toFixed(2)), l.total.toFixed(2)]),
      ['', 'Saldo do mês', '', ...F.saldo.map((v) => v.toFixed(2)), (F.totais.receitas - F.totais.despesas).toFixed(2)],
    ]);
  };

  return (
    <>
      <Cabecalho sobre="Fluxo de caixa da frota" titulo="Financeiro">
        <select aria-label="Ano" value={ano} onChange={(e) => setAno(Number(e.target.value))} className="btn">
          {[anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2, anoAtual - 3].map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <button className="btn" onClick={exportar} disabled={!F}><IconeBaixar />Exportar</button>
      </Cabecalho>
      {error ? <div className="panel">Não foi possível carregar: {error.message}</div> : !F ? <div className="empty"><strong>Carregando…</strong></div> : (
        <>
          <div className="kpi-row">
            <div className="kpi"><span className="l">Receitas {ano}</span><span className="v txt-ok">{brl(F.totais.receitas)}</span></div>
            <div className="kpi"><span className="l">Despesas {ano}</span><span className="v">{brl(F.totais.despesas)}</span></div>
            <div className="kpi"><span className="l">Saldo</span><span className={`v ${F.totais.receitas - F.totais.despesas < 0 ? 'txt-bad' : 'txt-ok'}`}>{brl(F.totais.receitas - F.totais.despesas)}</span></div>
            <div className="kpi"><span className="l">A pagar</span><span className="v">{brl(F.aPagar)}</span><span className="s">{F.vencidos ? <span className="txt-bad">{F.vencidos} vencido{F.vencidos > 1 ? 's' : ''}</span> : 'nada vencido'}</span></div>
            <div className="kpi"><span className="l">A receber</span><span className="v">{brl(F.aReceber)}</span></div>
          </div>

          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-h"><h2>Receitas, despesas e saldo acumulado</h2></div>
            <div className="chart chart-lg">
              <ResponsiveContainer>
                <ComposedChart data={MESES.map((m, i) => ({ mes: m, Receitas: F.receitas[i], Despesas: F.despesas[i], 'Saldo acumulado': F.acumulado[i] }))} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${num(v / 1000)} mil` : num(v))} tickLine={false} axisLine={false} width={60} />
                  <Tooltip formatter={(v, n) => [brl(v), n]} cursor={{ fill: 'var(--surface-2)' }} />
                  <Bar isAnimationActive={false} dataKey="Receitas" fill="var(--ok)" radius={[3, 3, 0, 0]} />
                  <Bar isAnimationActive={false} dataKey="Despesas" fill="var(--c2)" radius={[3, 3, 0, 0]} />
                  <Line isAnimationActive={false} dataKey="Saldo acumulado" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="legend"><span><span className="dot" style={{ background: 'var(--ok)' }} />Receitas</span><span><span className="dot" style={{ background: 'var(--c2)' }} />Despesas</span><span><span className="dot" style={{ background: 'var(--accent)' }} />Saldo acumulado</span></div>
          </div>

          <div className="tablewrap" style={{ marginBottom: 28 }}>
            <table className="t fin" style={{ minWidth: 1300 }}>
              <thead><tr><th>Categoria</th>{MESES.map((m) => <th key={m} className="num">{m}</th>)}<th className="num">Total</th></tr></thead>
              <tbody>
                {['Receita', 'Despesa'].map((tipo) => (
                  <Grupo key={tipo} tipo={tipo} linhas={F.linhas.filter((l) => l.tipo === tipo)} totais={tipo === 'Receita' ? F.receitas : F.despesas} />
                ))}
                <tr className="tot"><td>Saldo do mês</td>{F.saldo.map((v, i) => <td key={i} className={`num ${v < 0 ? 'neg' : ''}`}>{v ? num(v, 2) : '—'}</td>)}<td className="num">{num(F.totais.receitas - F.totais.despesas, 2)}</td></tr>
                <tr className="tot"><td>Saldo acumulado</td>{F.acumulado.map((v, i) => <td key={i} className={`num ${v < 0 ? 'neg' : ''}`}>{num(v, 2)}</td>)}<td /></tr>
              </tbody>
            </table>
          </div>
          <p className="sub" style={{ marginTop: -18, marginBottom: 24 }}>Entram automaticamente: OS concluídas (Manutenção), abastecimentos (Combustível), serviços de pneus concluídos (Pneus) e fretes concluídos (receita e despesas de viagem). Use os lançamentos para seguro, impostos, consórcios, multas, salários e outras contas.</p>
        </>
      )}
      <div className="sec-h"><h2>Lançamentos</h2></div>
      <ListPage ent={E.lancamentos} cabecalho={false} />
    </>
  );
}

function Grupo({ tipo, linhas, totais }) {
  return (
    <>
      <tr className="grp"><td>{tipo === 'Receita' ? 'Receitas' : 'Despesas'}</td>{totais.map((v, i) => <td key={i} className="num">{v ? num(v, 2) : '—'}</td>)}<td className="num">{num(totais.reduce((a, b) => a + b, 0), 2)}</td></tr>
      {linhas.length ? linhas.map((l) => (
        <tr key={l.categoria + l.origem}>
          <td>{l.categoria}<span className="sub">{l.origem}</span></td>
          {l.valores.map((v, i) => <td key={i} className="num">{v ? num(v, 2) : '—'}</td>)}
          <td className="num"><strong>{num(l.total, 2)}</strong></td>
        </tr>
      )) : <tr><td colSpan={14} className="sub">Nenhum valor no ano.</td></tr>}
    </>
  );
}
