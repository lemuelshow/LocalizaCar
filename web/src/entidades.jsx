// Configuracao das telas de cadastro: campos do formulario, colunas da tabela, busca e filtro.
import {
  VEICULO_STATUS, OS_STATUS, OS_ABERTAS, OS_TIPOS, PRIORIDADES, PNEU_STATUS, PNEU_POSICOES, CHECKLIST_PNEUS,
  ENTREGA_STATUS, PEDIDO_STATUS, FRETE_STATUS, CATEGORIAS_DESPESA, CATEGORIAS_RECEITA, UFS,
  hoje, diasAte, totalItens, numeroOS, situacaoPlano, consumoKmL, kmRodadoPneu, situacaoSulco, lucroFrete, vencimento, isoDateTime,
} from '@localizacar/shared';
import { Pill, VeiculoCel, Placa } from './components/ui.jsx';
import { brl, num, fd, fdt } from './lib/format.js';

export const TOM_VEICULO = { 'Disponível': 'ok', 'Em uso': 'info', 'Manutenção': 'warn', 'Inativo': 'mute' };
export const TOM_OS = { 'Agendada': 'mute', 'Aberta': 'info', 'Em execução': 'warn', 'Aguardando peças': 'warn', 'Concluída': 'ok', 'Cancelada': 'mute' };
const TOM_PNEU = { 'Em uso': 'info', 'Estoque': 'ok', 'Recapagem': 'warn', 'Descartado': 'mute' };
const TOM_ENTREGA = { 'Programada': 'mute', 'Em andamento': 'info', 'Realizada': 'ok', 'Realizada com atraso': 'warn', 'Não realizada': 'bad' };
const TOM_PEDIDO = { 'Pendente': 'mute', 'Em transporte': 'info', 'Entregue': 'ok', 'Entregue com atraso': 'warn', 'Não entregue': 'bad' };
const TOM_FRETE = { 'Pendente': 'mute', 'Em andamento': 'info', 'Concluída': 'ok', 'Cancelada': 'mute' };
const TOM_PRIORIDADE = { 'Alta': 'bad', 'Média': 'warn', 'Baixa': 'mute' };
const TODOS = ['ADMIN', 'GESTOR', 'OPERADOR'];
const COMBUSTIVEIS = ['Gasolina comum', 'Gasolina aditivada', 'Gasolina formulada', 'Etanol', 'Diesel S10', 'Diesel S500', 'GNV', 'Arla 32'];
const TIPOS_FORNECEDOR = ['Oficina mecânica', 'Posto de combustível', 'Autopeças', 'Borracharia', 'Funilaria e pintura', 'Concessionária', 'Outro'];

// ---------- auxiliares ----------
const nomeV = (v) => (v ? `${v.placa} ${v.marca} ${v.modelo}` : '');
const placaDe = (L, id) => L.veiculosPorId[id]?.placa || '';
const motorista = (L, id) => L.motoristasPorId[id]?.nome || '—';
const fornecedor = (L, id) => L.fornecedoresPorId[id]?.nome || '—';
const cliente = (L, id) => L.clientesPorId[id]?.nome || '—';
const vazio = <span className="sub">—</span>;
const vence = (s, aviso = 30) => {
  const v = vencimento(s, aviso);
  if (!v) return vazio;
  return <><span className="nw">{fd(s)}</span><span className={`sub ${v.tom === 'ok' ? '' : 'txt-' + v.tom}`}>{v.texto}</span></>;
};
const vCol = (k = 'veiculoId') => ({ l: 'Veículo', r: (x, L) => <VeiculoCel v={L.veiculosPorId[x[k]]} />, csv: (x, L) => placaDe(L, x[k]) });

const opVeiculos = (inclusiveInativos = false) => (L) => L.veiculos
  .filter((v) => inclusiveInativos || v.status !== 'Inativo')
  .sort((a, b) => a.placa.localeCompare(b.placa))
  .map((v) => [v.id, `${v.placa} · ${v.marca} ${v.modelo} (${v.status})`]);
const opMotoristas = (L) => L.motoristas.filter((m) => m.status === 'Ativo').sort((a, b) => a.nome.localeCompare(b.nome)).map((m) => [m.id, m.aptidao === 'Inapto' ? `${m.nome} (inapto)` : m.nome]);
const opFornecedores = (tipos) => (L) => L.fornecedores.filter((f) => !tipos || tipos.includes(f.tipo)).sort((a, b) => a.nome.localeCompare(b.nome)).map((f) => [f.id, `${f.nome} (${f.tipo})`]);
const opClientes = (L) => [...L.clientes].sort((a, b) => a.nome.localeCompare(b.nome)).map((c) => [c.id, c.nome]);

const kmDoVeiculo = (v, form, L) => { const x = L.veiculosPorId[v]; return x ? { ...form, km: x.km } : form; };

// ======================================================================
export const veiculos = {
  api: 'veiculos', titulo: 'Veículos', sobre: 'Cadastro da frota', um: 'veículo', novo: 'Novo veículo',
  nomeDe: (r) => r.placa,
  campos: [
    { k: 'placa', l: 'Placa', t: 'placa', obrig: true, dica: 'Mercosul (ABC1D23) ou antiga (ABC1234)' },
    { k: 'status', l: 'Situação', t: 'select', o: VEICULO_STATUS, padrao: 'Disponível' },
    { k: 'marca', l: 'Marca', obrig: true },
    { k: 'modelo', l: 'Modelo', obrig: true },
    { k: 'ano', l: 'Ano/modelo', t: 'numero' },
    { k: 'tipo', l: 'Tipo', t: 'select', o: ['Carro', 'Utilitário', 'Van', 'Caminhão', 'Ônibus', 'Moto', 'Máquina'] },
    { k: 'cor', l: 'Cor' },
    { k: 'combustivel', l: 'Combustível', t: 'select', o: ['Flex', 'Gasolina', 'Etanol', 'Diesel', 'GNV', 'Elétrico', 'Híbrido'] },
    { k: 'renavam', l: 'Renavam' },
    { k: 'chassi', l: 'Chassi' },
    { k: 'km', l: 'Hodômetro atual (km)', t: 'numero', padrao: 0 },
    { k: 'secao-doc', l: 'Documentação', t: 'secao' },
    { k: 'documentacao', l: 'Situação da documentação', t: 'select', o: ['OK', 'Pendente'], padrao: 'OK' },
    { k: 'licenciamento', l: 'Vencimento do licenciamento', t: 'data' },
    { k: 'seguro', l: 'Vencimento do seguro', t: 'data' },
    { k: 'obs', l: 'Observações', t: 'texto-longo', span: 1 },
  ],
  colunas: [
    { l: 'Veículo', r: (r) => <VeiculoCel v={r} />, csv: (r) => r.placa },
    { l: 'Modelo', r: (r) => <>{r.tipo || '—'}<span className="sub">{r.combustivel}</span></>, csv: (r) => `${r.marca} ${r.modelo} ${r.ano || ''}` },
    { l: 'Hodômetro', c: 'num', r: (r) => `${num(r.km)} km`, csv: (r) => r.km },
    { l: 'Licenciamento', r: (r) => vence(r.licenciamento), csv: (r) => fd(r.licenciamento) },
    { l: 'Seguro', r: (r) => vence(r.seguro), csv: (r) => fd(r.seguro) },
    { l: 'Documentos', r: (r) => <Pill tom={r.documentacao === 'OK' ? 'ok' : 'warn'}>{r.documentacao}</Pill>, csv: (r) => r.documentacao },
    { l: 'Condutor atual', r: (r, L) => (r.status === 'Em uso' ? motorista(L, r.motoristaAtualId) : vazio), csv: (r, L) => (r.status === 'Em uso' ? motorista(L, r.motoristaAtualId) : '') },
    { l: 'Situação', r: (r) => <Pill tom={TOM_VEICULO[r.status]}>{r.status}</Pill>, csv: (r) => r.status },
  ],
  texto: (r) => [r.placa, r.marca, r.modelo, r.tipo, r.renavam, r.chassi, r.cor].join(' '),
  filtro: { k: 'status', l: 'Todas as situações', o: VEICULO_STATUS },
};

