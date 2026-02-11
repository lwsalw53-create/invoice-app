const pool = require('../config/db');

async function listProducts(userId) {
  const [rows] = await pool.execute('SELECT * FROM products WHERE user_id = ? ORDER BY id DESC', [userId]);
  return rows;
}

async function getProductById(id, userId) {
  const [rows] = await pool.execute('SELECT * FROM products WHERE id = ? AND user_id = ?', [id, userId]);
  return rows[0] || null;
}

async function createProduct(userId, product) {
  const { name, description, unit_price, tax_rate } = product;
  const [result] = await pool.execute(
    'INSERT INTO products (user_id, name, description, unit_price, tax_rate) VALUES (?, ?, ?, ?, ?)',
    [userId, name, description || null, unit_price, tax_rate || 0]
  );
  return result.insertId;
}

async function updateProduct(id, userId, product) {
  const { name, description, unit_price, tax_rate } = product;
  const [result] = await pool.execute(
    'UPDATE products SET name = ?, description = ?, unit_price = ?, tax_rate = ? WHERE id = ? AND user_id = ?',
    [name, description || null, unit_price, tax_rate || 0, id, userId]
  );
  return result.affectedRows;
}

async function deleteProduct(id, userId) {
  const [result] = await pool.execute('DELETE FROM products WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows;
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
