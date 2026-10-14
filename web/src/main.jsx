import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import { ToastProvider } from './components/ui.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Painel from './pages/Painel.jsx';
import Financeiro from './pages/Financeiro.jsx';
import Relatorios from './pages/Relatorios.jsx';
import * as P from './pages/Operacao.jsx';
import './styles/app.css';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: true, retry: (n, e) => e?.status !== 401 && e?.status !== 403 && n < 2 } },
});

function Rotas() {
  const { usuario, pode } = useAuth();
  if (!usuario) return <Login />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Painel />} />
        <Route path="movimentos" element={<P.Movimentos />} />
        <Route path="ordens" element={<P.Ordens />} />
        <Route path="manutencoes" element={<P.Manutencoes />} />
        <Route path="abastecimentos" element={<P.Abastecimentos />} />
        <Route path="pneus" element={<P.Pneus />} />
        <Route path="pneus/servicos" element={<P.ServicosPneu />} />
        <Route path="pneus/checklist" element={<P.Inspecoes />} />
        <Route path="entregas" element={<P.Entregas />} />
        <Route path="entregas/pedidos" element={<P.Pedidos />} />
        <Route path="fretes" element={<P.Fretes />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="veiculos" element={<P.Veiculos />} />
        <Route path="motoristas" element={<P.Motoristas />} />
        <Route path="clientes" element={<P.Clientes />} />
        <Route path="fornecedores" element={<P.Fornecedores />} />
        {pode(['ADMIN']) ? <Route path="usuarios" element={<P.Usuarios />} /> : null}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Rotas />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
