const invoiceModel = require('../models/invoiceModel');
const { generateInvoicePdf } = require('../services/pdfService');

function validateInvoicePayload(payload) {
  const required = ['customer_id', 'invoice_number', 'issue_date', 'due_date', 'items'];
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return `${field} is required`;
    }
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return 'items must be a non-empty array';
  }

  const invalidItem = payload.items.find(
    (item) => !item.description || Number(item.quantity) <= 0 || Number(item.unit_price) < 0
  );

  if (invalidItem) {
    return 'each item requires description, quantity > 0 and unit_price >= 0';
  }

  return null;
}

async function list(req, res) {
  const invoices = await invoiceModel.listInvoices(req.user.id);
  res.json(invoices);
}

async function get(req, res) {
  const invoice = await invoiceModel.getInvoiceById(req.params.id, req.user.id);
  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  return res.json(invoice);
}

async function create(req, res) {
  const validationMessage = validateInvoicePayload(req.body);
  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  const id = await invoiceModel.createInvoice(req.user.id, req.body);
  return res.status(201).json({ id });
}

async function update(req, res) {
  const validationMessage = validateInvoicePayload(req.body);
  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  const updated = await invoiceModel.updateInvoice(req.params.id, req.user.id, req.body);
  if (!updated) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  return res.json({ message: 'Invoice updated' });
}

async function remove(req, res) {
  const affectedRows = await invoiceModel.deleteInvoice(req.params.id, req.user.id);
  if (!affectedRows) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  return res.json({ message: 'Invoice deleted' });
}

async function downloadPdf(req, res) {
  const invoice = await invoiceModel.getInvoiceById(req.params.id, req.user.id);
  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
  generateInvoicePdf(invoice, res);
  return null;
}

module.exports = {
  list,
  get,
  create,
  update,
  remove,
  downloadPdf
};
