const pool = require('../config/db');

async function createUser({ name, email, passwordHash }) {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  );
  return result.insertId;
}

async function findUserByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

module.exports = {
  createUser,
  findUserByEmail
};
