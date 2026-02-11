const bcrypt = require('bcryptjs');
const { createUser, findUserByEmail } = require('../models/userModel');
const { signToken } = require('../services/tokenService');

async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await createUser({ name, email, passwordHash });
  const token = signToken({ id: userId, email });

  return res.status(201).json({ token, user: { id: userId, name, email } });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken({ id: user.id, email: user.email });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}

module.exports = {
  register,
  login
};
