import { Navigate, Route, Routes } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { api } from './api';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import CustomersPage from './pages/CustomersPage';
import ProductsPage from './pages/ProductsPage';
import InvoicesPage from './pages/InvoicesPage';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const authenticated = useMemo(() => Boolean(token), [token]);

  async function handleLogin(payload) {
    const response = await api.login(payload);
    localStorage.setItem('token', response.token);
    setToken(response.token);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setToken('');
  }

  if (!authenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/customers" replace />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="*" element={<Navigate to="/customers" replace />} />
      </Routes>
    </Layout>
  );
}
