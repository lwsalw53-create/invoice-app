const { useEffect, useMemo, useState } = React;

const API = '/api';

function currency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(body?.message || 'Request failed');
  }

  return body;
}

function AuthPanel({ onAuth, setToast }) {
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  async function handleRegister(event) {
    event.preventDefault();
    try {
      const data = await apiRequest('/auth/register', null, {
        method: 'POST',
        body: JSON.stringify(registerData)
      });
      onAuth(data.token);
      setToast({ type: 'success', text: 'Account created and logged in.' });
    } catch (error) {
      setToast({ type: 'error', text: error.message });
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    try {
      const data = await apiRequest('/auth/login', null, {
        method: 'POST',
        body: JSON.stringify(loginData)
      });
      onAuth(data.token);
      setToast({ type: 'success', text: 'Welcome back.' });
    } catch (error) {
      setToast({ type: 'error', text: error.message });
    }
  }

  return (
    <div className="app-layout auth-card">
      <div className="card">
        <div className="brand" style={{ marginBottom: '1rem' }}>
          <h1>InvoiceFlow</h1>
          <p>Modern invoice workspace for customers, products, and billing.</p>
        </div>
        <div className="auth-grid">
          <form className="form" onSubmit={handleRegister}>
            <h2>Create account</h2>
            <input
              value={registerData.name}
              onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
              placeholder="Full name"
              required
            />
            <input
              type="email"
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              placeholder="Email"
              required
            />
            <input
              type="password"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              placeholder="Password"
              required
            />
            <button className="btn-primary" type="submit">Register</button>
          </form>

          <form className="form" onSubmit={handleLogin}>
            <h2>Sign in</h2>
            <input
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              placeholder="Email"
              required
            />
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              placeholder="Password"
              required
            />
            <button className="btn-primary" type="submit">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ token, onLogout, setToast }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [customerForm, setCustomerForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [productForm, setProductForm] = useState({ name: '', description: '', unit_price: '', tax_rate: '' });
  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: '',
    invoice_number: '',
    issue_date: '',
    due_date: '',
    notes: '',
    items: '[{"description":"Consulting","quantity":1,"unit_price":500,"tax_rate":10}]'
  });

  async function loadData() {
    try {
      const [cs, ps, inv] = await Promise.all([
        apiRequest('/customers', token),
        apiRequest('/products', token),
        apiRequest('/invoices', token)
      ]);
      setCustomers(cs);
      setProducts(ps);
      setInvoices(inv);
      if (!invoiceForm.customer_id && cs[0]) {
        setInvoiceForm((prev) => ({ ...prev, customer_id: String(cs[0].id) }));
      }
    } catch (error) {
      setToast({ type: 'error', text: error.message });
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const revenue = invoices.reduce((sum, inv) => sum + Number(inv.grand_total || 0), 0);
    return {
      customers: customers.length,
      products: products.length,
      invoices: invoices.length,
      revenue
    };
  }, [customers, products, invoices]);

  async function createCustomer(event) {
    event.preventDefault();
    try {
      await apiRequest('/customers', token, { method: 'POST', body: JSON.stringify(customerForm) });
      setCustomerForm({ name: '', email: '', phone: '', address: '' });
      await loadData();
      setToast({ type: 'success', text: 'Customer created.' });
    } catch (error) {
      setToast({ type: 'error', text: error.message });
    }
  }

  async function removeCustomer(id) {
    try {
      await apiRequest(`/customers/${id}`, token, { method: 'DELETE' });
      await loadData();
      setToast({ type: 'success', text: 'Customer removed.' });
    } catch (error) {
      setToast({ type: 'error', text: error.message });
    }
  }

  async function createProduct(event) {
    event.preventDefault();
    try {
      await apiRequest('/products', token, {
        method: 'POST',
        body: JSON.stringify({
          ...productForm,
          unit_price: Number(productForm.unit_price),
          tax_rate: Number(productForm.tax_rate || 0)
        })
      });
      setProductForm({ name: '', description: '', unit_price: '', tax_rate: '' });
      await loadData();
      setToast({ type: 'success', text: 'Product created.' });
    } catch (error) {
      setToast({ type: 'error', text: error.message });
    }
  }

  async function removeProduct(id) {
    try {
      await apiRequest(`/products/${id}`, token, { method: 'DELETE' });
      await loadData();
      setToast({ type: 'success', text: 'Product removed.' });
    } catch (error) {
      setToast({ type: 'error', text: error.message });
    }
  }

  async function createInvoice(event) {
    event.preventDefault();
    try {
      const payload = {
        ...invoiceForm,
        customer_id: Number(invoiceForm.customer_id),
        items: JSON.parse(invoiceForm.items)
      };

      await apiRequest('/invoices', token, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setInvoiceForm((prev) => ({
        ...prev,
        invoice_number: '',
        notes: ''
      }));
      await loadData();
      setToast({ type: 'success', text: 'Invoice created.' });
    } catch (error) {
      setToast({ type: 'error', text: error.message || 'Invalid invoice items JSON.' });
    }
  }

  async function removeInvoice(id) {
    try {
      await apiRequest(`/invoices/${id}`, token, { method: 'DELETE' });
      await loadData();
      setToast({ type: 'success', text: 'Invoice removed.' });
    } catch (error) {
      setToast({ type: 'error', text: error.message });
    }
  }

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="brand">
          <h1>InvoiceFlow Dashboard</h1>
          <p>Manage clients, catalog, and invoicing from one place.</p>
        </div>
        <button className="btn-danger" onClick={onLogout}>Logout</button>
      </header>

      <section className="kpis">
        <div className="kpi"><div className="label">Customers</div><div className="value">{stats.customers}</div></div>
        <div className="kpi"><div className="label">Products</div><div className="value">{stats.products}</div></div>
        <div className="kpi"><div className="label">Invoices</div><div className="value">{stats.invoices}</div></div>
        <div className="kpi"><div className="label">Revenue</div><div className="value">{currency(stats.revenue)}</div></div>
      </section>

      <section className="dashboard-grid">
        <div className="card split">
          <h2>Customers</h2>
          <form className="form" onSubmit={createCustomer}>
            <input value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} placeholder="Name" required />
            <input value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} placeholder="Email" />
            <input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="Phone" />
            <input value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} placeholder="Address" />
            <button className="btn-primary" type="submit">Add customer</button>
          </form>
          <ul className="list" style={{ marginTop: '0.8rem' }}>
            {customers.map((c) => (
              <li key={c.id}>
                <div>
                  <strong>{c.name}</strong><br />
                  <small>{c.email || 'No email'}</small>
                </div>
                <div className="actions">
                  <button className="btn-secondary" onClick={() => removeCustomer(c.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card split">
          <h2>Products</h2>
          <form className="form" onSubmit={createProduct}>
            <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="Name" required />
            <input value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Description" />
            <input type="number" step="0.01" value={productForm.unit_price} onChange={(e) => setProductForm({ ...productForm, unit_price: e.target.value })} placeholder="Unit price" required />
            <input type="number" step="0.01" value={productForm.tax_rate} onChange={(e) => setProductForm({ ...productForm, tax_rate: e.target.value })} placeholder="Tax rate %" />
            <button className="btn-primary" type="submit">Add product</button>
          </form>
          <ul className="list" style={{ marginTop: '0.8rem' }}>
            {products.map((p) => (
              <li key={p.id}>
                <div>
                  <strong>{p.name}</strong><br />
                  <small>{currency(p.unit_price)} · Tax {Number(p.tax_rate).toFixed(2)}%</small>
                </div>
                <button className="btn-secondary" onClick={() => removeProduct(p.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card wide">
          <h2>Create Invoice</h2>
          <form className="form" onSubmit={createInvoice}>
            <input value={invoiceForm.invoice_number} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })} placeholder="Invoice number" required />
            <select value={invoiceForm.customer_id} onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_id: e.target.value })} required>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" value={invoiceForm.issue_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, issue_date: e.target.value })} required />
            <input type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} required />
            <textarea value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} placeholder="Notes" />
            <textarea value={invoiceForm.items} onChange={(e) => setInvoiceForm({ ...invoiceForm, items: e.target.value })} required />
            <button className="btn-primary" type="submit">Create invoice</button>
          </form>
        </div>

        <div className="card wide">
          <h2>Invoices</h2>
          <ul className="list">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <div>
                  <strong>#{inv.invoice_number} · {inv.customer_name}</strong><br />
                  <small>Total {currency(inv.grand_total)} · Due {String(inv.due_date).slice(0, 10)}</small>
                </div>
                <div className="actions">
                  <a className="btn-secondary" href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>PDF</a>
                  <button className="btn-secondary" onClick={() => removeInvoice(inv.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [toast, setToast] = useState(null);

  function handleAuth(nextToken) {
    localStorage.setItem('token', nextToken);
    setToken(nextToken);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
    setToast({ type: 'success', text: 'Signed out.' });
  }

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <>
      {token ? (
        <Dashboard token={token} onLogout={handleLogout} setToast={setToast} />
      ) : (
        <AuthPanel onAuth={handleAuth} setToast={setToast} />
      )}
      {toast && (
        <div className={`app-layout toast ${toast.type}`}>
          {toast.text}
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
