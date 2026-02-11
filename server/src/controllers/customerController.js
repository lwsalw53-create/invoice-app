const customerModel = require('../models/customerModel');

async function list(req, res) {
  const customers = await customerModel.listCustomers(req.user.id);
  res.json(customers);
}

async function get(req, res) {
  const customer = await customerModel.getCustomerById(req.params.id, req.user.id);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  return res.json(customer);
}

async function create(req, res) {
  if (!req.body.name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  const id = await customerModel.createCustomer(req.user.id, req.body);
  return res.status(201).json({ id });
}

async function update(req, res) {
  if (!req.body.name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  const affectedRows = await customerModel.updateCustomer(req.params.id, req.user.id, req.body);
  if (!affectedRows) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  return res.json({ message: 'Customer updated' });
}

async function remove(req, res) {
  const affectedRows = await customerModel.deleteCustomer(req.params.id, req.user.id);
  if (!affectedRows) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  return res.json({ message: 'Customer deleted' });
}

module.exports = {
  list,
  get,
  create,
  update,
  remove
};
