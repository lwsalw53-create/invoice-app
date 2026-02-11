const pool = require('../config/db');

async function listCustomers(userId) {
  const [rows] = await pool.execute('SELECT * FROM customers WHERE user_id = ? ORDER BY id DESC', [userId]);
  return rows;
}

async function getCustomerById(id, userId) {
  const [rows] = await pool.execute('SELECT * FROM customers WHERE id = ? AND user_id = ?', [id, userId]);
  return rows[0] || null;
}

async function createCustomer(userId, customer) {
  const { name, email, phone, address } = customer;
  const [result] = await pool.execute(
    'INSERT INTO customers (user_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
    [userId, name, email || null, phone || null, address || null]
  );
  return result.insertId;
}

async function updateCustomer(id, userId, customer) {
  const { name, email, phone, address } = customer;
  const [result] = await pool.execute(
    'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ? AND user_id = ?',
    [name, email || null, phone || null, address || null, id, userId]
  );
  return result.affectedRows;
}

async function deleteCustomer(id, userId) {
  const [result] = await pool.execute('DELETE FROM customers WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows;
}

module.exports = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
