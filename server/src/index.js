import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { tratarErros } from './lib/http.js';
import { exigirLogin } from './lib/auth.js';
import { rotasCrud } from './lib/crud.js';
import { recursos } from './resources/index.js';
import { rotasAuth, rotasUsuarios } from './routes/usuarios.js';
import { rotasPainel } from './routes/painel.js';
import { rotasRelatorios } from './routes/relatorios.js';
import { rotasFinanceiro } from './routes/financeiro.js';

const prisma = new PrismaClient();
const app = express();
const PORTA = Number(process.env.PORT || 3333);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/saude', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', rotasAuth(prisma));

const api = express.Router();
api.use(exigirLogin);
api.use('/usuarios', rotasUsuarios(prisma));
api.use('/painel', rotasPainel(prisma));
api.use('/relatorios', rotasRelatorios(prisma));
api.use('/financeiro', rotasFinanceiro(prisma));
for (const [nome, recurso] of Object.entries(recursos)) api.use(`/${nome}`, rotasCrud(prisma, recurso));
app.use('/api', api);
app.use('/api', (_req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// Em producao, serve a interface React ja compilada (npm run build).
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(tratarErros);

app.listen(PORTA, () => console.log(`LocalizaCar API rodando em http://localhost:${PORTA}`));
