const API = '/api';
let token = localStorage.getItem('token') || null;

const message = document.getElementById('message');
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const logoutBtn = document.getElementById('logoutBtn');

const customerList = document.getElementById('customerList');
const productList = document.getElementById('productList');
const invoiceList = document.getElementById('invoiceList');
const invoiceCustomerSelect = document.getElementById('invoiceCustomerSelect');

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? '#dc2626' : '#059669';
}

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Request failed');
  }

  if (res.status === 204) return null;
  const type = res.headers.get('content-type') || '';
  return type.includes('application/json') ? res.json() : res.blob();
}

function setAuthState(isAuthenticated) {
  authSection.classList.toggle('hidden', isAuthenticated);
  appSection.classList.toggle('hidden', !isAuthenticated);
  logoutBtn.classList.toggle('hidden', !isAuthenticated);
}

async function loadCustomers() {
  const customers = await request('/customers');
  customerList.innerHTML = customers.map((c) => `<li>${c.name} (${c.email || 'n/a'})</li>`).join('');
  invoiceCustomerSelect.innerHTML = customers.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function loadProducts() {
  const products = await request('/products');
  productList.innerHTML = products
    .map((p) => `<li>${p.name} - $${Number(p.unit_price).toFixed(2)} (${p.tax_rate}% tax)</li>`)
    .join('');
}

async function loadInvoices() {
  const invoices = await request('/invoices');
  invoiceList.innerHTML = invoices
    .map(
      (inv) =>
        `<li>#${inv.invoice_number} | ${inv.customer_name} | Total: $${Number(inv.grand_total).toFixed(
          2
        )} <a href="/api/invoices/${inv.id}/pdf" target="_blank">PDF</a></li>`
    )
    .join('');
}

async function bootstrapData() {
  await Promise.all([loadCustomers(), loadProducts(), loadInvoices()]);
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());

  try {
    const data = await request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    token = data.token;
    localStorage.setItem('token', token);
    setAuthState(true);
    await bootstrapData();
    showMessage('Registration successful');
    e.target.reset();
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());

  try {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    token = data.token;
    localStorage.setItem('token', token);
    setAuthState(true);
    await bootstrapData();
    showMessage('Login successful');
    e.target.reset();
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById('customerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  try {
    await request('/customers', { method: 'POST', body: JSON.stringify(payload) });
    await loadCustomers();
    showMessage('Customer added');
    e.target.reset();
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  payload.unit_price = Number(payload.unit_price);
  payload.tax_rate = Number(payload.tax_rate || 0);

  try {
    await request('/products', { method: 'POST', body: JSON.stringify(payload) });
    await loadProducts();
    showMessage('Product added');
    e.target.reset();
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById('invoiceForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  payload.customer_id = Number(payload.customer_id);

  try {
    payload.items = JSON.parse(payload.items);
    await request('/invoices', { method: 'POST', body: JSON.stringify(payload) });
    await loadInvoices();
    showMessage('Invoice created');
    e.target.reset();
  } catch (error) {
    showMessage(error.message || 'Invalid items JSON', true);
  }
});

logoutBtn.addEventListener('click', () => {
  token = null;
  localStorage.removeItem('token');
  setAuthState(false);
  showMessage('Logged out');
});

if (token) {
  setAuthState(true);
  bootstrapData().catch((error) => {
    showMessage(error.message, true);
    token = null;
    localStorage.removeItem('token');
    setAuthState(false);
  });
}