export const motoristas = {
  api: 'motoristas', titulo: 'Motoristas', sobre: 'Condutores habilitados', um: 'motorista', novo: 'Novo motorista',
  nomeDe: (r) => r.nome,
  campos: [
    { k: 'nome', l: 'Nome completo', obrig: true, span: true },
    { k: 'cpf', l: 'CPF' }, { k: 'rg', l: 'RG' },
    { k: 'telefone', l: 'Telefone' }, { k: 'endereco', l: 'Endereço' },
    { k: 'cidade', l: 'Cidade' }, { k: 'uf', l: 'UF', t: 'select', o: UFS },
    { k: 'secao-cnh', l: 'Habilitação', t: 'secao' },
    { k: 'cnh', l: 'Número da CNH', obrig: true },
    { k: 'categoria', l: 'Categoria', t: 'select', o: ['A', 'B', 'AB', 'C', 'D', 'E', 'AC', 'AD', 'AE'], padrao: 'B' },
    { k: 'validadeCnh', l: 'Validade da CNH', t: 'data', obrig: true },
    { k: 'aptidao', l: 'Aptidão para dirigir', t: 'select', o: ['Apto', 'Inapto'], padrao: 'Apto', dica: 'Inapto não consegue registrar saída' },
    { k: 'status', l: 'Situação', t: 'select', o: ['Ativo', 'Inativo'], padrao: 'Ativo' },
    { k: 'obs', l: 'Observações', t: 'texto-longo', span: true },
  ],
  colunas: [
    { l: 'Nome', r: (r) => <><strong>{r.nome}</strong><span className="sub">{r.cpf}</span></>, csv: (r) => r.nome },
    { l: 'CNH', r: (r) => <><span className="mono">{r.cnh}</span><span className="sub">Categoria {r.categoria || '—'}</span></>, csv: (r) => `${r.cnh} (${r.categoria || ''})` },
    { l: 'Validade', r: (r) => vence(r.validadeCnh), csv: (r) => fd(r.validadeCnh) },
    { l: 'Telefone', r: (r) => <span className="nw">{r.telefone || '—'}</span>, csv: (r) => r.telefone },
    { l: 'Cidade', r: (r) => (r.cidade ? `${r.cidade}${r.uf ? '/' + r.uf : ''}` : '—'), csv: (r) => r.cidade },
    { l: 'Em rota com', r: (r, L) => { const v = L.veiculos.find((x) => x.status === 'Em uso' && x.motoristaAtualId === r.id); return v ? <Placa placa={v.placa} /> : vazio; }, csv: () => '' },
    { l: 'Aptidão', r: (r) => <Pill tom={r.aptidao === 'Apto' ? 'ok' : 'bad'}>{r.aptidao}</Pill>, csv: (r) => r.aptidao },
    { l: 'Situação', r: (r) => <Pill tom={r.status === 'Ativo' ? 'ok' : 'mute'}>{r.status}</Pill>, csv: (r) => r.status },
  ],
  texto: (r) => [r.nome, r.cpf, r.rg, r.cnh, r.telefone, r.cidade].join(' '),
  filtro: { k: 'status', l: 'Todos', o: ['Ativo', 'Inativo'] },
};

export const fornecedores = {
  api: 'fornecedores', titulo: 'Fornecedores', sobre: 'Oficinas, postos e autopeças', um: 'fornecedor', novo: 'Novo fornecedor',
  nomeDe: (r) => r.nome,
  campos: [
    { k: 'nome', l: 'Nome / razão social', obrig: true, span: true },
    { k: 'tipo', l: 'Tipo', t: 'select', o: TIPOS_FORNECEDOR, obrig: true },
    { k: 'cnpj', l: 'CNPJ' }, { k: 'contato', l: 'Contato' }, { k: 'telefone', l: 'Telefone' }, { k: 'cidade', l: 'Cidade/UF' },
    { k: 'obs', l: 'Observações', t: 'texto-longo', span: true },
  ],
  colunas: [
    { l: 'Nome', r: (r) => <><strong>{r.nome}</strong><span className="sub mono">{r.cnpj}</span></>, csv: (r) => r.nome },
    { l: 'Tipo', r: (r) => r.tipo, csv: (r) => r.tipo },
    { l: 'Contato', r: (r) => r.contato || '—', csv: (r) => r.contato },
    { l: 'Telefone', r: (r) => <span className="nw">{r.telefone || '—'}</span>, csv: (r) => r.telefone },
    { l: 'Cidade', r: (r) => r.cidade || '—', csv: (r) => r.cidade },
    { l: 'Gasto total', c: 'num', r: (r, L) => brl(gastoFornecedor(r, L)), csv: (r, L) => gastoFornecedor(r, L).toFixed(2) },
  ],
  texto: (r) => [r.nome, r.tipo, r.cnpj, r.contato, r.cidade].join(' '),
  filtro: { k: 'tipo', l: 'Todos os tipos', o: TIPOS_FORNECEDOR },
};
const gastoFornecedor = (f, L) =>
  L.ordens.filter((o) => o.fornecedorId === f.id && o.status !== 'Cancelada').reduce((s, o) => s + totalItens(o.itens), 0) +
  L.abastecimentos.filter((a) => a.fornecedorId === f.id).reduce((s, a) => s + (a.valor || 0), 0);

export const clientes = {
  api: 'clientes', titulo: 'Clientes', sobre: 'Destinatários de entregas e fretes', um: 'cliente', novo: 'Novo cliente',
  nomeDe: (r) => r.nome,
  campos: [
    { k: 'nome', l: 'Nome / razão social', obrig: true, span: true },
    { k: 'documento', l: 'CPF/CNPJ' }, { k: 'contato', l: 'Contato' }, { k: 'telefone', l: 'Telefone' }, { k: 'endereco', l: 'Endereço' },
    { k: 'cidade', l: 'Cidade' }, { k: 'uf', l: 'UF', t: 'select', o: UFS },
    { k: 'obs', l: 'Observações', t: 'texto-longo', span: true },
  ],
  colunas: [
    { l: 'Nome', r: (r) => <><strong>{r.nome}</strong><span className="sub mono">{r.documento}</span></>, csv: (r) => r.nome },
    { l: 'Contato', r: (r) => <>{r.contato || '—'}<span className="sub">{r.telefone}</span></>, csv: (r) => `${r.contato || ''} ${r.telefone || ''}` },
    { l: 'Endereço', r: (r) => <>{r.endereco || '—'}<span className="sub">{r.cidade}{r.uf ? '/' + r.uf : ''}</span></>, csv: (r) => `${r.endereco || ''} ${r.cidade || ''}/${r.uf || ''}` },
    { l: 'Pedidos', c: 'num', r: (r, L) => L.pedidos.filter((p) => p.clienteId === r.id).length, csv: (r, L) => L.pedidos.filter((p) => p.clienteId === r.id).length },
  ],
  texto: (r) => [r.nome, r.documento, r.contato, r.cidade].join(' '),
};

