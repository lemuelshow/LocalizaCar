import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { OS_ABERTAS, situacaoPlano } from '@localizacar/shared';
import { useAuth, PERFIS } from '../lib/auth.jsx';
import { useApoio } from '../lib/dados.js';
import { api } from '../lib/api.js';
import { Modal, ModalTopo, useAviso } from './ui.jsx';

const IC = {
  painel: <path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z" />,
  movimentos: <path d="M7 7h10l-3-3M17 17H7l3 3" />,
  ordens: <path d="M9 4h6v3H9zM7 5H5v16h14V5h-2M8 12h8M8 16h5" />,
  manutencoes: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />,
  abastecimentos: <path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M6 9h6M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3" />,
  pneus: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21" /></>,
  entregas: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  fretes: <path d="M3 17V6h11v11M14 9h4l3 4v4h-3M3 17h2M9 17h6M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  financeiro: <path d="M12 3v18M17 7.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 2.8 5 3.5 5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3" />,
  relatorios: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  veiculos: <path d="M5 16h14M5 16v3M19 16v3M3 12l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v4H3zM7 13h.01M17 13h.01" />,
  motoristas: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  clientes: <path d="M3 21V8l9-5 9 5v13M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01" />,
  fornecedores: <path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6" />,
  usuarios: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>,
};

const MENU = [
  ['painel', 'Painel'],
  ['sep', 'Operação'], ['movimentos', 'Entradas e saídas'], ['ordens', 'Ordens de serviço'], ['manutencoes', 'Manutenções'], ['abastecimentos', 'Abastecimentos'], ['pneus', 'Pneus'], ['entregas', 'Entregas'], ['fretes', 'Fretes'],
  ['sep', 'Gestão'], ['financeiro', 'Financeiro'], ['relatorios', 'Relatórios'],
  ['sep', 'Cadastros'], ['veiculos', 'Veículos'], ['motoristas', 'Motoristas'], ['clientes', 'Clientes'], ['fornecedores', 'Fornecedores'], ['usuarios', 'Usuários', ['ADMIN']],
];

export default function Layout() {
  const { usuario, sair, pode } = useAuth();
  const L = useApoio();
  const [trocarSenha, setTrocarSenha] = useState(false);
  const badge = {
    ordens: L.ordens.filter((o) => OS_ABERTAS.includes(o.status)).length,
    manutencoes: L.manutencoes.filter((p) => situacaoPlano(p, L.veiculosPorId[p.veiculoId], L.ordens).tom === 'bad').length,
  };
  return (
    <div className="app">
      <aside className="side">
        <NavLink className="brand" to="/" aria-label="LocalizaCar, ir para o painel"><img src="/logo.png" alt="LocalizaCar Rastreamento Veicular" width="194" height="56" /></NavLink>
        <nav className="nav" aria-label="Menu principal">
          {MENU.map(([k, rotulo, perfis], i) => {
            if (k === 'sep') return <div key={i} className="nav-sep">{rotulo}</div>;
            if (perfis && !pode(perfis)) return null;
            return (
              <NavLink key={k} to={k === 'painel' ? '/' : '/' + k} end={k === 'painel'}>
                <svg viewBox="0 0 24 24" aria-hidden="true">{IC[k]}</svg><span>{rotulo}</span>
                {badge[k] ? <span className="badge" title={k === 'ordens' ? 'OS em aberto' : 'Manutenções vencidas'}>{badge[k]}</span> : null}
              </NavLink>
            );
          })}
        </nav>
        <div className="side-foot">
          <span><strong>{usuario?.nome}</strong><br />{PERFIS[usuario?.perfil]}</span>
          <div className="row"><button onClick={() => setTrocarSenha(true)}>Trocar senha</button><button onClick={sair}>Sair</button></div>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
      {trocarSenha ? <TrocarSenha onFechar={() => setTrocarSenha(false)} /> : null}
    </div>
  );
}

function TrocarSenha({ onFechar }) {
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const avisar = useAviso();
  async function enviar(e) {
    e.preventDefault();
    setSalvando(true); setErro('');
    try { await api('/auth/senha', { method: 'PUT', body: { atual, nova } }); avisar('Senha alterada.'); onFechar(); }
    catch (ex) { setErro(ex.message); setSalvando(false); }
  }
  return (
    <Modal titulo="Trocar senha" onFechar={onFechar} pequeno>
      <form onSubmit={enviar}>
        <ModalTopo titulo="Trocar senha" onFechar={onFechar} />
        <div className="sheet-b" style={{ gridTemplateColumns: '1fr' }}>
          {erro ? <div className="form-err" role="alert">{erro}</div> : null}
          <div className="f"><label htmlFor="s_atual">Senha atual</label><input id="s_atual" type="password" value={atual} onChange={(e) => setAtual(e.target.value)} autoComplete="current-password" /></div>
          <div className="f"><label htmlFor="s_nova">Nova senha</label><input id="s_nova" type="password" value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" /><span className="hint">Mínimo de 6 caracteres</span></div>
        </div>
        <div className="sheet-f"><button type="button" className="btn" onClick={onFechar}>Cancelar</button><button className="btn primary" disabled={salvando}>Salvar senha</button></div>
      </form>
    </Modal>
  );
}
