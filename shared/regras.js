// Regras de negocio compartilhadas entre o servidor (Node) e a interface (React).
// Funcoes puras: nada aqui acessa banco ou tela.

export const VEICULO_STATUS = ['Disponível', 'Em uso', 'Manutenção', 'Inativo'];
export const OS_STATUS = ['Agendada', 'Aberta', 'Em execução', 'Aguardando peças', 'Concluída', 'Cancelada'];
export const OS_ABERTAS = ['Aberta', 'Em execução', 'Aguardando peças'];
export const OS_PENDENTES = ['Agendada', ...OS_ABERTAS];
export const OS_TIPOS = ['Corretiva', 'Preventiva', 'Preditiva', 'Sinistro'];
export const PRIORIDADES = ['Alta', 'Média', 'Baixa'];
export const PNEU_STATUS = ['Em uso', 'Estoque', 'Recapagem', 'Descartado'];
export const PNEU_POSICOES = ['Dianteiro esquerdo', 'Dianteiro direito', 'Traseiro esquerdo externo', 'Traseiro esquerdo interno', 'Traseiro direito externo', 'Traseiro direito interno', 'Traseiro esquerdo', 'Traseiro direito', 'Estepe'];
export const CHECKLIST_PNEUS = [
  'Calibragem conforme o fabricante',
  'Sulco acima do mínimo legal (1,6 mm)',
  'Sem desgaste irregular',
  'Sem cortes, bolhas ou deformações',
  'Válvulas e tampas presentes',
  'Porcas e parafusos de roda apertados',
  'Estepe em condições de uso',
  'Sem vibração ou puxando para um lado',
];
export const ENTREGA_STATUS = ['Programada', 'Em andamento', 'Realizada', 'Realizada com atraso', 'Não realizada'];
export const PEDIDO_STATUS = ['Pendente', 'Em transporte', 'Entregue', 'Entregue com atraso', 'Não entregue'];
export const FRETE_STATUS = ['Pendente', 'Em andamento', 'Concluída', 'Cancelada'];
export const CATEGORIAS_DESPESA = ['Administração', 'Manutenção', 'Combustível', 'Terceiros', 'Seguros', 'Consórcios', 'Impostos e taxas', 'Multas', 'Salários', 'Pedágios', 'Outros'];
export const CATEGORIAS_RECEITA = ['Fretes', 'Entregas', 'Locação', 'Outras receitas'];
export const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

// ---------- datas (texto AAAA-MM-DD, sem fuso) ----------
const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const isoDateTime = (d = new Date()) => `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const hoje = () => isoDate();
export const parseData = (s) => { if (!s) return null; const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
export const somarDias = (s, n) => { const d = parseData(s); d.setDate(d.getDate() + n); return isoDate(d); };
export const diasAte = (s, base = hoje()) => Math.round((parseData(s) - parseData(base)) / 864e5);
export const mesDe = (s) => (s ? s.slice(0, 7) : '');

// ---------- placa ----------
export const normalizarPlaca = (p) => String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const placaValida = (p) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(normalizarPlaca(p));

// ---------- ordens de servico ----------
export const totalItens = (itens) => (itens || []).reduce((s, i) => s + (Number(i.qtd) || 0) * (Number(i.valor) || 0), 0);
export const numeroOS = (n) => 'OS-' + String(n || 0).padStart(4, '0');
export const custoOS = (os) => totalItens(os.itens);

// ---------- manutencao preventiva ----------
// Situacao de um plano: Vencida, Proxima (ate 15 dias ou 1.000 km), Em OS ou Em dia.
export function situacaoPlano(plano, veiculo, ordens = [], base = hoje()) {
  let proxData = null, proxKm = null, dLeft = null, kLeft = null;
  if (plano.intervaloDias && plano.ultimaData) { proxData = somarDias(plano.ultimaData, Number(plano.intervaloDias)); dLeft = diasAte(proxData, base); }
  if (plano.intervaloKm && plano.ultimaKm != null) { proxKm = Number(plano.ultimaKm) + Number(plano.intervaloKm); kLeft = proxKm - (Number(veiculo?.km) || 0); }
  let tom = 'ok', rotulo = 'Em dia';
  if ((dLeft != null && dLeft < 0) || (kLeft != null && kLeft <= 0)) { tom = 'bad'; rotulo = 'Vencida'; }
  else if ((dLeft != null && dLeft <= 15) || (kLeft != null && kLeft <= 1000)) { tom = 'warn'; rotulo = 'Próxima'; }
  const partes = [];
  if (dLeft != null) partes.push(dLeft < 0 ? `vencida há ${-dLeft} dias` : dLeft === 0 ? 'vence hoje' : `em ${dLeft} dias`);
  if (kLeft != null) partes.push(kLeft <= 0 ? `${(-kLeft).toLocaleString('pt-BR')} km excedidos` : `faltam ${kLeft.toLocaleString('pt-BR')} km`);
  const os = ordens.find((o) => o.planoId === plano.id && OS_PENDENTES.includes(o.status));
  if (os) { tom = 'info'; rotulo = 'Em OS'; }
  return { proxData, proxKm, dLeft, kLeft, tom, rotulo, dica: partes.join(' · '), os };
}

// ---------- abastecimento ----------
export function consumoKmL(abast, todos) {
  const anterior = todos
    .filter((x) => x.veiculoId === abast.veiculoId && Number(x.km) < Number(abast.km))
    .sort((a, b) => b.km - a.km)[0];
  if (!anterior || !abast.litros) return null;
  return (Number(abast.km) - Number(anterior.km)) / Number(abast.litros);
}

// ---------- pneus ----------
export function kmRodadoPneu(pneu, veiculo) {
  const atual = pneu.status === 'Em uso' && veiculo && pneu.kmInstalacao != null ? Math.max(0, (veiculo.km || 0) - pneu.kmInstalacao) : 0;
  return (pneu.kmAcumulado || 0) + atual;
}
export function situacaoSulco(pneu) {
  if (pneu.sulcoAtual == null) return { tom: 'mute', rotulo: 'Sem medição' };
  if (pneu.sulcoAtual <= 1.6) return { tom: 'bad', rotulo: 'Abaixo do mínimo' };
  if (pneu.sulcoAtual <= 3) return { tom: 'warn', rotulo: 'Trocar em breve' };
  return { tom: 'ok', rotulo: 'Bom' };
}

// ---------- fretes ----------
export const lucroFrete = (f) => (Number(f.valorFrete) || 0) - (Number(f.despCombustivel) || 0) - (Number(f.despPedagio) || 0) - (Number(f.despOutras) || 0);

// ---------- vencimentos (CNH, licenciamento, seguro) ----------
export function vencimento(s, avisoDias = 30, base = hoje()) {
  if (!s) return null;
  const d = diasAte(s, base);
  return { dias: d, tom: d < 0 ? 'bad' : d <= avisoDias ? 'warn' : 'ok', texto: d < 0 ? `vencido há ${-d} dias` : d === 0 ? 'vence hoje' : `em ${d} dias` };
}