// ======================================================================
export const movimentos = {
  api: 'movimentos', titulo: 'Entradas e saídas', sobre: 'Controle de portaria', um: 'movimentação', fem: true, novo: 'Registrar saída',
  escrita: TODOS, edicao: ['ADMIN', 'GESTOR'],
  tituloNovo: (f) => `Registrar ${(f.tipo || 'saída').toLowerCase()}`,
  nomeDe: (r, L) => `${r.tipo} de ${placaDe(L, r.veiculoId)}`,
  presetNovo: () => ({ tipo: 'Saída' }),
  campos: [
    { k: 'tipo', l: 'Movimento', t: 'select', o: ['Saída', 'Entrada'], obrig: true, padrao: 'Saída' },
    { k: 'dataHora', l: 'Data e hora', t: 'dataHora', obrig: true, padrao: () => isoDateTime() },
    { k: 'veiculoId', l: 'Veículo', t: 'ref', o: opVeiculos(), obrig: true, span: true,
      aoMudar: (id, form, L) => {
        const v = L.veiculosPorId[id]; if (!v) return form;
        const tipo = v.status === 'Em uso' ? 'Entrada' : 'Saída';
        return { ...form, km: v.km, tipo, motoristaId: tipo === 'Entrada' ? v.motoristaAtualId || form.motoristaId : form.motoristaId };
      } },
    { k: 'motoristaId', l: 'Motorista', t: 'ref', o: opMotoristas, obrig: true },
    { k: 'km', l: 'Hodômetro (km)', t: 'numero', obrig: true },
    { k: 'combustivel', l: 'Nível de combustível', t: 'select', o: ['Reserva', '1/4', '1/2', '3/4', 'Cheio'] },
    { k: 'destino', l: 'Destino / motivo' },
    { k: 'obs', l: 'Avarias e observações', t: 'texto-longo', span: true },
  ],
  colunas: [
    { l: 'Movimento', r: (r) => <span className={`dir ${r.tipo === 'Saída' ? 'txt-warn' : 'txt-ok'}`}>{r.tipo === 'Saída' ? '↗ Saída' : '↙ Entrada'}</span>, csv: (r) => r.tipo },
    { l: 'Data e hora', r: (r) => <span className="nw">{fdt(r.dataHora)}</span>, csv: (r) => fdt(r.dataHora) },
    vCol(),
    { l: 'Motorista', r: (r, L) => motorista(L, r.motoristaId), csv: (r, L) => motorista(L, r.motoristaId) },
    { l: 'Hodômetro', c: 'num', r: (r) => `${num(r.km)} km`, csv: (r) => r.km },
    { l: 'Percurso', c: 'num', r: (r, L) => { const p = percurso(r, L); return p != null ? `${num(p)} km` : vazio; }, csv: (r, L) => percurso(r, L) ?? '' },
    { l: 'Combustível', r: (r) => r.combustivel || '—', csv: (r) => r.combustivel },
    { l: 'Destino / motivo', r: (r) => r.destino || '—', csv: (r) => r.destino },
  ],
  texto: (r, L) => [r.tipo, nomeV(L.veiculosPorId[r.veiculoId]), motorista(L, r.motoristaId), r.destino, r.obs].join(' '),
  filtro: { k: 'tipo', l: 'Entradas e saídas', o: ['Saída', 'Entrada'] },
};
function percurso(m, L) {
  if (m.tipo !== 'Entrada') return null;
  const s = L.movimentos.filter((x) => x.veiculoId === m.veiculoId && x.tipo === 'Saída' && x.dataHora <= m.dataHora).sort((a, b) => b.dataHora.localeCompare(a.dataHora))[0];
  return s ? m.km - s.km : null;
}

export const manutencoes = {
  api: 'manutencoes', titulo: 'Manutenções', sobre: 'Planos preventivos por km e por tempo', um: 'plano de manutenção', novo: 'Novo plano',
  nomeDe: (r, L) => `${r.servico} · ${placaDe(L, r.veiculoId)}`,
  campos: [
    { k: 'veiculoId', l: 'Veículo', t: 'ref', o: opVeiculos(true), obrig: true, span: true },
    { k: 'servico', l: 'Serviço', t: 'select', obrig: true, o: ['Troca de óleo e filtros', 'Revisão geral', 'Alinhamento e balanceamento', 'Rodízio de pneus', 'Troca de pneus', 'Pastilhas e discos de freio', 'Correia dentada', 'Filtro de ar e cabine', 'Fluido de arrefecimento', 'Bateria', 'Embreagem', 'Suspensão', 'Ar-condicionado', 'Tacógrafo', 'Lubrificação', 'Outro'] },
    { k: 'intervaloKm', l: 'A cada (km)', t: 'numero', dica: 'Deixe vazio se o controle for só por tempo' },
    { k: 'intervaloDias', l: 'A cada (dias)', t: 'numero', dica: 'Ex.: 180 para semestral' },
    { k: 'ultimaData', l: 'Última realização', t: 'data' },
    { k: 'ultimaKm', l: 'Hodômetro na última realização', t: 'numero' },
    { k: 'obs', l: 'Observações', t: 'texto-longo', span: true },
  ],
  colunas: [
    vCol(),
    { l: 'Serviço', r: (r) => <><strong>{r.servico}</strong><span className="sub">{[r.intervaloKm ? `a cada ${num(r.intervaloKm)} km` : '', r.intervaloDias ? `a cada ${num(r.intervaloDias)} dias` : ''].filter(Boolean).join(' ou ')}</span></>, csv: (r) => r.servico },
    { l: 'Última', r: (r) => <><span className="nw">{fd(r.ultimaData)}</span><span className="sub mono">{r.ultimaKm != null ? num(r.ultimaKm) + ' km' : ''}</span></>, csv: (r) => fd(r.ultimaData) },
    { l: 'Próxima', r: (r, L) => { const s = sit(r, L); return <><span className="nw">{s.proxData ? fd(s.proxData) : '—'}</span><span className="sub mono">{s.proxKm != null ? num(s.proxKm) + ' km' : ''}</span></>; }, csv: (r, L) => { const s = sit(r, L); return `${s.proxData ? fd(s.proxData) : ''} ${s.proxKm ?? ''}`; } },
    { l: 'Situação', r: (r, L) => { const s = sit(r, L); return <><Pill tom={s.tom}>{s.rotulo}</Pill><span className="sub">{s.os ? numeroOS(s.os.numero) : s.dica}</span></>; }, csv: (r, L) => sit(r, L).rotulo },
    { l: '', r: (r, L, abrir, pode) => (sit(r, L).os || !pode ? null : <span onClick={(e) => e.stopPropagation()}><AbrirOS plano={r} L={L} /></span>) },
  ],
  ordenar: (a, b, L) => { const k = { bad: 0, warn: 1, info: 2, ok: 3 }; return k[sit(a, L).tom] - k[sit(b, L).tom]; },
  texto: (r, L) => [nomeV(L.veiculosPorId[r.veiculoId]), r.servico, sit(r, L).rotulo].join(' '),
  filtro: { l: 'Todas as situações', o: ['Vencida', 'Próxima', 'Em OS', 'Em dia'], valor: (r, L) => sit(r, L).rotulo },
};
const sit = (p, L) => situacaoPlano(p, L.veiculosPorId[p.veiculoId], L.ordens);
// Botao "Abrir OS" do plano: dispara um evento tratado pela pagina de manutencoes.
function AbrirOS({ plano }) {
  return <button className="btn sm" onClick={() => window.dispatchEvent(new CustomEvent('abrir-os-plano', { detail: plano }))}>Abrir OS</button>;
}

