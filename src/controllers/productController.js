const productModel = require('../models/productModel');

async function list(req, res) {
  const products = await productModel.listProducts(req.user.id);
  res.json(products);
}

async function get(req, res) {
  const product = await productModel.getProductById(req.params.id, req.user.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  return res.json(product);
}

async function create(req, res) {
  const { name, unit_price } = req.body;
  if (!name || unit_price === undefined) {
    return res.status(400).json({ message: 'Name and unit_price are required' });
  }
  const id = await productModel.createProduct(req.user.id, req.body);
  return res.status(201).json({ id });
}

async function update(req, res) {
  const { name, unit_price } = req.body;
  if (!name || unit_price === undefined) {
    return res.status(400).json({ message: 'Name and unit_price are required' });
  }
  const affectedRows = await productModel.updateProduct(req.params.id, req.user.id, req.body);
  if (!affectedRows) {
    return res.status(404).json({ message: 'Product not found' });
  }
  return res.json({ message: 'Product updated' });
}

async function remove(req, res) {
  const affectedRows = await productModel.deleteProduct(req.params.id, req.user.id);
  if (!affectedRows) {
    return res.status(404).json({ message: 'Product not found' });
  }
  return res.json({ message: 'Product deleted' });
}

module.exports = {
  list,
  get,
  create,
  update,
  remove
};
