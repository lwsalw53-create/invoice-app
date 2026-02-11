import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import TableCard from '../components/TableCard';
import Modal from '../components/Modal';

const initialForm = {
  customer_id: '',
  invoice_number: '',
  issue_date: '',
  due_date: '',
  notes: '',
  items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }]
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);

  const customerMap = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c.name])), [customers]);

  async function loadData() {
    try {
      const [invoiceData, customerData] = await Promise.all([api.getInvoices(), api.getCustomers()]);
      setInvoices(invoiceData);
      setCustomers(customerData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  }

  async function openEdit(invoice) {
    try {
      setError('');
      setLoadingInvoiceId(invoice.id);
      const fullInvoice = await api.getInvoice(invoice.id);

      setEditingId(fullInvoice.id);
      setForm({
        ...fullInvoice,
        customer_id: fullInvoice.customer_id,
        items: fullInvoice.items?.length ? fullInvoice.items : initialForm.items
      });
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingInvoiceId(null);
    }
  }

  function setItem(index, key, value) {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [key]: value };
      return { ...prev, items };
    });
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unit_price: 0, tax_rate: 0 }] }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      ...form,
      customer_id: Number(form.customer_id),
      items: form.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        tax_rate: Number(item.tax_rate || 0)
      }))
    };

    try {
      if (editingId) {
        await api.updateInvoice(editingId, payload);
      } else {
        await api.createInvoice(payload);
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.deleteInvoice(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <TableCard
        title="Invoices"
        actionLabel="Create invoice"
        onAction={openCreate}
        columns={['Invoice #', 'Customer', 'Issue Date', 'Due Date', 'Total', 'Actions']}
        rows={invoices}
        emptyText="No invoices available."
        renderRow={(invoice) => (
          <tr key={invoice.id}>
            <td>{invoice.invoice_number}</td>
            <td>{invoice.customer_name || customerMap[invoice.customer_id] || '-'}</td>
            <td>{invoice.issue_date?.slice(0, 10)}</td>
            <td>{invoice.due_date?.slice(0, 10)}</td>
            <td>${Number(invoice.total_amount || 0).toFixed(2)}</td>
            <td>
              <div className="row-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => openEdit(invoice)}
                  disabled={loadingInvoiceId === invoice.id}
                >
                  {loadingInvoiceId === invoice.id ? 'Loading...' : 'Edit'}
                </button>
                <button type="button" className="danger-btn" onClick={() => handleDelete(invoice.id)}>Delete</button>
              </div>
            </td>
          </tr>
        )}
      />
      {error && <p className="error-text">{error}</p>}
      {showModal && (
        <Modal title={editingId ? 'Edit invoice' : 'Create invoice'} onClose={() => setShowModal(false)}>
          <form className="form-grid" onSubmit={handleSubmit}>
            <select value={form.customer_id} onChange={(e) => setForm((p) => ({ ...p, customer_id: e.target.value }))} required>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
            <input placeholder="Invoice number" value={form.invoice_number} onChange={(e) => setForm((p) => ({ ...p, invoice_number: e.target.value }))} required />
            <input type="date" value={form.issue_date?.slice(0, 10) || ''} onChange={(e) => setForm((p) => ({ ...p, issue_date: e.target.value }))} required />
            <input type="date" value={form.due_date?.slice(0, 10) || ''} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} required />
            <textarea placeholder="Notes" value={form.notes || ''} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            <div className="items-section">
              <h4>Items</h4>
              {form.items.map((item, index) => (
                <div className="item-row" key={`${index + 1}-${item.description}`}>
                  <input placeholder="Description" value={item.description} onChange={(e) => setItem(index, 'description', e.target.value)} required />
                  <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => setItem(index, 'quantity', e.target.value)} required />
                  <input type="number" min="0" step="0.01" placeholder="Price" value={item.unit_price} onChange={(e) => setItem(index, 'unit_price', e.target.value)} required />
                  <input type="number" min="0" step="0.01" placeholder="Tax %" value={item.tax_rate || 0} onChange={(e) => setItem(index, 'tax_rate', e.target.value)} />
                </div>
              ))}
              <button type="button" className="ghost-btn" onClick={addItem}>+ Add item</button>
            </div>
            <button type="submit">Save invoice</button>
          </form>
        </Modal>
      )}
    </>
  );
}
