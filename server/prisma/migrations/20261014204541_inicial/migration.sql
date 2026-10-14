-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" TEXT NOT NULL DEFAULT 'OPERADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Veiculo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "ano" INTEGER,
    "tipo" TEXT,
    "cor" TEXT,
    "combustivel" TEXT,
    "renavam" TEXT,
    "chassi" TEXT,
    "km" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Disponível',
    "documentacao" TEXT NOT NULL DEFAULT 'OK',
    "licenciamento" TEXT,
    "seguro" TEXT,
    "motoristaAtualId" TEXT,
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Motorista" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "cnh" TEXT NOT NULL,
    "categoria" TEXT,
    "validadeCnh" TEXT NOT NULL,
    "aptidao" TEXT NOT NULL DEFAULT 'Apto',
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cnpj" TEXT,
    "contato" TEXT,
    "telefone" TEXT,
    "cidade" TEXT,
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "contato" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Movimento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "dataHora" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "km" INTEGER NOT NULL,
    "combustivel" TEXT,
    "destino" TEXT,
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlanoManutencao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "veiculoId" TEXT NOT NULL,
    "servico" TEXT NOT NULL,
    "intervaloKm" INTEGER,
    "intervaloDias" INTEGER,
    "ultimaData" TEXT,
    "ultimaKm" INTEGER,
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrdemServico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'Corretiva',
    "prioridade" TEXT NOT NULL DEFAULT 'Média',
    "fornecedorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aberta',
    "agendadaPara" TEXT,
    "abertura" TEXT NOT NULL,
    "previsao" TEXT,
    "conclusao" TEXT,
    "km" INTEGER,
    "solicitante" TEXT,
    "responsavel" TEXT,
    "descricao" TEXT NOT NULL,
    "correcao" TEXT,
    "valorPrevisto" REAL,
    "itens" TEXT NOT NULL DEFAULT '[]',
    "planoId" TEXT,
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Abastecimento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "veiculoId" TEXT NOT NULL,
    "motoristaId" TEXT,
    "fornecedorId" TEXT,
    "data" TEXT NOT NULL,
    "combustivel" TEXT,
    "km" INTEGER NOT NULL,
    "litros" REAL NOT NULL,
    "valor" REAL NOT NULL,
    "tanque" TEXT,
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Pneu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT,
    "medida" TEXT,
    "dot" TEXT,
    "validade" TEXT,
    "valor" REAL,
    "status" TEXT NOT NULL DEFAULT 'Estoque',
    "veiculoId" TEXT,
    "posicao" TEXT,
    "sulcoInicial" REAL,
    "sulcoAtual" REAL,
    "kmInstalacao" INTEGER,
    "kmAcumulado" INTEGER NOT NULL DEFAULT 0,
    "recapagens" INTEGER NOT NULL DEFAULT 0,
    "custoRecapagens" REAL NOT NULL DEFAULT 0,
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ServicoPneu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pneuId" TEXT NOT NULL,
    "veiculoId" TEXT,
    "data" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "classe" TEXT NOT NULL DEFAULT 'Preventiva',
    "fornecedorId" TEXT,
    "descricao" TEXT,
    "custo" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Concluído',
    "aplicado" BOOLEAN NOT NULL DEFAULT false,
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InspecaoPneu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "motoristaId" TEXT,
    "itens" TEXT NOT NULL DEFAULT '[]',
    "resultado" TEXT NOT NULL DEFAULT 'Conforme',
    "naoConformes" INTEGER NOT NULL DEFAULT 0,
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "endereco" TEXT,
    "contato" TEXT,
    "dataSaida" TEXT,
    "prazo" TEXT,
    "dataEntrega" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "clienteId" TEXT,
    "pedidoId" TEXT,
    "origem" TEXT,
    "ufOrigem" TEXT,
    "destino" TEXT NOT NULL,
    "ufDestino" TEXT,
    "produto" TEXT,
    "qtdProdutos" INTEGER,
    "kmRodados" INTEGER,
    "prazo" TEXT,
    "dataEntrega" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Em andamento',
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Frete" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "clienteId" TEXT,
    "veiculoId" TEXT NOT NULL,
    "motoristaId" TEXT,
    "mercadoria" TEXT NOT NULL,
    "quantidade" REAL,
    "pesoT" REAL,
    "valorMercadoria" REAL,
    "origem" TEXT,
    "ufOrigem" TEXT,
    "destino" TEXT,
    "ufDestino" TEXT,
    "valorFrete" REAL NOT NULL DEFAULT 0,
    "despCombustivel" REAL NOT NULL DEFAULT 0,
    "despPedagio" REAL NOT NULL DEFAULT 0,
    "despOutras" REAL NOT NULL DEFAULT 0,
    "lucro" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Lancamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "vencimento" TEXT,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" TEXT,
    "veiculoId" TEXT,
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_placa_key" ON "Veiculo"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_numero_key" ON "OrdemServico"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Pneu_codigo_key" ON "Pneu"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_codigo_key" ON "Pedido"("codigo");
