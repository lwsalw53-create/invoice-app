const pool = require('../config/db');

function toMoney(value) {
  return Number(value || 0).toFixed(2);
}

async function listInvoices(userId) {
  const [rows] = await pool.execute(
    `SELECT i.id, i.invoice_number, i.issue_date, i.due_date, i.subtotal, i.tax_total, i.grand_total,
            c.name AS customer_name
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     WHERE i.user_id = ?
     ORDER BY i.id DESC`,
    [userId]
  );
  return rows;
}

async function getInvoiceById(invoiceId, userId) {
  const [invoiceRows] = await pool.execute(
    `SELECT i.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone, c.address AS customer_address
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     WHERE i.id = ? AND i.user_id = ?`,
    [invoiceId, userId]
  );

  if (!invoiceRows[0]) {
    return null;
  }

  const [items] = await pool.execute(
    `SELECT ii.*, p.name AS product_name
     FROM invoice_items ii
     LEFT JOIN products p ON p.id = ii.product_id
     WHERE ii.invoice_id = ?
     ORDER BY ii.id ASC`,
    [invoiceId]
  );

  return { ...invoiceRows[0], items };
}

function calculateTotals(items) {
  let subtotal = 0;
  let taxTotal = 0;

  const normalized = items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unit_price);
    const taxRate = Number(item.tax_rate || 0);
    const lineSubtotal = quantity * unitPrice;
    const lineTax = (lineSubtotal * taxRate) / 100;
    const lineTotal = lineSubtotal + lineTax;

    subtotal += lineSubtotal;
    taxTotal += lineTax;

    return {
      product_id: item.product_id || null,
      description: item.description,
      quantity,
      unit_price: toMoney(unitPrice),
      tax_rate: toMoney(taxRate),
      line_subtotal: toMoney(lineSubtotal),
      line_tax: toMoney(lineTax),
      line_total: toMoney(lineTotal)
    };
  });

  const grandTotal = subtotal + taxTotal;
  return {
    items: normalized,
    totals: {
      subtotal: toMoney(subtotal),
      tax_total: toMoney(taxTotal),
      grand_total: toMoney(grandTotal)
    }
  };
}

async function createInvoice(userId, payload) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { customer_id, invoice_number, issue_date, due_date, notes, items } = payload;
    const { items: normalizedItems, totals } = calculateTotals(items);

    const [invoiceResult] = await connection.execute(
      `INSERT INTO invoices
      (user_id, customer_id, invoice_number, issue_date, due_date, notes, subtotal, tax_total, grand_total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, customer_id, invoice_number, issue_date, due_date, notes || null, totals.subtotal, totals.tax_total, totals.grand_total]
    );

    const invoiceId = invoiceResult.insertId;
    for (const item of normalizedItems) {
      await connection.execute(
        `INSERT INTO invoice_items
         (invoice_id, product_id, description, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          item.product_id,
          item.description,
          item.quantity,
          item.unit_price,
          item.tax_rate,
          item.line_subtotal,
          item.line_tax,
          item.line_total
        ]
      );
    }

    await connection.commit();
    return invoiceId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateInvoice(invoiceId, userId, payload) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { customer_id, invoice_number, issue_date, due_date, notes, items } = payload;
    const { items: normalizedItems, totals } = calculateTotals(items);

    const [updateResult] = await connection.execute(
      `UPDATE invoices
       SET customer_id = ?, invoice_number = ?, issue_date = ?, due_date = ?, notes = ?, subtotal = ?, tax_total = ?, grand_total = ?
       WHERE id = ? AND user_id = ?`,
      [customer_id, invoice_number, issue_date, due_date, notes || null, totals.subtotal, totals.tax_total, totals.grand_total, invoiceId, userId]
    );

    if (!updateResult.affectedRows) {
      await connection.rollback();
      return false;
    }

    await connection.execute('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

    for (const item of normalizedItems) {
      await connection.execute(
        `INSERT INTO invoice_items
         (invoice_id, product_id, description, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          item.product_id,
          item.description,
          item.quantity,
          item.unit_price,
          item.tax_rate,
          item.line_subtotal,
          item.line_tax,
          item.line_total
        ]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deleteInvoice(invoiceId, userId) {
  const [result] = await pool.execute('DELETE FROM invoices WHERE id = ? AND user_id = ?', [invoiceId, userId]);
  return result.affectedRows;
}

module.exports = {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  calculateTotals
};
