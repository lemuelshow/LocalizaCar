import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ComposedChart, Line } from 'recharts';
import { isoDate } from '@localizacar/shared';
import { api } from '../lib/api.js';
import { brl, brlCurto, num, fd, baixarCsv } from '../lib/format.js';
import { Cabecalho, Placa, IconeBaixar } from '../components/ui.jsx';

const CORES = ['var(--accent)', 'var(--c2)', 'var(--c4)', 'var(--ok)', 'var(--bad)', 'var(--c3)', 'var(--mute)'];
const eixo = (v) => (Math.abs(v) >= 1000 ? `${num(v / 1000)} mil` : num(v));

function periodo(chave) {
  const h = new Date();
  const y = h.getFullYear(), m = h.getMonth();
  switch (chave) {
    case 'mes': return [isoDate(new Date(y, m, 1)), isoDate(new Date(y, m + 1, 0))];
    case 'mesPassado': return [isoDate(new Date(y, m - 1, 1)), isoDate(new Date(y, m, 0))];
    case '3m': return [isoDate(new Date(y, m - 2, 1)), isoDate(new Date(y, m + 1, 0))];
    case '6m': return [isoDate(new Date(y, m - 5, 1)), isoDate(new Date(y, m + 1, 0))];
    case 'anoPassado': return [`${y - 1}-01-01`, `${y - 1}-12-31`];
    default: return [`${y}-01-01`, `${y}-12-31`];
  }
}

export default function Relatorios() {
  const [preset, setPreset] = useState('ano');
  const [faixa, setFaixa] = useState(periodo('ano'));
  const [de, ate] = faixa;
  const { data: R, error } = useQuery({ queryKey: ['relatorios', de, ate], queryFn: () => api(`/relatorios?de=${de}&ate=${ate}`) });
  const escolher = (p) => { setPreset(p); if (p !== 'custom') setFaixa(periodo(p)); };

  return (
    <>
      <Cabecalho sobre={`Período de ${fd(de)} a ${fd(ate)}`} titulo="Relatórios" />
      <div className="toolbar">
        <select aria-label="Período" value={preset} onChange={(e) => escolher(e.target.value)}>
          <option value="mes">Este mês</option><option value="mesPassado">Mês passado</option><option value="3m">Últimos 3 meses</option>
          <option value="6m">Últimos 6 meses</option><option value="ano">Este ano</option><option value="anoPassado">Ano passado</option><option value="custom">Personalizado</option>
        </select>
        {preset === 'custom' ? (
          <>
            <input type="date" aria-label="De" value={de} onChange={(e) => e.target.value && setFaixa([e.target.value, ate])} />
            <input type="date" aria-label="Até" value={ate} onChange={(e) => e.target.value && setFaixa([de, e.target.value])} />
          </>
        ) : null}
      </div>
      {error ? <div className="panel">Não foi possível carregar: {error.message}</div> : !R ? <div className="empty"><strong>Carregando…</strong></div> : <Conteudo R={R} />}
    </>
  );
}

