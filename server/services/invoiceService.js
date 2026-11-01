const PDFDocument = require('pdfkit');

// Builds a PDF invoice for a Sale (with SaleItems, Customer, User preloaded)
// and streams it directly to the HTTP response.
const generateInvoicePDF = (sale, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=invoice-${sale.invoice_number}.pdf`);
  doc.pipe(res);

  // ---------- Header ----------
  doc
    .fontSize(20)
    .fillColor('#1a1a1a')
    .text('INVOICE', 50, 50)
    .fontSize(10)
    .fillColor('#555')
    .text('Your Store Name', 50, 80)
    .text('123 Business Street, City, Country', 50, 95)
    .text('Phone: +000 000 0000  |  Email: store@example.com', 50, 110);

  doc
    .fontSize(10)
    .fillColor('#1a1a1a')
    .text(`Invoice #: ${sale.invoice_number}`, 350, 50, { align: 'right' })
    .text(`Date: ${new Date(sale.created_at).toLocaleString()}`, 350, 65, { align: 'right' })
    .text(`Cashier: ${sale.User?.name || '-'}`, 350, 80, { align: 'right' })
    .text(`Payment: ${sale.payment_method.toUpperCase()} (${sale.payment_status})`, 350, 95, { align: 'right' });

  doc.moveTo(50, 130).lineTo(550, 130).strokeColor('#ccc').stroke();

  // ---------- Customer ----------
  doc
    .fontSize(11)
    .fillColor('#1a1a1a')
    .text('Bill To:', 50, 145)
    .fontSize(10)
    .fillColor('#555')
    .text(sale.Customer ? sale.Customer.name : 'Walk-in Customer', 50, 160)
    .text(sale.Customer?.phone || '', 50, 174)
    .text(sale.Customer?.email || '', 50, 188);

  // ---------- Table header ----------
  let y = 220;
  doc.fontSize(10).fillColor('#fff');
  doc.rect(50, y, 500, 22).fill('#2563eb');
  doc
    .fillColor('#fff')
    .text('Item', 58, y + 6)
    .text('Qty', 280, y + 6, { width: 40, align: 'right' })
    .text('Price', 330, y + 6, { width: 70, align: 'right' })
    .text('Tax%', 410, y + 6, { width: 50, align: 'right' })
    .text('Total', 470, y + 6, { width: 70, align: 'right' });

  y += 22;

  // ---------- Table rows ----------
  doc.fillColor('#1a1a1a').fontSize(9);
  const items = sale.SaleItems || [];
  items.forEach((item, idx) => {
    if (idx % 2 === 0) {
      doc.rect(50, y, 500, 20).fill('#f5f7fb');
      doc.fillColor('#1a1a1a');
    }
    doc
      .text(item.product_name, 58, y + 5, { width: 215 })
      .text(String(item.quantity), 280, y + 5, { width: 40, align: 'right' })
      .text(Number(item.unit_price).toFixed(2), 330, y + 5, { width: 70, align: 'right' })
      .text(`${Number(item.tax_rate).toFixed(1)}%`, 410, y + 5, { width: 50, align: 'right' })
      .text(Number(item.line_total).toFixed(2), 470, y + 5, { width: 70, align: 'right' });
    y += 20;
  });

  y += 10;
  doc.moveTo(50, y).lineTo(550, y).strokeColor('#ccc').stroke();
  y += 10;

  // ---------- Totals ----------
  const totalsX = 380;
  doc.fontSize(10).fillColor('#555');
  doc.text('Subtotal:', totalsX, y, { width: 90 }).text(Number(sale.subtotal).toFixed(2), 470, y, { width: 70, align: 'right' });
  y += 16;
  doc.text('Discount:', totalsX, y, { width: 90 }).text(`-${Number(sale.discount_amount).toFixed(2)}`, 470, y, { width: 70, align: 'right' });
  y += 16;
  doc.text('Tax:', totalsX, y, { width: 90 }).text(Number(sale.tax_amount).toFixed(2), 470, y, { width: 70, align: 'right' });
  y += 18;

  doc.fontSize(12).fillColor('#1a1a1a').font('Helvetica-Bold');
  doc.text('TOTAL:', totalsX, y, { width: 90 }).text(Number(sale.total_amount).toFixed(2), 470, y, { width: 70, align: 'right' });
  doc.font('Helvetica');
  y += 22;

  doc.fontSize(9).fillColor('#555');
  doc.text('Amount Paid:', totalsX, y, { width: 90 }).text(Number(sale.amount_paid).toFixed(2), 470, y, { width: 70, align: 'right' });
  y += 14;
  doc.text('Change Due:', totalsX, y, { width: 90 }).text(Number(sale.change_due).toFixed(2), 470, y, { width: 70, align: 'right' });

  // ---------- Footer ----------
  doc
    .fontSize(9)
    .fillColor('#999')
    .text('Thank you for your business!', 50, 750, { align: 'center', width: 500 });

  doc.end();
};

module.exports = { generateInvoicePDF };