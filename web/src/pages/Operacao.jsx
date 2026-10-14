import { useEffect, useState } from 'react';
import ListPage from '../components/ListPage.jsx';
import FormModal from '../components/FormModal.jsx';
import { Abas, Placa } from '../components/ui.jsx';
import { useApoio } from '../lib/dados.js';
import { useAuth } from '../lib/auth.jsx';
import { fdt, num } from '../lib/format.js';
import * as E from '../entidades.jsx';

export function Movimentos() {
  return (
    <ListPage
      ent={E.movimentos}
      acoesExtras={(abrir, pode) => (pode ? <button className="btn" onClick={() => abrir(null, { tipo: 'Entrada' })}>Registrar entrada</button> : null)}
      antes={(L, abrir, pode) => {
        const fora = L.veiculos.filter((v) => v.status === 'Em uso').map((v) => ({
          v, s: L.movimentos.filter((m) => m.veiculoId === v.id && m.tipo === 'Saída').sort((a, b) => b.dataHora.localeCompare(a.dataHora))[0],
        }));
        return (
          <>
            <div className="sec-h"><h2>Veículos fora do pátio</h2><span className="count">{fora.length}</span></div>
            {fora.length ? (
              <div className="out-grid">
                {fora.map(({ v, s }) => (
                  <div className="out-card" key={v.id}>
                    <div className="vcell"><Placa placa={v.placa} /><span><strong>{v.marca} {v.modelo}</strong><span className="sub">{L.motoristasPorId[v.motoristaAtualId]?.nome}</span></span></div>
                    <div className="meta">Saiu em <b>{s ? fdt(s.dataHora) : '—'}</b>{s?.destino ? ` · ${s.destino}` : ''}<br />Hodômetro na saída <b className="mono">{num(s?.km ?? v.km)} km</b></div>
                    {pode ? <button className="btn sm" onClick={() => abrir(null, { tipo: 'Entrada', veiculoId: v.id, motoristaId: v.motoristaAtualId, km: v.km })}>Registrar entrada</button> : null}
                  </div>
                ))}
              </div>
            ) : <div className="panel" style={{ marginBottom: 22 }}><span className="sub">Todos os veículos estão no pátio ou em manutenção.</span></div>}
            <div className="sec-h"><h2>Histórico</h2></div>
          </>
        );
      }}
    />
  );
}

export function Manutencoes() {
  const L = useApoio();
  const { pode } = useAuth();
  const [plano, setPlano] = useState(null);
  useEffect(() => {
    const h = (e) => setPlano(e.detail);
    window.addEventListener('abrir-os-plano', h);
    return () => window.removeEventListener('abrir-os-plano', h);
  }, []);
  return (
    <>
      <ListPage ent={E.manutencoes} />
      {plano && pode(['ADMIN', 'GESTOR']) ? (
        <FormModal ent={E.ordens} L={L} onFechar={() => setPlano(null)}
          preset={{ veiculoId: plano.veiculoId, tipo: 'Preventiva', descricao: plano.servico, planoId: plano.id, km: L.veiculosPorId[plano.veiculoId]?.km }} />
      ) : null}
    </>
  );
}

const ABAS_PNEUS = [['/pneus', 'Pneus'], ['/pneus/servicos', 'Serviços'], ['/pneus/checklist', 'Checklist']];
export const Pneus = () => <ListPage ent={E.pneus} abas={<Abas itens={ABAS_PNEUS} />} />;
export const ServicosPneu = () => <ListPage ent={{ ...E.servicosPneu, titulo: 'Pneus', sobre: 'Recapagens, consertos e rodízios' }} abas={<Abas itens={ABAS_PNEUS} />} />;
export const Inspecoes = () => <ListPage ent={{ ...E.inspecoes, titulo: 'Pneus', sobre: 'Checklist de inspeção' }} abas={<Abas itens={ABAS_PNEUS} />} />;

const ABAS_ENTREGAS = [['/entregas', 'Entregas'], ['/entregas/pedidos', 'Pedidos']];
export const Entregas = () => <ListPage ent={E.entregas} abas={<Abas itens={ABAS_ENTREGAS} />} />;
export const Pedidos = () => <ListPage ent={{ ...E.pedidos, titulo: 'Entregas', sobre: 'Pedidos dos clientes' }} abas={<Abas itens={ABAS_ENTREGAS} />} />;

export const Ordens = () => <ListPage ent={E.ordens} />;
export const Abastecimentos = () => <ListPage ent={E.abastecimentos} />;
export const Fretes = () => <ListPage ent={E.fretes} />;
export const Veiculos = () => <ListPage ent={E.veiculos} />;
export const Motoristas = () => <ListPage ent={E.motoristas} />;
export const Clientes = () => <ListPage ent={E.clientes} />;
export const Fornecedores = () => <ListPage ent={E.fornecedores} />;
export const Usuarios = () => <ListPage ent={E.usuarios} />;
