import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';

export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro(''); setEnviando(true);
    try { await entrar(email, senha); } catch (ex) { setErro(ex.message); setEnviando(false); }
  }

  return (
    <div className="login">
      <section className="login-art">
        <div>
          <h1>Gestão de<br /><span>Frotas</span></h1>
          <p>Veículos, motoristas, portaria, manutenções, pneus, entregas, fretes e financeiro em um único sistema.</p>
        </div>
        <span className="eyebrow" style={{ color: 'var(--nav-ink)' }}>LocalizaCar · Rastreamento veicular</span>
      </section>
      <section className="login-box">
        <form onSubmit={enviar}>
          <span className="brand"><img src="/logo.png" alt="LocalizaCar" /></span>
          <h2 style={{ fontSize: 28 }}>Entrar no sistema</h2>
          {erro ? <div className="form-err" role="alert">{erro}</div> : null}
          <div className="f"><label htmlFor="email">E-mail</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></div>
          <div className="f"><label htmlFor="senha">Senha</label><input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required /></div>
          <button className="btn primary" style={{ justifyContent: 'center', padding: '10px 14px' }} disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
          <div className="demo-users">
            Acessos iniciais (senha <code>localizacar</code>):<br />
            <code>admin@localizacar.com.br</code> · administrador<br />
            <code>gestor@localizacar.com.br</code> · gestor de frota<br />
            <code>portaria@localizacar.com.br</code> · operador
          </div>
        </form>
      </section>
    </div>
  );
}