export const ordens = {
  api: 'ordens', titulo: 'Ordens de serviço', sobre: 'Preventivas, corretivas e preditivas', um: 'ordem de serviço', fem: true, novo: 'Nova OS',
  nomeDe: (r) => numeroOS(r.numero),
  msgSalvo: (o, novo) => (novo ? `${numeroOS(o.numero)} ${o.status === 'Agendada' ? 'agendada' : 'aberta'}.` : 'Alterações salvas.'),
  campos: [
    { k: 'numero', l: 'Número', t: 'somenteLeitura', valor: (r) => (r?.numero ? numeroOS(r.numero) : 'Gerado ao salvar') },
    { k: 'status', l: 'Situação', t: 'select', o: OS_STATUS, padrao: 'Aberta' },
    { k: 'veiculoId', l: 'Veículo', t: 'ref', o: opVeiculos(true), obrig: true, span: true, aoMudar: kmDoVeiculo },
    { k: 'tipo', l: 'Tipo de manutenção', t: 'select', o: OS_TIPOS, padrao: 'Corretiva' },
    { k: 'prioridade', l: 'Prioridade', t: 'select', o: PRIORIDADES, padrao: 'Média' },
    { k: 'fornecedorId', l: 'Oficina / fornecedor', t: 'ref', o: opFornecedores(['Oficina mecânica', 'Autopeças', 'Borracharia', 'Funilaria e pintura', 'Concessionária', 'Outro']) },
    { k: 'responsavel', l: 'Técnico responsável' },
    { k: 'agendadaPara', l: 'Agendada para', t: 'data', mostrar: (f) => f.status === 'Agendada', obrig: true },
    { k: 'abertura', l: 'Abertura', t: 'data', obrig: true, padrao: hoje },
    { k: 'previsao', l: 'Previsão de entrega', t: 'data' },
    { k: 'conclusao', l: 'Conclusão', t: 'data', dica: 'Preenchida ao concluir' },
    { k: 'km', l: 'Hodômetro na entrada (km)', t: 'numero' },
    { k: 'valorPrevisto', l: 'Valor previsto (orçamento)', t: 'dinheiro' },
    { k: 'solicitante', l: 'Solicitante', span: true },
    { k: 'descricao', l: 'Defeito relatado / serviço solicitado', t: 'texto-longo', obrig: true, span: true },
    { k: 'itens', l: 'Peças e serviços', t: 'itens' },
    { k: 'correcao', l: 'Correção realizada', t: 'texto-longo', span: true },
    { k: 'obs', l: 'Observações', t: 'texto-longo', span: true },
    { k: 'planoId', t: 'oculto' },
  ],
  colunas: [
    { l: 'Nº', c: 'nw', r: (r) => <strong className="mono">{numeroOS(r.numero)}</strong>, csv: (r) => numeroOS(r.numero) },
    vCol(),
    { l: 'Serviço', r: (r, L) => <>{(r.descricao || '').slice(0, 60)}{(r.descricao || '').length > 60 ? '…' : ''}<span className="sub">{r.tipo}{r.fornecedorId ? ' · ' + fornecedor(L, r.fornecedorId) : ''}</span></>, csv: (r) => r.descricao },
    { l: 'Prioridade', r: (r) => <Pill tom={TOM_PRIORIDADE[r.prioridade]}>{r.prioridade}</Pill>, csv: (r) => r.prioridade },
    { l: 'Datas', r: (r) => {
      if (r.status === 'Agendada') return <><span className="nw">{fd(r.agendadaPara)}</span><span className="sub">agendada</span></>;
      const atrasada = OS_ABERTAS.includes(r.status) && r.previsao && diasAte(r.previsao) < 0;
      return <><span className="nw">{fd(r.abertura)}</span><span className={`sub ${atrasada ? 'txt-bad' : ''}`}>{r.conclusao ? `concluída ${fd(r.conclusao)}` : r.previsao ? `${atrasada ? 'atrasada · ' : 'previsão '}${fd(r.previsao)}` : ''}</span></>;
    }, csv: (r) => fd(r.abertura) },
    { l: 'Previsto', c: 'num', r: (r) => (r.valorPrevisto ? brl(r.valorPrevisto) : vazio), csv: (r) => r.valorPrevisto ?? '' },
    { l: 'Total', c: 'num', r: (r) => brl(totalItens(r.itens)), csv: (r) => totalItens(r.itens).toFixed(2) },
    { l: 'Situação', r: (r) => <Pill tom={TOM_OS[r.status]}>{r.status}</Pill>, csv: (r) => r.status },
  ],
  texto: (r, L) => [numeroOS(r.numero), nomeV(L.veiculosPorId[r.veiculoId]), r.descricao, r.tipo, fornecedor(L, r.fornecedorId), r.status, r.responsavel].join(' '),
  filtro: { l: 'Todas as situações', o: ['Em aberto', ...OS_STATUS], casa: (r, v) => (v === 'Em aberto' ? OS_ABERTAS.includes(r.status) : r.status === v) },
};

