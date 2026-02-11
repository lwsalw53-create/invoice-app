import { useEffect, useState } from 'react';
import { api } from '../api';
import TableCard from '../components/TableCard';
import Modal from '../components/Modal';

const initialState = { name: '', email: '', phone: '', address: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(initialState);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  async function loadCustomers() {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function openCreateModal() {
    setForm(initialState);
    setEditingId(null);
    setShowModal(true);
  }

  function openEditModal(customer) {
    setForm(customer);
    setEditingId(customer.id);
    setShowModal(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.updateCustomer(editingId, form);
      } else {
        await api.createCustomer(form);
      }
      setShowModal(false);
      await loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await api.deleteCustomer(id);
      await loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <TableCard
        title="Customers"
        actionLabel="Add customer"
        onAction={openCreateModal}
        columns={['Name', 'Email', 'Phone', 'Address', 'Actions']}
        rows={customers}
        emptyText="No customers available."
        renderRow={(customer) => (
          <tr key={customer.id}>
            <td>{customer.name}</td>
            <td>{customer.email || '-'}</td>
            <td>{customer.phone || '-'}</td>
            <td>{customer.address || '-'}</td>
            <td>
              <div className="row-actions">
                <button type="button" className="ghost-btn" onClick={() => openEditModal(customer)}>Edit</button>
                <button type="button" className="danger-btn" onClick={() => handleDelete(customer.id)}>Delete</button>
              </div>
            </td>
          </tr>
        )}
      />
      {error && <p className="error-text">{error}</p>}
      {showModal && (
        <Modal title={editingId ? 'Edit customer' : 'Add customer'} onClose={() => setShowModal(false)}>
          <form className="form-grid" onSubmit={handleSubmit}>
            <input placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <input placeholder="Email" type="email" value={form.email || ''} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            <input placeholder="Phone" value={form.phone || ''} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            <textarea placeholder="Address" value={form.address || ''} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            <button type="submit">Save</button>
          </form>
        </Modal>
      )}
    </>
  );
}
