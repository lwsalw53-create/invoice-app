import { useEffect, useState } from 'react';
import { api } from '../api';
import TableCard from '../components/TableCard';
import Modal from '../components/Modal';

const initialState = { name: '', description: '', unit_price: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialState);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  async function loadProducts() {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openModal(product = null) {
    if (product) {
      setForm({ ...product, unit_price: product.unit_price ?? '' });
      setEditingId(product.id);
    } else {
      setForm(initialState);
      setEditingId(null);
    }
    setShowModal(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = { ...form, unit_price: Number(form.unit_price) };

    try {
      if (editingId) {
        await api.updateProduct(editingId, payload);
      } else {
        await api.createProduct(payload);
      }
      setShowModal(false);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.deleteProduct(id);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <TableCard
        title="Products"
        actionLabel="Add product"
        onAction={() => openModal()}
        columns={['Name', 'Description', 'Unit price', 'Actions']}
        rows={products}
        emptyText="No products available."
        renderRow={(product) => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.description || '-'}</td>
            <td>${Number(product.unit_price).toFixed(2)}</td>
            <td>
              <div className="row-actions">
                <button type="button" className="ghost-btn" onClick={() => openModal(product)}>Edit</button>
                <button type="button" className="danger-btn" onClick={() => handleDelete(product.id)}>Delete</button>
              </div>
            </td>
          </tr>
        )}
      />
      {error && <p className="error-text">{error}</p>}
      {showModal && (
        <Modal title={editingId ? 'Edit product' : 'Add product'} onClose={() => setShowModal(false)}>
          <form className="form-grid" onSubmit={handleSubmit}>
            <input placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <textarea placeholder="Description" value={form.description || ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            <input placeholder="Unit price" type="number" min="0" step="0.01" value={form.unit_price} onChange={(e) => setForm((p) => ({ ...p, unit_price: e.target.value }))} required />
            <button type="submit">Save</button>
          </form>
        </Modal>
      )}
    </>
  );
}
