import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useApoio } from '../lib/dados.js';
import { brl, brlCurto, num, fdt } from '../lib/format.js';
import { Cabecalho, Pill, VeiculoCel, IconeMais } from '../components/ui.jsx';
import FormModal from '../components/FormModal.jsx';
import * as E from '../entidades.jsx';

export default function Painel() {
  const { data: P, error } = useQuery({ queryKey: ['painel'], queryFn: () => api('/painel') });
  const L = useApoio();
  const ir = useNavigate();
  const { pode } = useAuth();
  const [form, setForm] = useState(null);
  const hojeTxt = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const acoes = (
    <>
      <button className="btn" onClick={() => setForm({ ent: E.movimentos, preset: { tipo: 'Saída' } })}>Registrar saída</button>
      {pode(['ADMIN', 'GESTOR']) ? <button className="btn primary" onClick={() => setForm({ ent: E.ordens })}><IconeMais />Nova OS</button> : null}
    </>
  );
  if (error) return <><Cabecalho sobre="Visão geral" titulo="Painel da frota" /><div className="panel">Não foi possível carregar o painel: {error.message}</div></>;
  if (!P) return <><Cabecalho sobre="Visão geral" titulo="Painel da frota" /><div className="empty"><strong>Carregando…</strong></div></>;

  const segs = [['Disponível', 'disponivel', 'var(--ok)'], ['Em uso', 'emUso', 'var(--accent)'], ['Manutenção', 'manutencao', 'var(--warn)']];
  const tot = P.frota.total || 1;
  const tomVar = { bad: 'var(--bad)', warn: 'var(--warn)' };

  return (
    <>
      <Cabecalho sobre={`Visão geral · ${hojeTxt}`} titulo="Painel da frota">{acoes}</Cabecalho>
      <div className="grid">
        <div className="panel span-7">
          <div className="panel-h"><h2>Situação da frota</h2><Link to="/veiculos">Ver veículos</Link></div>
          <div className="fleet-row">
            <div><div className="fleet-n mono">{P.frota.total}</div><span className="sub">veículos ativos</span></div>
            <div className="legend">{segs.map(([n, k, c]) => <span key={k}><span className="dot" style={{ background: c }} />{n}<b>{P.frota[k]}</b></span>)}</div>
          </div>
          <div className="statbar" role="img" aria-label={segs.map(([n, k]) => `${n}: ${P.frota[k]}`).join(', ')}>
            {segs.map(([, k, c]) => <span key={k} style={{ width: `${(P.frota[k] / tot) * 100}%`, background: c }} />)}
          </div>
          <span className="sub">{P.frota.emUso ? `${P.frota.emUso} em rota agora · ` : ''}{num(P.frota.kmTotal)} km somados nos hodômetros</span>
        </div>
        <div className="panel span-5">
          <div className="kpis">
            <div className="kpi"><span className="l">OS em aberto</span><span className="v">{P.os.abertas}</span><span className="s">{brl(P.os.valor)} · {P.os.agendadas} agendada{P.os.agendadas === 1 ? '' : 's'}</span></div>
            <div className="kpi"><span className="l">Alertas</span><span className={`v ${P.alertas.some((a) => a.tom === 'bad') ? 'txt-bad' : ''}`}>{P.alertas.length}</span><span className="s">{P.alertas.filter((a) => a.tom === 'bad').length} vencidos</span></div>
            <div className="kpi"><span className="l">Manutenção no mês</span><span className="v">{brlCurto(P.custos.manutencao + P.custos.pneus)}</span><span className="s">OS {brlCurto(P.custos.manutencao)} · pneus {brlCurto(P.custos.pneus)}</span></div>
            <div className="kpi"><span className="l">Combustível no mês</span><span className="v">{brlCurto(P.custos.combustivel)}</span><span className="s">{num(P.custos.litros)} litros</span></div>
          </div>
        </div>

        <div className="panel span-7">
          <div className="panel-h"><h2>Atenção</h2><span className="count">{P.alertas.length} {P.alertas.length === 1 ? 'item' : 'itens'}</span></div>
          {P.alertas.length ? (
            <ul className="alerts">
              {P.alertas.slice(0, 9).map((a, i) => (
                <li key={i} tabIndex={0} onClick={() => ir(a.ir)} onKeyDown={(e) => e.key === 'Enter' && ir(a.ir)}>
                  <span className="sev" style={{ background: tomVar[a.tom] }} />
                  <span><span className="t">{a.titulo}</span><span className="d">{a.detalhe}</span></span>
                  <Pill tom={a.tom}>{a.tom === 'bad' ? 'Vencido' : 'Atenção'}</Pill>
                </li>
              ))}
            </ul>
          ) : <p className="sub">Nada vencendo nos próximos 30 dias. Manutenções, CNHs, documentos e contas em dia.</p>}
          {P.alertas.length > 9 ? <p className="sub">e mais {P.alertas.length - 9}.</p> : null}
        </div>

        <div className="panel span-5">
          <div className="panel-h"><h2>Custos dos últimos 6 meses</h2><Link to="/relatorios">Relatórios</Link></div>
          <div className="chart">
            <ResponsiveContainer>
              <BarChart data={P.meses} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="rotulo" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => (v >= 1000 ? `${num(v / 1000)} mil` : num(v))} tickLine={false} axisLine={false} width={52} />
                <Tooltip formatter={(v, n) => [brl(v), n]} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar isAnimationActive={false} dataKey="combustivel" name="Combustível" stackId="a" fill="var(--c2)" />
                <Bar isAnimationActive={false} dataKey="manutencao" name="Manutenção" stackId="a" fill="var(--accent)" />
                <Bar isAnimationActive={false} dataKey="pneus" name="Pneus" stackId="a" fill="var(--c4)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="legend" style={{ marginTop: 8 }}>
            <span><span className="dot" style={{ background: 'var(--accent)' }} />Manutenção</span>
            <span><span className="dot" style={{ background: 'var(--c2)' }} />Combustível</span>
            <span><span className="dot" style={{ background: 'var(--c4)' }} />Pneus</span>
          </div>
        </div>

        <div className="panel span-4">
          <div className="panel-h"><h2>Entregas no mês</h2><Link to="/entregas">Ver entregas</Link></div>
          <div className="kpis">
            <div className="kpi"><span className="l">Realizadas</span><span className="v">{P.entregas.realizadas}<span className="sub" style={{ display: 'inline', fontSize: 15 }}> / {P.entregas.mes}</span></span></div>
            <div className="kpi"><span className="l">No prazo</span><span className="v">{P.entregas.realizadas ? Math.round((P.entregas.noPrazo / P.entregas.realizadas) * 100) : 0}%</span></div>
          </div>
          <p className="sub" style={{ marginTop: 12 }}>{P.entregas.emAndamento} entrega{P.entregas.emAndamento === 1 ? '' : 's'} em andamento agora</p>
        </div>
        <div className="panel span-4">
          <div className="panel-h"><h2>Fretes no mês</h2><Link to="/fretes">Ver fretes</Link></div>
          <div className="kpis">
            <div className="kpi"><span className="l">Receita</span><span className="v">{brlCurto(P.fretes.receita)}</span></div>
            <div className="kpi"><span className="l">Lucro</span><span className={`v ${P.fretes.lucro < 0 ? 'txt-bad' : 'txt-ok'}`}>{brlCurto(P.fretes.lucro)}</span></div>
          </div>
          <p className="sub" style={{ marginTop: 12 }}>{P.fretes.mes} frete{P.fretes.mes === 1 ? '' : 's'} no mês</p>
        </div>
        <div className="panel span-4">
          <div className="panel-h"><h2>Ordens de serviço</h2><Link to="/ordens">Ver OS</Link></div>
          <div className="kpis">
            <div className="kpi"><span className="l">Pendentes</span><span className="v">{P.os.pendentes}</span></div>
            <div className="kpi"><span className="l">Orçado em aberto</span><span className="v">{brlCurto(P.os.valor)}</span></div>
          </div>
          <p className="sub" style={{ marginTop: 12 }}>Abertas, em execução, aguardando peças e agendadas</p>
        </div>

        <div className="panel span-12">
          <div className="panel-h"><h2>Últimas movimentações</h2><Link to="/movimentos">Ver todas</Link></div>
          {P.movimentos.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="t" style={{ minWidth: 640 }}>
                <tbody>
                  {P.movimentos.map((m) => (
                    <tr key={m.id}>
                      <td><span className={`dir ${m.tipo === 'Saída' ? 'txt-warn' : 'txt-ok'}`}>{m.tipo === 'Saída' ? '↗ Saída' : '↙ Entrada'}</span></td>
                      <td className="nw">{fdt(m.dataHora)}</td>
                      <td><VeiculoCel v={L.veiculosPorId[m.veiculoId]} ano={false} /></td>
                      <td>{L.motoristasPorId[m.motoristaId]?.nome}</td>
                      <td className="num">{num(m.km)} km</td>
                      <td>{m.destino}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="sub">Nenhuma movimentação registrada. Use “Registrar saída” quando um veículo deixar o pátio.</p>}
        </div>
      </div>
      {form ? <FormModal ent={form.ent} preset={form.preset} L={L} onFechar={() => setForm(null)} /> : null}
    </>
  );
}