export const abastecimentos = {
  api: 'abastecimentos', titulo: 'Abastecimentos', sobre: 'Combustível e consumo', um: 'abastecimento', novo: 'Novo abastecimento',
  escrita: TODOS, edicao: ['ADMIN', 'GESTOR'],
  nomeDe: (r, L) => `Abastecimento de ${placaDe(L, r.veiculoId)} em ${fd(r.data)}`,
  campos: [
    { k: 'veiculoId', l: 'Veículo', t: 'ref', o: opVeiculos(true), obrig: true, span: true,
      aoMudar: (id, form, L) => { const v = L.veiculosPorId[id]; return v ? { ...form, km: v.km, motoristaId: v.motoristaAtualId || form.motoristaId } : form; } },
    { k: 'data', l: 'Data', t: 'data', obrig: true, padrao: hoje },
    { k: 'motoristaId', l: 'Motorista', t: 'ref', o: opMotoristas },
    { k: 'fornecedorId', l: 'Posto', t: 'ref', o: opFornecedores(['Posto de combustível']) },
    { k: 'combustivel', l: 'Combustível', t: 'select', o: COMBUSTIVEIS },
    { k: 'km', l: 'Hodômetro (km)', t: 'numero', obrig: true },
    { k: 'litros', l: 'Litros', t: 'numero', passo: '0.01', obrig: true },
    { k: 'valor', l: 'Valor total (R$)', t: 'dinheiro', obrig: true },
    { k: 'tanque', l: 'Situação do tanque', t: 'select', o: ['Cheio', 'Suficiente', 'Não suficiente'] },
    { k: 'obs', l: 'Observações', t: 'texto-longo', span: true },
  ],
  colunas: [
    { l: 'Data', r: (r) => <span className="nw">{fd(r.data)}</span>, csv: (r) => fd(r.data) },
    vCol(),
    { l: 'Posto', r: (r, L) => <>{fornecedor(L, r.fornecedorId)}<span className="sub">{r.combustivel}</span></>, csv: (r, L) => fornecedor(L, r.fornecedorId) },
    { l: 'Motorista', r: (r, L) => motorista(L, r.motoristaId), csv: (r, L) => motorista(L, r.motoristaId) },
    { l: 'Hodômetro', c: 'num', r: (r) => `${num(r.km)} km`, csv: (r) => r.km },
    { l: 'Litros', c: 'num', r: (r) => num(r.litros, 2), csv: (r) => r.litros },
    { l: 'R$/litro', c: 'num', r: (r) => (r.litros ? brl(r.valor / r.litros) : '—'), csv: (r) => (r.litros ? (r.valor / r.litros).toFixed(3) : '') },
    { l: 'Total', c: 'num', r: (r) => brl(r.valor), csv: (r) => r.valor },
    { l: 'Consumo', c: 'num', r: (r, L) => { const c = consumoKmL(r, L.abastecimentos); return c ? `${num(c, 1)} km/l` : vazio; }, csv: (r, L) => { const c = consumoKmL(r, L.abastecimentos); return c ? c.toFixed(2) : ''; } },
    { l: 'Tanque', r: (r) => (r.tanque ? <Pill tom={r.tanque === 'Não suficiente' ? 'warn' : 'ok'}>{r.tanque}</Pill> : vazio), csv: (r) => r.tanque },
  ],
  texto: (r, L) => [nomeV(L.veiculosPorId[r.veiculoId]), fornecedor(L, r.fornecedorId), motorista(L, r.motoristaId), r.combustivel].join(' '),
  filtro: { k: 'combustivel', l: 'Todos os combustíveis', o: COMBUSTIVEIS },
};

// ======================================================================
export const pneus = {
  api: 'pneus', titulo: 'Pneus', sobre: 'Vida útil, sulco e recapagens', um: 'pneu', novo: 'Novo pneu',
  nomeDe: (r) => `Pneu ${r.codigo}`,
  campos: [
    { k: 'codigo', l: 'Número de fogo', obrig: true, dica: 'Código gravado no pneu' },
    { k: 'status', l: 'Situação', t: 'select', o: PNEU_STATUS, padrao: 'Estoque' },
    { k: 'marca', l: 'Marca', obrig: true }, { k: 'modelo', l: 'Modelo' },
    { k: 'medida', l: 'Medida', dica: 'Ex.: 295/80 R22.5' }, { k: 'dot', l: 'DOT (semana e ano)', dica: 'Ex.: 2324 = semana 23 de 2024' },
    { k: 'validade', l: 'Validade', t: 'data' }, { k: 'valor', l: 'Valor de compra (R$)', t: 'dinheiro' },
    { k: 'secao-montagem', l: 'Montagem', t: 'secao', mostrar: (f) => f.status === 'Em uso' },
    { k: 'veiculoId', l: 'Veículo', t: 'ref', o: opVeiculos(true), mostrar: (f) => f.status === 'Em uso', obrig: true },
    { k: 'posicao', l: 'Posição', t: 'select', o: PNEU_POSICOES, mostrar: (f) => f.status === 'Em uso', obrig: true },
    { k: 'kmInstalacao', l: 'Hodômetro na instalação', t: 'numero', mostrar: (f) => f.status === 'Em uso', dica: 'Vazio = hodômetro atual do veículo' },
    { k: 'secao-desgaste', l: 'Desgaste', t: 'secao' },
    { k: 'sulcoInicial', l: 'Sulco inicial (mm)', t: 'numero', passo: '0.1' }, { k: 'sulcoAtual', l: 'Sulco atual (mm)', t: 'numero', passo: '0.1', dica: 'Mínimo legal: 1,6 mm' },
    { k: 'kmAcumulado', l: 'Km rodados em montagens anteriores', t: 'numero', padrao: 0 },
    { k: 'recapagens', l: 'Recapagens', t: 'numero', padrao: 0 }, { k: 'custoRecapagens', l: 'Custo das recapagens (R$)', t: 'dinheiro', padrao: 0 },
    { k: 'obs', l: 'Observações', t: 'texto-longo', span: true },
  ],
  colunas: [
    { l: 'Pneu', r: (r) => <><strong className="mono">{r.codigo}</strong><span className="sub">{r.marca} {r.modelo}</span></>, csv: (r) => r.codigo },
    { l: 'Medida', r: (r) => <>{r.medida || '—'}<span className="sub">DOT {r.dot || '—'}</span></>, csv: (r) => r.medida },
    { l: 'Montado em', r: (r, L) => (r.status === 'Em uso' ? <span className="vcell"><Placa placa={placaDe(L, r.veiculoId)} /><span className="sub">{r.posicao}</span></span> : vazio), csv: (r, L) => (r.status === 'Em uso' ? `${placaDe(L, r.veiculoId)} ${r.posicao}` : '') },
    { l: 'Sulco', r: (r) => { const s = situacaoSulco(r); return <>{r.sulcoAtual != null ? <span className="mono">{num(r.sulcoAtual, 1)} mm</span> : '—'}<span className={`sub txt-${s.tom}`}>{s.rotulo}</span></>; }, csv: (r) => r.sulcoAtual ?? '' },
    { l: 'Km rodados', c: 'num', r: (r, L) => `${num(kmRodadoPneu(r, L.veiculosPorId[r.veiculoId]))} km`, csv: (r, L) => kmRodadoPneu(r, L.veiculosPorId[r.veiculoId]) },
    { l: 'Recapagens', c: 'num', r: (r) => r.recapagens, csv: (r) => r.recapagens },
    { l: 'Custo total', c: 'num', r: (r) => brl((r.valor || 0) + (r.custoRecapagens || 0)), csv: (r) => ((r.valor || 0) + (r.custoRecapagens || 0)).toFixed(2) },
    { l: 'Situação', r: (r) => <Pill tom={TOM_PNEU[r.status]}>{r.status}</Pill>, csv: (r) => r.status },
  ],
  ordenar: (a, b) => a.codigo.localeCompare(b.codigo),
  texto: (r, L) => [r.codigo, r.marca, r.modelo, r.medida, placaDe(L, r.veiculoId), r.posicao, r.status].join(' '),
  filtro: { k: 'status', l: 'Todas as situações', o: PNEU_STATUS },
};

