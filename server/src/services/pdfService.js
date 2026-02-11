const PDFDocument = require('pdfkit');

function currency(value) {
  return `$${Number(value).toFixed(2)}`;
}

function generateInvoicePdf(invoice, stream) {
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(stream);

  doc.fontSize(20).text('INVOICE', { align: 'right' });
  doc.moveDown();
  doc.fontSize(10).text(`Invoice #: ${invoice.invoice_number}`);
  doc.text(`Issue Date: ${new Date(invoice.issue_date).toISOString().slice(0, 10)}`);
  doc.text(`Due Date: ${new Date(invoice.due_date).toISOString().slice(0, 10)}`);
  doc.moveDown();

  doc.fontSize(12).text('Bill To:');
  doc.fontSize(10).text(invoice.customer_name);
  if (invoice.customer_email) doc.text(invoice.customer_email);
  if (invoice.customer_phone) doc.text(invoice.customer_phone);
  if (invoice.customer_address) doc.text(invoice.customer_address);

  doc.moveDown();
  doc.fontSize(11).text('Items', { underline: true });
  doc.moveDown(0.5);

  invoice.items.forEach((item) => {
    doc.fontSize(10).text(`${item.description} (${item.quantity} x ${currency(item.unit_price)})`);
    doc.text(`Tax ${item.tax_rate}% | Line Total: ${currency(item.line_total)}`);
    doc.moveDown(0.3);
  });

  doc.moveDown();
  doc.fontSize(11).text(`Subtotal: ${currency(invoice.subtotal)}`, { align: 'right' });
  doc.text(`Tax: ${currency(invoice.tax_total)}`, { align: 'right' });
  doc.font('Helvetica-Bold').text(`Grand Total: ${currency(invoice.grand_total)}`, { align: 'right' });
  doc.font('Helvetica');

  if (invoice.notes) {
    doc.moveDown();
    doc.fontSize(10).text(`Notes: ${invoice.notes}`);
  }

  doc.end();
}

module.exports = {
  generateInvoicePdf
};
