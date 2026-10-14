# LocalizaCar Frotas

Sistema de gestão de frotas da LocalizaCar: veículos, motoristas, portaria (entradas e saídas), ordens de serviço, manutenção preventiva, abastecimentos, pneus, entregas e pedidos, fretes, financeiro e relatórios.

- **API:** Node.js 22, Express e Prisma (SQLite por padrão, troca para PostgreSQL com uma linha)
- **Interface:** React 18, Vite, React Router, TanStack Query e Recharts
- **Regras de negócio compartilhadas:** `shared/regras.js`, usado pela API e pela interface

## Como rodar

Requisitos: Node.js 20 ou mais novo.

```bash
npm run setup      # instala, cria o banco e carrega dados de exemplo
npm run dev        # API em http://localhost:3333 e interface em http://localhost:5173
```

Para começar com o banco vazio, só com os usuários, use `npm run setup:vazio` no lugar de `npm run setup`.

Acessos iniciais (senha `localizacar`; troque em "Trocar senha" no rodapé do menu):

| E-mail | Perfil | Pode |
|---|---|---|
| admin@localizacar.com.br | Administrador | tudo, inclusive usuários |
| gestor@localizacar.com.br | Gestor de frota | tudo, menos usuários |
| portaria@localizacar.com.br | Operador | registrar saídas e entradas, abastecimentos, checklist de pneus e entregas; consultar o resto |

### Produção

```bash
npm run build      # compila a interface em web/dist
npm start          # a API serve a interface e o /api na mesma porta (3333)
```

Antes de publicar, edite `server/.env`: troque `JWT_SECRET` por um texto longo e aleatório. Para PostgreSQL, mude `provider` em `server/prisma/schema.prisma` para `"postgresql"`, ajuste `DATABASE_URL` e rode `npx prisma migrate dev` dentro de `server/`.

Outros comandos úteis em `server/`: `npm run db:studio` abre o Prisma Studio para ver e editar o banco; `npm run seed:demo` recria os dados de exemplo e **apaga os dados operacionais**.

## Módulos

| Módulo | O que faz | Planilha que substitui |
|---|---|---|
| Painel | Situação da frota, alertas (manutenção, OS atrasada, CNH, licenciamento, seguro, documentação, sulco de pneu, contas vencidas), custos do mês e dos últimos 6 meses, entregas e fretes do mês | Dashboards de todas as planilhas |
| Entradas e saídas | Portaria com hodômetro, combustível e destino; veículos fora do pátio; percurso de cada viagem | — |
| Ordens de serviço | Preventiva, corretiva, preditiva e sinistro; prioridade; agendamento; valor previsto × realizado; peças e serviços; defeito e correção | Manutenção Corretiva, Manutenção de Oficinas, Manutenção Preventiva (agendamento) |
| Manutenções | Planos por km e/ou dias com próxima data e km calculadas; "Abrir OS" gera a preventiva | Manutenção Preventiva (cronograma) |
| Abastecimentos | Litros, valor, R$/litro, consumo km/l, situação do tanque | Controle de Combustível |
| Pneus | Número de fogo, DOT, posição no veículo, sulco, km rodados, recapagens e custo; serviços (recapagem, conserto, rodízio); checklist de inspeção | Gestão de Pneus |
| Entregas e pedidos | Rota origem → destino com UF, km, prazo e situação; pedido atualizado pela entrega | Gestão de Entregas |
| Fretes | Mercadoria, peso, valor do frete, R$/t, despesas de viagem e lucro | Gestão de Transportes |
| Financeiro | Fluxo de caixa anual por categoria, com OS, abastecimentos, pneus e fretes lançados automaticamente; contas a pagar e a receber | Fluxo de Caixa |
| Relatórios | Custo por veículo e por km, consumo, OS por tipo e prioridade, oficinas (previsto × realizado e prazo), entregas por motorista, fretes por cliente, pneus, lançamentos; por período | Tabelas dinâmicas |
| Cadastros | Veículos (documentação, licenciamento, seguro), motoristas (CNH, aptidão), clientes, fornecedores, usuários | Abas de cadastro |

Toda lista tem busca, filtro e exportação para Excel (CSV).

## Regras automáticas

- **Saída:** só para veículo *Disponível* e motorista ativo, apto e com CNH válida. O hodômetro não pode ser menor que o último registrado. O veículo passa para *Em uso*.
- **Entrada:** só para veículo com saída em aberto. O veículo volta para *Disponível* e o hodômetro é atualizado.
- **OS aberta:** o veículo vai para *Manutenção*. Ao concluir (exige ao menos um item), volta para *Disponível*, a data de conclusão é preenchida e o plano preventivo ligado à OS é reiniciado.
- **Plano preventivo:** *Próxima* quando faltam até 15 dias ou 1.000 km; *Vencida* quando passa da data ou do km.
- **Pneus:** uma posição do veículo só aceita um pneu montado. Ao desmontar, o km rodado vai para o acumulado. Uma recapagem concluída soma no contador e no custo do pneu (uma vez só).
- **Entregas:** realizada depois do prazo vira *Realizada com atraso* e atualiza o pedido ligado.
- **Fretes:** o lucro é o valor do frete menos combustível, pedágios e outras despesas.

Todas as regras rodam no servidor, dentro de uma transação: a gravação e os efeitos (veículo, plano, pneu, pedido) acontecem juntos ou não acontecem.

## Estrutura

```
shared/regras.js            regras e listas usadas pela API e pela interface
server/prisma/schema.prisma modelo de dados
server/prisma/seed.js       usuários iniciais e dados de exemplo
server/src/lib/crud.js      rotas de cadastro genéricas (listar, incluir, alterar, excluir)
server/src/resources/       campos, permissões e regras de cada módulo
server/src/routes/          login e usuários, painel, relatórios, financeiro
web/src/entidades.jsx       campos do formulário e colunas de cada tela
web/src/components/         menu, lista, formulário, placa Mercosul
web/src/pages/              painel, financeiro, relatórios e telas de operação
```

Para incluir um campo novo: acrescente no `schema.prisma` (e rode `npx prisma migrate dev`), em `server/src/resources/index.js` e em `web/src/entidades.jsx`.