export const servicosPneu = {
  api: 'servicosPneu', titulo: 'Serviços de pneus', sobre: 'Recapagens, consertos e rodízios', um: 'serviço de pneu', novo: 'Novo serviço',
  nomeDe: (r, L) => `${r.tipo} do pneu ${L.pneusPorId[r.pneuId]?.codigo || ''}`,
  campos: [
    { k: 'pneuId', l: 'Pneu', t: 'ref', obrig: true, o: (L) => [...L.pneus].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((p) => [p.id, `${p.codigo} · ${p.marca} ${p.medida || ''} (${p.status}${p.veiculoId ? ' ' + placaDe(L, p.veiculoId) : ''})`]),
      aoMudar: (id, form, L) => ({ ...form, veiculoId: L.pneusPorId[id]?.veiculoId || form.veiculoId }) },
    { k: 'veiculoId', l: 'Veículo', t: 'ref', o: opVeiculos(true) },
    { k: 'data', l: 'Data', t: 'data', obrig: true, padrao: hoje },
    { k: 'tipo', l: 'Serviço', t: 'select', obrig: true, o: ['Recapagem', 'Conserto', 'Rodízio', 'Calibragem', 'Alinhamento e balanceamento', 'Troca', 'Inspeção'] },
    { k: 'classe', l: 'Classe', t: 'select', o: ['Preventiva', 'Corretiva', 'Preditiva'], padrao: 'Preventiva' },
    { k: 'fornecedorId', l: 'Fornecedor', t: 'ref', o: opFornecedores(['Borracharia', 'Oficina mecânica', 'Autopeças', 'Outro']) },
    { k: 'custo', l: 'Custo (R$)', t: 'dinheiro', padrao: 0 },
    { k: 'status', l: 'Situação', t: 'select', o: ['Pendente', 'Em andamento', 'Concluído', 'Cancelado'], padrao: 'Concluído', dica: 'Recapagem concluída soma 1 recapagem ao pneu' },
    { k: 'descricao', l: 'Descrição / defeito', t: 'texto-longo', span: true },
  ],
  colunas: [
    { l: 'Data', r: (r) => <span className="nw">{fd(r.data)}</span>, csv: (r) => fd(r.data) },
    { l: 'Pneu', r: (r, L) => <strong className="mono">{L.pneusPorId[r.pneuId]?.codigo || '—'}</strong>, csv: (r, L) => L.pneusPorId[r.pneuId]?.codigo },
    { l: 'Veículo', r: (r, L) => (r.veiculoId ? <Placa placa={placaDe(L, r.veiculoId)} /> : vazio), csv: (r, L) => placaDe(L, r.veiculoId) },
    { l: 'Serviço', r: (r) => <><strong>{r.tipo}</strong><span className="sub">{r.classe}{r.descricao ? ' · ' + r.descricao : ''}</span></>, csv: (r) => r.tipo },
    { l: 'Fornecedor', r: (r, L) => fornecedor(L, r.fornecedorId), csv: (r, L) => fornecedor(L, r.fornecedorId) },
    { l: 'Custo', c: 'num', r: (r) => brl(r.custo), csv: (r) => r.custo },
    { l: 'Situação', r: (r) => <Pill tom={{ 'Concluído': 'ok', 'Em andamento': 'info', 'Pendente': 'warn', 'Cancelado': 'mute' }[r.status]}>{r.status}</Pill>, csv: (r) => r.status },
  ],
  texto: (r, L) => [L.pneusPorId[r.pneuId]?.codigo, placaDe(L, r.veiculoId), r.tipo, r.classe, r.descricao].join(' '),
  filtro: { k: 'tipo', l: 'Todos os serviços', o: ['Recapagem', 'Conserto', 'Rodízio', 'Calibragem', 'Alinhamento e balanceamento', 'Troca', 'Inspeção'] },
};

export const inspecoes = {
  api: 'inspecoes', titulo: 'Checklist de pneus', sobre: 'Inspeções periódicas', um: 'inspeção', fem: true, novo: 'Nova inspeção',
  escrita: TODOS, edicao: ['ADMIN', 'GESTOR'],
  nomeDe: (r, L) => `Inspeção de ${placaDe(L, r.veiculoId)} em ${fd(r.data)}`,
  campos: [
    { k: 'veiculoId', l: 'Veículo', t: 'ref', o: opVeiculos(true), obrig: true },
    { k: 'data', l: 'Data', t: 'data', obrig: true, padrao: hoje },
    { k: 'motoristaId', l: 'Responsável pela inspeção', t: 'ref', o: opMotoristas, span: true },
    { k: 'itens', l: 'Itens verificados', t: 'checklist', obrig: true, padrao: () => CHECKLIST_PNEUS.map((item) => ({ item, conforme: true, obs: '' })) },
    { k: 'obs', l: 'Observações', t: 'texto-longo', span: true },
  ],
  colunas: [
    { l: 'Data', r: (r) => <span className="nw">{fd(r.data)}</span>, csv: (r) => fd(r.data) },
    vCol(),
    { l: 'Responsável', r: (r, L) => motorista(L, r.motoristaId), csv: (r, L) => motorista(L, r.motoristaId) },
    { l: 'Itens', c: 'num', r: (r) => `${(r.itens || []).length - r.naoConformes} de ${(r.itens || []).length} conformes`, csv: (r) => `${(r.itens || []).length - r.naoConformes}/${(r.itens || []).length}` },
    { l: 'Não conformidades', r: (r) => (r.naoConformes ? (r.itens || []).filter((i) => i.conforme === false).map((i) => i.item).join('; ') : vazio), csv: (r) => (r.itens || []).filter((i) => i.conforme === false).map((i) => i.item).join('; ') },
    { l: 'Resultado', r: (r) => <Pill tom={r.resultado === 'Conforme' ? 'ok' : 'bad'}>{r.resultado}</Pill>, csv: (r) => r.resultado },
  ],
  texto: (r, L) => [placaDe(L, r.veiculoId), motorista(L, r.motoristaId), r.resultado, r.obs].join(' '),
  filtro: { k: 'resultado', l: 'Todos os resultados', o: ['Conforme', 'Não conforme'] },
};

// ======================================================================
export const pedidos = {
  api: 'pedidos', titulo: 'Pedidos', sobre: 'Pedidos dos clientes', um: 'pedido', novo: 'Novo pedido',
  nomeDe: (r) => `Pedido ${r.codigo}`,
  campos: [
    { k: 'codigo', l: 'Código do pedido', dica: 'Vazio = gerado automaticamente' },
    { k: 'status', l: 'Situação', t: 'select', o: PEDIDO_STATUS, padrao: 'Pendente' },
    { k: 'clienteId', l: 'Cliente', t: 'ref', o: opClientes, obrig: true, span: true,
      aoMudar: (id, form, L) => { const c = L.clientesPorId[id]; return c ? { ...form, endereco: form.endereco || [c.endereco, c.cidade && `${c.cidade}/${c.uf || ''}`].filter(Boolean).join(' - '), contato: form.contato || c.contato } : form; } },
    { k: 'descricao', l: 'Descrição do pedido', obrig: true, span: true },
    { k: 'quantidade', l: 'Quantidade de itens', t: 'numero', padrao: 1 },
    { k: 'contato', l: 'Contato' },
    { k: 'endereco', l: 'Endereço de entrega', span: true },
    { k: 'dataSaida', l: 'Data de saída', t: 'data' }, { k: 'prazo', l: 'Prazo de entrega', t: 'data' },
    { k: 'dataEntrega', l: 'Data da entrega', t: 'data' },
    { k: 'obs', l: 'Observações', t: 'texto-longo', span: true },
  ],
  colunas: [
    { l: 'Pedido', r: (r) => <><strong className="mono">{r.codigo}</strong><span className="sub">{r.descricao}</span></>, csv: (r) => r.codigo },
    { l: 'Cliente', r: (r, L) => <>{cliente(L, r.clienteId)}<span className="sub">{r.endereco}</span></>, csv: (r, L) => cliente(L, r.clienteId) },
    { l: 'Itens', c: 'num', r: (r) => num(r.quantidade), csv: (r) => r.quantidade },
    { l: 'Prazo', r: (r) => { const late = r.prazo && !['Entregue', 'Entregue com atraso', 'Não entregue'].includes(r.status) && diasAte(r.prazo) < 0; return <span className={`nw ${late ? 'txt-bad' : ''}`}>{fd(r.prazo)}</span>; }, csv: (r) => fd(r.prazo) },
    { l: 'Entregue em', r: (r) => <span className="nw">{fd(r.dataEntrega)}</span>, csv: (r) => fd(r.dataEntrega) },
    { l: 'Situação', r: (r) => <Pill tom={TOM_PEDIDO[r.status]}>{r.status}</Pill>, csv: (r) => r.status },
  ],
  texto: (r, L) => [r.codigo, r.descricao, cliente(L, r.clienteId), r.endereco, r.status].join(' '),
  filtro: { k: 'status', l: 'Todas as situações', o: PEDIDO_STATUS },
};

