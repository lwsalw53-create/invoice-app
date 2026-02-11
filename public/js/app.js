const authView = document.getElementById('authView');
const dashboardView = document.getElementById('dashboardView');
const toast = document.getElementById('toast');

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const customerForm = document.getElementById('customerForm');
const productForm = document.getElementById('productForm');
const invoiceForm = document.getElementById('invoiceForm');

const customerList = document.getElementById('customerList');
const productList = document.getElementById('productList');
const invoiceList = document.getElementById('invoiceList');
const invoiceCustomer = document.getElementById('invoiceCustomer');

const kpiCustomers = document.getElementById('kpiCustomers');
const kpiProducts = document.getElementById('kpiProducts');
const kpiInvoices = document.getElementById('kpiInvoices');
const kpiRevenue = document.getElementById('kpiRevenue');

const API = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : `${window.location.origin}/api`;
let token = localStorage.getItem('token') || null;

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function showToast(text, type = 'success') {
  toast.textContent = text;
  toast.className = `app-layout toast ${type}`;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

function setView(authenticated) {
  authView.style.display = authenticated ? 'none' : 'block';
  dashboardView.style.display = authenticated ? 'block' : 'none';
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
}

function renderCustomers(customers) {
  customerList.innerHTML = customers
    .map(
      (c) => `<li>
        <div><strong>${c.name}</strong><br/><small>${c.email || 'No email'}</small></div>
        <button class="btn-secondary" data-customer-del="${c.id}">Delete</button>
      </li>`
    )
    .join('');

  invoiceCustomer.innerHTML = `<option value="">Select customer</option>${customers
    .map((c) => `<option value="${c.id}">${c.name}</option>`)
    .join('')}`;
}

function renderProducts(products) {
  productList.innerHTML = products
    .map(
      (p) => `<li>
        <div><strong>${p.name}</strong><br/><small>${money(p.unit_price)} · Tax ${Number(p.tax_rate).toFixed(2)}%</small></div>
        <button class="btn-secondary" data-product-del="${p.id}">Delete</button>
      </li>`
    )
    .join('');
}

function renderInvoices(invoices) {
  invoiceList.innerHTML = invoices
    .map(
      (inv) => `<li>
        <div><strong>#${inv.invoice_number} · ${inv.customer_name}</strong><br/><small>Total ${money(inv.grand_total)} · Due ${String(inv.due_date).slice(0, 10)}</small></div>
        <div class="actions">
          <a class="btn-secondary" style="text-decoration:none" href="${API}/invoices/${inv.id}/pdf" target="_blank" rel="noreferrer">PDF</a>
          <button class="btn-secondary" data-invoice-del="${inv.id}">Delete</button>
        </div>
      </li>`
    )
    .join('');
}

function renderKpis(customers, products, invoices) {
  kpiCustomers.textContent = String(customers.length);
  kpiProducts.textContent = String(products.length);
  kpiInvoices.textContent = String(invoices.length);
  const revenue = invoices.reduce((sum, inv) => sum + Number(inv.grand_total || 0), 0);
  kpiRevenue.textContent = money(revenue);
}

async function loadDashboard() {
  const [customers, products, invoices] = await Promise.all([
    request('/customers'),
    request('/products'),
    request('/invoices')
  ]);

  renderCustomers(customers);
  renderProducts(products);
  renderInvoices(invoices);
  renderKpis(customers, products, invoices);
}

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(registerForm).entries());
  try {
    const data = await request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    token = data.token;
    localStorage.setItem('token', token);
    setView(true);
    await loadDashboard();
    registerForm.reset();
    showToast('Account created and logged in.');
  } catch (error) {
    showToast(error.message, 'error');
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(loginForm).entries());
  try {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    token = data.token;
    localStorage.setItem('token', token);
    setView(true);
    await loadDashboard();
    loginForm.reset();
    showToast('Welcome back.');
  } catch (error) {
    showToast(error.message, 'error');
  }
});

customerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(customerForm).entries());
  try {
    await request('/customers', { method: 'POST', body: JSON.stringify(payload) });
    customerForm.reset();
    await loadDashboard();
    showToast('Customer created.');
  } catch (error) {
    showToast(error.message, 'error');
  }
});

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(productForm).entries());
  payload.unit_price = Number(payload.unit_price);
  payload.tax_rate = Number(payload.tax_rate || 0);

  try {
    await request('/products', { method: 'POST', body: JSON.stringify(payload) });
    productForm.reset();
    await loadDashboard();
    showToast('Product created.');
  } catch (error) {
    showToast(error.message, 'error');
  }
});

invoiceForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(invoiceForm).entries());
  payload.customer_id = Number(payload.customer_id);

  try {
    payload.items = JSON.parse(payload.items);
    await request('/invoices', { method: 'POST', body: JSON.stringify(payload) });
    invoiceForm.reset();
    await loadDashboard();
    showToast('Invoice created.');
  } catch (error) {
    showToast(error.message || 'Invalid invoice items JSON.', 'error');
  }
});

customerList.addEventListener('click', async (event) => {
  const id = event.target.getAttribute('data-customer-del');
  if (!id) return;
  try {
    await request(`/customers/${id}`, { method: 'DELETE' });
    await loadDashboard();
    showToast('Customer removed.');
  } catch (error) {
    showToast(error.message, 'error');
  }
});

productList.addEventListener('click', async (event) => {
  const id = event.target.getAttribute('data-product-del');
  if (!id) return;
  try {
    await request(`/products/${id}`, { method: 'DELETE' });
    await loadDashboard();
    showToast('Product removed.');
  } catch (error) {
    showToast(error.message, 'error');
  }
});

invoiceList.addEventListener('click', async (event) => {
  const id = event.target.getAttribute('data-invoice-del');
  if (!id) return;
  try {
    await request(`/invoices/${id}`, { method: 'DELETE' });
    await loadDashboard();
    showToast('Invoice removed.');
  } catch (error) {
    showToast(error.message, 'error');
  }
});

logoutBtn.addEventListener('click', () => {
  token = null;
  localStorage.removeItem('token');
  setView(false);
  showToast('Signed out.');
});

if (token) {
  setView(true);
  loadDashboard().catch((error) => {
    token = null;
    localStorage.removeItem('token');
    setView(false);
    showToast(error.message, 'error');
  });
} else {
  setView(false);
}
