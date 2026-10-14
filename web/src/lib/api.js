const CHAVE = 'localizacar:sessao';

export function lerSessao() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || null; } catch { return null; }
}
export function gravarSessao(s) {
  try { s ? localStorage.setItem(CHAVE, JSON.stringify(s)) : localStorage.removeItem(CHAVE); } catch { /* sem armazenamento */ }
}

export class ErroApi extends Error {
  constructor(status, corpo) {
    super(corpo?.erro || 'Não foi possível concluir a operação.');
    this.status = status;
    this.campo = corpo?.campo;
  }
}

let aoExpirar = () => {};
export const definirAoExpirar = (fn) => { aoExpirar = fn; };

export async function api(caminho, { method = 'GET', body } = {}) {
  const sessao = lerSessao();
  let resp;
  try {
    resp = await fetch('/api' + caminho, {
      method,
      headers: { 'Content-Type': 'application/json', ...(sessao?.token ? { Authorization: `Bearer ${sessao.token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ErroApi(0, { erro: 'Sem conexão com o servidor. Verifique se a API está rodando.' });
  }
  if (resp.status === 204) return null;
  const corpo = await resp.json().catch(() => null);
  if (resp.status === 401 && caminho !== '/auth/login') aoExpirar();
  if (!resp.ok) throw new ErroApi(resp.status, corpo);
  return corpo;
}