export const entregas = {
  api: 'entregas', titulo: 'Entregas', sobre: 'Rotas de entrega', um: 'entrega', fem: true, novo: 'Nova entrega',
  escrita: TODOS,
  nomeDe: (r) => `Entrega para ${r.destino}`,
  campos: [
    { k: 'data', l: 'Data', t: 'data', obrig: true, padrao: hoje },
    { k: 'status', l: 'Situação', t: 'select', o: ENTREGA_STATUS, padrao: 'Em andamento', dica: 'Realizada após o prazo vira "com atraso"' },
    { k: 'pedidoId', l: 'Pedido', t: 'ref', span: true,
      o: (L, f) => L.pedidos.filter((p) => !['Entregue', 'Entregue com atraso'].includes(p.status) || p.id === f.pedidoId).map((p) => [p.id, `${p.codigo} · ${cliente(L, p.clienteId)} · ${p.descricao}`]),
      aoMudar: (id, form, L) => { const p = L.pedidosPorId[id]; const c = p && L.clientesPorId[p.clienteId]; return p ? { ...form, clienteId: p.clienteId, produto: p.descricao, qtdProdutos: p.quantidade, prazo: p.prazo, destino: form.destino || c?.cidade || '', ufDestino: form.ufDestino || c?.uf || '' } : form; } },
    { k: 'veiculoId', l: 'Veículo', t: 'ref', o: opVeiculos(), obrig: true },
    { k: 'motoristaId', l: 'Motorista', t: 'ref', o: opMotoristas, obrig: true },
    { k: 'clienteId', l: 'Cliente', t: 'ref', o: opClientes, span: true },
    { k: 'origem', l: 'Origem' }, { k: 'ufOrigem', l: 'UF de origem', t: 'select', o: UFS },
    { k: 'destino', l: 'Destino', obrig: true }, { k: 'ufDestino', l: 'UF de destino', t: 'select', o: UFS },
    { k: 'produto', l: 'Produto' }, { k: 'qtdProdutos', l: 'Quantidade de produtos', t: 'numero' },
    { k: 'kmRodados', l: 'Km rodados', t: 'numero' }, { k: 'prazo', l: 'Prazo', t: 'data' },
    { k: 'dataEntrega', l: 'Data da entrega', t: 'data' },
    { k: 'obs', l: 'Observações', t: 'texto-longo', span: true },
  ],
  colunas: [
    { l: 'Data', r: (r) => <span className="nw">{fd(r.data)}</span>, csv: (r) => fd(r.data) },
    { l: 'Rota', r: (r) => <><strong>{r.origem || '—'}{r.ufOrigem ? '/' + r.ufOrigem : ''} → {r.destino}{r.ufDestino ? '/' + r.ufDestino : ''}</strong><span className="sub">{r.produto}{r.qtdProdutos ? ` · ${r.qtdProdutos} un.` : ''}</span></>, csv: (r) => `${r.origem || ''} -> ${r.destino}` },
    { l: 'Cliente', r: (r, L) => <>{cliente(L, r.clienteId)}<span className="sub mono">{L.pedidosPorId[r.pedidoId]?.codigo}</span></>, csv: (r, L) => cliente(L, r.clienteId) },
    vCol(),
    { l: 'Motorista', r: (r, L) => motorista(L, r.motoristaId), csv: (r, L) => motorista(L, r.motoristaId) },
    { l: 'Km', c: 'num', r: (r) => (r.kmRodados ? num(r.kmRodados) : '—'), csv: (r) => r.kmRodados ?? '' },
    { l: 'Prazo', r: (r) => <><span className="nw">{fd(r.prazo)}</span>{r.dataEntrega ? <span className="sub">entregue {fd(r.dataEntrega)}</span> : null}</>, csv: (r) => fd(r.prazo) },
    { l: 'Situação', r: (r) => <Pill tom={TOM_ENTREGA[r.status]}>{r.status}</Pill>, csv: (r) => r.status },
  ],
  texto: (r, L) => [r.origem, r.destino, r.produto, cliente(L, r.clienteId), motorista(L, r.motoristaId), placaDe(L, r.veiculoId), r.status].join(' '),
  filtro: { k: 'status', l: 'Todas as situações', o: ENTREGA_STATUS },
};

export const fretes = {
  api: 'fretes', titulo: 'Fretes', sobre: 'Receitas, despesas e lucro por viagem', um: 'frete', novo: 'Novo frete',
  nomeDe: (r) => `Frete de ${r.mercadoria}`,
  campos: [
    { k: 'data', l: 'Data', t: 'data', obrig: true, padrao: hoje },
    { k: 'status', l: 'Situação', t: 'select', o: FRETE_STATUS, padrao: 'Pendente' },
    { k: 'clienteId', l: 'Cliente / empresa', t: 'ref', o: opClientes, span: true },
    { k: 'veiculoId', l: 'Veículo', t: 'ref', o: opVeiculos(true), obrig: true },
    { k: 'motoristaId', l: 'Motorista', t: 'ref', o: opMotoristas },
    { k: 'secao-carga', l: 'Carga e rota', t: 'secao' },
    { k: 'mercadoria', l: 'Mercadoria', obrig: true, span: true },
    { k: 'quantidade', l: 'Quantidade (volumes)', t: 'numero' }, { k: 'pesoT', l: 'Peso (toneladas)', t: 'numero', passo: '0.01' },
    { k: 'valorMercadoria', l: 'Valor da mercadoria (R$)', t: 'dinheiro' }, { k: 'origem', l: 'Origem' },
    { k: 'ufOrigem', l: 'UF de origem', t: 'select', o: UFS }, { k: 'destino', l: 'Destino' },
    { k: 'ufDestino', l: 'UF de destino', t: 'select', o: UFS },
    { k: 'secao-valores', l: 'Receita e despesas', t: 'secao' },
    { k: 'valorFrete', l: 'Valor do frete (R$)', t: 'dinheiro', padrao: 0 },
    { k: 'despCombustivel', l: 'Combustível (R$)', t: 'dinheiro', padrao: 0 },
    { k: 'despPedagio', l: 'Pedágios (R$)', t: 'dinheiro', padrao: 0 },
    { k: 'despOutras', l: 'Outras despesas (R$)', t: 'dinheiro', padrao: 0 },
    { k: 'lucroPrevia', l: 'Lucro do frete', t: 'somenteLeitura', valor: (_r, f) => brl(lucroFrete(f)) },
    { k: 'obs', l: 'Observações', t: 'texto-longo', span: true },
  ],
  colunas: [
    { l: 'Data', r: (r) => <span className="nw">{fd(r.data)}</span>, csv: (r) => fd(r.data) },
    { l: 'Mercadoria', r: (r, L) => <><strong>{r.mercadoria}</strong><span className="sub">{cliente(L, r.clienteId)}{r.pesoT ? ` · ${num(r.pesoT, 1)} t` : ''}</span></>, csv: (r) => r.mercadoria },
    { l: 'Rota', r: (r) => <span className="nw">{r.origem || '—'}{r.ufOrigem ? '/' + r.ufOrigem : ''} → {r.destino || '—'}{r.ufDestino ? '/' + r.ufDestino : ''}</span>, csv: (r) => `${r.origem || ''} -> ${r.destino || ''}` },
    vCol(),
    { l: 'Frete', c: 'num', r: (r) => brl(r.valorFrete), csv: (r) => r.valorFrete },
    { l: 'R$/t', c: 'num', r: (r) => (r.pesoT ? brl(r.valorFrete / r.pesoT) : '—'), csv: (r) => (r.pesoT ? (r.valorFrete / r.pesoT).toFixed(2) : '') },
    { l: 'Despesas', c: 'num', r: (r) => brl(r.despCombustivel + r.despPedagio + r.despOutras), csv: (r) => (r.despCombustivel + r.despPedagio + r.despOutras).toFixed(2) },
    { l: 'Lucro', c: 'num', r: (r) => <span className={r.lucro < 0 ? 'txt-bad' : 'txt-ok'}>{brl(r.lucro)}</span>, csv: (r) => r.lucro },
    { l: 'Situação', r: (r) => <Pill tom={TOM_FRETE[r.status]}>{r.status}</Pill>, csv: (r) => r.status },
  ],
  texto: (r, L) => [r.mercadoria, cliente(L, r.clienteId), r.origem, r.destino, placaDe(L, r.veiculoId), r.status].join(' '),
  filtro: { k: 'status', l: 'Todas as situações', o: FRETE_STATUS },
};