function Conteudo({ R }) {
  const T = R.totais;
  const custoTotal = T.manutencao + T.combustivel + T.pneus;
  const consumo = useMemo(() => R.porVeiculo.filter((v) => v.consumo).map((v) => ({ placa: v.placa, consumo: Number(v.consumo.toFixed(1)) })), [R]);

  return (
    <>
      <div className="kpi-row">
        <div className="kpi"><span className="l">Custo da frota</span><span className="v">{brlCurto(custoTotal)}</span><span className="s">manutenção, combustível e pneus</span></div>
        <div className="kpi"><span className="l">Km rodados</span><span className="v">{num(T.km)}</span><span className="s">{T.viagens} viagens registradas</span></div>
        <div className="kpi"><span className="l">Custo por km</span><span className="v">{T.km ? brl(custoTotal / T.km) : '—'}</span><span className="s">sobre as viagens registradas</span></div>
        <div className="kpi"><span className="l">Combustível</span><span className="v">{num(T.litros)} L</span><span className="s">{T.litros ? `${brl(T.combustivel / T.litros)} por litro` : ''}</span></div>
        <div className="kpi"><span className="l">Lucro de fretes</span><span className={`v ${T.lucroFretes < 0 ? 'txt-bad' : 'txt-ok'}`}>{brlCurto(T.lucroFretes)}</span><span className="s">{T.fretes} fretes · receita {brlCurto(T.receitaFretes)}</span></div>
      </div>

      <div className="grid">
        <Painel titulo="Custos por mês" span={8}>
          <div className="chart">
            <ResponsiveContainer>
              <BarChart data={R.meses} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} /><XAxis dataKey="rotulo" tickLine={false} axisLine={false} /><YAxis tickFormatter={eixo} tickLine={false} axisLine={false} width={56} />
                <Tooltip formatter={(v, n) => [brl(v), n]} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar isAnimationActive={false} dataKey="combustivel" name="Combustível" stackId="a" fill="var(--c2)" />
                <Bar isAnimationActive={false} dataKey="manutencao" name="Manutenção" stackId="a" fill="var(--accent)" />
                <Bar isAnimationActive={false} dataKey="pneus" name="Pneus" stackId="a" fill="var(--c4)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legenda itens={[['Manutenção', 'var(--accent)'], ['Combustível', 'var(--c2)'], ['Pneus', 'var(--c4)']]} />
        </Painel>
        <Painel titulo="Ordens de serviço por tipo" span={4}>
          {R.osPorTipo.length ? <Pizza dados={R.osPorTipo} valor="quantidade" formato={(v) => `${v} OS`} /> : <Vazio />}
        </Painel>

        <Painel titulo="Custo por veículo" span={12} exportar={() => baixarCsv('custo-por-veiculo', ['Placa', 'Veículo', 'OS', 'Manutenção', 'Combustível', 'Pneus', 'Total', 'Km', 'Custo/km', 'Litros', 'Consumo km/l'],
          R.porVeiculo.map((v) => [v.placa, v.veiculo, v.os, v.manutencao.toFixed(2), v.combustivel.toFixed(2), v.pneus.toFixed(2), v.total.toFixed(2), v.km, v.custoKm?.toFixed(2) ?? '', v.litros.toFixed(1), v.consumo?.toFixed(1) ?? '']))}>
          <Tabela
            cab={['Veículo', 'OS', 'Manutenção', 'Combustível', 'Pneus', 'Total', 'Km rodados', 'Custo/km', 'Consumo']}
            linhas={R.porVeiculo.map((v) => [<span className="vcell" key="v"><Placa placa={v.placa} /><span>{v.veiculo}</span></span>, v.os, brl(v.manutencao), brl(v.combustivel), brl(v.pneus), <strong key="t">{brl(v.total)}</strong>, num(v.km), v.custoKm ? brl(v.custoKm) : '—', v.consumo ? `${num(v.consumo, 1)} km/l` : '—'])}
            rodape={['Total', T.os, brl(T.manutencao), brl(T.combustivel), brl(T.pneus), brl(custoTotal), num(T.km), T.km ? brl(custoTotal / T.km) : '—', '']}
          />
        </Painel>

        <Painel titulo="Consumo médio por veículo" span={6}>
          {consumo.length ? (
            <div className="chart">
              <ResponsiveContainer>
                <BarChart data={consumo} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid horizontal={false} /><XAxis type="number" tickLine={false} axisLine={false} /><YAxis type="category" dataKey="placa" tickLine={false} axisLine={false} width={70} />
                  <Tooltip formatter={(v) => [`${num(v, 1)} km/l`, 'Consumo']} cursor={{ fill: 'var(--surface-2)' }} />
                  <Bar isAnimationActive={false} dataKey="consumo" fill="var(--accent)" radius={[0, 3, 3, 0]} label={{ position: 'right', fill: 'var(--ink)', fontSize: 11, formatter: (v) => num(v, 1) }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <Vazio texto="Registre ao menos dois abastecimentos do mesmo veículo para calcular o consumo." />}
        </Painel>
        <Painel titulo="Combustível por tipo" span={6}>
          <Tabela cab={['Combustível', 'Litros', 'Valor', 'R$/litro']} linhas={R.combustivelPorTipo.map((c) => [c.nome, num(c.litros, 1), brl(c.valor), c.litros ? brl(c.valor / c.litros) : '—'])} />
        </Painel>

        <Painel titulo="Oficinas e fornecedores" span={7}>
          <Tabela cab={['Oficina', 'OS', 'Previsto', 'Realizado', 'Diferença', 'Dias médios']}
            linhas={R.oficinas.map((o) => [o.nome, o.os, o.previsto ? brl(o.previsto) : '—', brl(o.valor), o.previsto ? <span key="d" className={o.valor > o.previsto ? 'txt-bad' : 'txt-ok'}>{brl(o.valor - o.previsto)}</span> : '—', o.diasMedios != null ? num(o.diasMedios, 1) : '—'])} />
        </Painel>
        <Painel titulo="Corretivas por prioridade" span={5}>
          {R.osPorPrioridade.length ? <Pizza dados={R.osPorPrioridade} valor="quantidade" formato={(v) => `${v} OS`} /> : <Vazio />}
        </Painel>

        <Painel titulo="Fretes: receita e lucro por mês" span={8}>
          <div className="chart">
            <ResponsiveContainer>
              <ComposedChart data={R.meses} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} /><XAxis dataKey="rotulo" tickLine={false} axisLine={false} /><YAxis tickFormatter={eixo} tickLine={false} axisLine={false} width={56} />
                <Tooltip formatter={(v, n) => [brl(v), n]} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar isAnimationActive={false} dataKey="receitaFretes" name="Receita" fill="var(--c2)" radius={[3, 3, 0, 0]} />
                <Line isAnimationActive={false} dataKey="lucroFretes" name="Lucro" stroke="var(--ok)" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <Legenda itens={[['Receita', 'var(--c2)'], ['Lucro', 'var(--ok)']]} />
        </Painel>
        <Painel titulo="Fretes por cliente" span={4}>
          <Tabela cab={['Cliente', 'Fretes', 'Receita', 'Lucro']} linhas={R.fretesPorCliente.map((c) => [c.nome, c.fretes, brl(c.receita), brl(c.lucro)])} />
        </Painel>

        <Painel titulo="Entregas por situação" span={5}>
          {R.entregasPorStatus.length ? <Pizza dados={R.entregasPorStatus} valor="quantidade" formato={(v) => `${v} entregas`} /> : <Vazio />}
        </Painel>
        <Painel titulo="Entregas por motorista" span={7}>
          <Tabela cab={['Motorista', 'Entregas', 'No prazo', 'Km rodados']} linhas={R.entregasPorMotorista.map((m) => [m.nome, m.quantidade, `${m.noPrazo} (${m.quantidade ? Math.round((m.noPrazo / m.quantidade) * 100) : 0}%)`, num(m.km)])} />
        </Painel>

        <Painel titulo="Pneus" span={7}>
          <Tabela cab={['Pneu', 'Marca', 'Km rodados', 'Recapagens', 'Custo total', 'Custo/1.000 km']}
            linhas={R.pneus.slice(0, 12).map((p) => [<strong key="c" className="mono">{p.codigo}</strong>, p.marca, num(p.km), p.recapagens, brl(p.custo), p.custoKm ? brl(p.custoKm * 1000) : '—'])} />
        </Painel>
        <Painel titulo="Pneus por situação" span={5}>
          {R.pneusPorStatus.length ? <Pizza dados={R.pneusPorStatus} valor="quantidade" formato={(v) => `${v} pneus`} /> : <Vazio />}
          <p className="sub" style={{ marginTop: 8 }}>Checklists no período: {R.inspecoes.total} ({R.inspecoes.conformes} conformes, {R.inspecoes.itensNaoConformes} itens não conformes)</p>
        </Painel>

        <Painel titulo="Lançamentos por categoria" span={12}>
          {R.lancamentos.despesas.length || R.lancamentos.receitas.length ? (
            <div className="chart">
              <ResponsiveContainer>
                <BarChart data={[...R.lancamentos.receitas.map((x) => ({ ...x, tipo: 'Receita' })), ...R.lancamentos.despesas.map((x) => ({ ...x, tipo: 'Despesa' }))]} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} /><XAxis dataKey="nome" tickLine={false} axisLine={false} interval={0} fontSize={11} /><YAxis tickFormatter={eixo} tickLine={false} axisLine={false} width={56} />
                  <Tooltip formatter={(v) => [brl(v), 'Valor']} cursor={{ fill: 'var(--surface-2)' }} />
                  <Bar isAnimationActive={false} dataKey="valor" radius={[3, 3, 0, 0]}>
                    {[...R.lancamentos.receitas, ...R.lancamentos.despesas].map((x, i) => <Cell key={i} fill={i < R.lancamentos.receitas.length ? 'var(--ok)' : 'var(--c2)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <Vazio />}
        </Painel>
      </div>
    </>
  );
}

function Painel({ titulo, span, exportar, children }) {
  return (
    <div className={`panel span-${span}`}>
      <div className="panel-h"><h2>{titulo}</h2>{exportar ? <button className="link" onClick={exportar}><IconeBaixar /> Exportar</button> : null}</div>
      {children}
    </div>
  );
}
const Vazio = ({ texto = 'Sem dados no período.' }) => <p className="sub">{texto}</p>;
const Legenda = ({ itens }) => <div className="legend" style={{ marginTop: 8 }}>{itens.map(([n, c]) => <span key={n}><span className="dot" style={{ background: c }} />{n}</span>)}</div>;

function Tabela({ cab, linhas, rodape }) {
  if (!linhas.length) return <Vazio />;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="t" style={{ minWidth: 0 }}>
        <thead><tr>{cab.map((c, i) => <th key={c} className={i ? 'num' : ''}>{c}</th>)}</tr></thead>
        <tbody>{linhas.map((l, i) => <tr key={i}>{l.map((c, j) => <td key={j} className={j ? 'num' : ''}>{c}</td>)}</tr>)}</tbody>
        {rodape ? <tfoot><tr>{rodape.map((c, j) => <td key={j} className={j ? 'num' : ''}>{c}</td>)}</tr></tfoot> : null}
      </table>
    </div>
  );
}

function Pizza({ dados, valor, formato }) {
  const total = dados.reduce((s, d) => s + d[valor], 0);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12, alignItems: 'center' }}>
      <div className="chart" style={{ height: 200 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie isAnimationActive={false} data={dados} dataKey={valor} nameKey="nome" innerRadius="55%" outerRadius="90%" paddingAngle={2} stroke="none">
              {dados.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [formato(v), n]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="legend" style={{ flexDirection: 'column', gap: 8 }}>
        {dados.map((d, i) => <span key={d.nome}><span className="dot" style={{ background: CORES[i % CORES.length] }} />{d.nome}<b>{d[valor]}</b> <span className="sub" style={{ display: 'inline' }}>({Math.round((d[valor] / total) * 100)}%)</span></span>)}
      </div>
    </div>
  );
}