export const lancamentos = {
  api: 'lancamentos', titulo: 'Lançamentos', sobre: 'Contas a pagar e a receber', um: 'lançamento', novo: 'Novo lançamento',
  nomeDe: (r) => r.descricao,
  campos: [
    { k: 'tipo', l: 'Tipo', t: 'select', o: ['Despesa', 'Receita'], obrig: true, padrao: 'Despesa', aoMudar: (_v, f) => ({ ...f, categoria: null }) },
    { k: 'categoria', l: 'Categoria', t: 'ref', obrig: true, o: (_L, f) => (f.tipo === 'Receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map((c) => [c, c]) },
    { k: 'descricao', l: 'Descrição', obrig: true, span: true },
    { k: 'valor', l: 'Valor (R$)', t: 'dinheiro', obrig: true },
    { k: 'data', l: 'Data de competência', t: 'data', obrig: true, padrao: hoje },
    { k: 'vencimento', l: 'Vencimento', t: 'data' },
    { k: 'veiculoId', l: 'Veículo (opcional)', t: 'ref', o: opVeiculos(true) },
    { k: 'pago', l: 'Pagamento efetuado', t: 'bool', padrao: false },
    { k: 'dataPagamento', l: 'Data do pagamento', t: 'data', mostrar: (f) => !!f.pago },
    { k: 'obs', l: 'Observações', t: 'texto-longo', span: true },
  ],
  colunas: [
    { l: 'Data', r: (r) => <span className="nw">{fd(r.data)}</span>, csv: (r) => fd(r.data) },
    { l: 'Descrição', r: (r, L) => <><strong>{r.descricao}</strong><span className="sub">{r.categoria}{r.veiculoId ? ' · ' + placaDe(L, r.veiculoId) : ''}</span></>, csv: (r) => r.descricao },
    { l: 'Categoria', r: (r) => r.categoria, csv: (r) => r.categoria },
    { l: 'Vencimento', r: (r) => (r.pago || !r.vencimento ? <span className="nw">{fd(r.vencimento)}</span> : vence(r.vencimento, 5)), csv: (r) => fd(r.vencimento) },
    { l: 'Valor', c: 'num', r: (r) => <span className={r.tipo === 'Receita' ? 'txt-ok' : ''}>{r.tipo === 'Receita' ? '+ ' : '− '}{brl(r.valor)}</span>, csv: (r) => (r.tipo === 'Receita' ? r.valor : -r.valor) },
    { l: 'Pagamento', r: (r) => (r.pago ? <Pill tom="ok">{r.tipo === 'Receita' ? 'Recebido' : 'Pago'} {fd(r.dataPagamento)}</Pill> : <Pill tom={r.vencimento && diasAte(r.vencimento) < 0 ? 'bad' : 'warn'}>{r.tipo === 'Receita' ? 'A receber' : 'A pagar'}</Pill>), csv: (r) => (r.pago ? 'Sim' : 'Não') },
  ],
  texto: (r) => [r.descricao, r.categoria, r.tipo, r.obs].join(' '),
  filtro: { l: 'Todos', o: ['Despesas', 'Receitas', 'A pagar', 'A receber', 'Vencidos'], casa: (r, v) => ({
    'Despesas': r.tipo === 'Despesa', 'Receitas': r.tipo === 'Receita', 'A pagar': r.tipo === 'Despesa' && !r.pago, 'A receber': r.tipo === 'Receita' && !r.pago,
    'Vencidos': !r.pago && r.vencimento && diasAte(r.vencimento) < 0,
  })[v] },
};

export const usuarios = {
  api: 'usuarios', titulo: 'Usuários', sobre: 'Acesso ao sistema', um: 'usuário', novo: 'Novo usuário',
  escrita: ['ADMIN'],
  nomeDe: (r) => r.nome,
  campos: [
    { k: 'nome', l: 'Nome', obrig: true, span: true },
    { k: 'email', l: 'E-mail', t: 'email', obrig: true },
    { k: 'perfil', l: 'Perfil', t: 'select', o: ['ADMIN', 'GESTOR', 'OPERADOR'], obrig: true, padrao: 'OPERADOR', dica: 'ADMIN: tudo · GESTOR: tudo menos usuários · OPERADOR: portaria, abastecimento, checklist e entregas' },
    { k: 'senha', l: 'Senha', t: 'senha', dica: 'Mínimo de 6 caracteres. Na edição, deixe vazio para manter.' },
    { k: 'ativo', l: 'Usuário ativo', t: 'bool', padrao: true },
  ],
  colunas: [
    { l: 'Nome', r: (r) => <strong>{r.nome}</strong>, csv: (r) => r.nome },
    { l: 'E-mail', r: (r) => r.email, csv: (r) => r.email },
    { l: 'Perfil', r: (r) => ({ ADMIN: 'Administrador', GESTOR: 'Gestor de frota', OPERADOR: 'Operador' })[r.perfil], csv: (r) => r.perfil },
    { l: 'Situação', r: (r) => <Pill tom={r.ativo ? 'ok' : 'mute'}>{r.ativo ? 'Ativo' : 'Inativo'}</Pill>, csv: (r) => (r.ativo ? 'Ativo' : 'Inativo') },
  ],
  texto: (r) => [r.nome, r.email, r.perfil].join(' '),
};
