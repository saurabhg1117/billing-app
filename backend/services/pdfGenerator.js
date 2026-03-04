const PDFDocument = require('pdfkit');

const SHOP_NAME = process.env.SHOP_NAME || 'Royal Wedding Collection';
const SHOP_ADDRESS = process.env.SHOP_ADDRESS || '';
const SHOP_PHONE = process.env.SHOP_PHONE || '';
const SHOP_EMAIL = process.env.SHOP_EMAIL || '';
const SHOP_GST = process.env.SHOP_GST || '';

const NAVY = '#1B2A4A';
const GOLD = '#C5A55A';
const LIGHT_BG = '#F8F6F0';
const TEXT_DARK = '#2C2C2C';
const TEXT_LIGHT = '#666666';

function generateBillPDF(bill) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  drawHeader(doc);
  drawCustomerInfo(doc, bill);
  drawItemsTable(doc, bill);
  drawTotals(doc, bill);
  drawFooter(doc, bill);

  return doc;
}

function drawHeader(doc) {
  doc.rect(0, 0, doc.page.width, 100).fill(NAVY);

  doc.fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(24)
    .text(SHOP_NAME, 40, 25, { width: 350 });

  doc.fontSize(9)
    .font('Helvetica')
    .text(SHOP_ADDRESS, 40, 58, { width: 350 });

  if (SHOP_PHONE) doc.text(`Phone: ${SHOP_PHONE}`, 40, 72, { width: 350 });

  doc.fillColor(GOLD)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('INVOICE', 400, 25, { width: 170, align: 'right' });

  if (SHOP_GST) {
    doc.fillColor('#FFFFFF')
      .font('Helvetica')
      .fontSize(8)
      .text(`GSTIN: ${SHOP_GST}`, 400, 50, { width: 170, align: 'right' });
  }

  if (SHOP_EMAIL) {
    doc.text(`Email: ${SHOP_EMAIL}`, 400, 63, { width: 170, align: 'right' });
  }

  doc.rect(0, 100, doc.page.width, 3).fill(GOLD);
}

function drawCustomerInfo(doc, bill) {
  const y = 120;
  const customer = bill.customer || {};

  doc.rect(40, y, 250, 80).fill(LIGHT_BG).stroke('#E0E0E0');

  doc.fillColor(NAVY)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('BILL TO:', 50, y + 10);

  doc.fillColor(TEXT_DARK)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(customer.name || 'N/A', 50, y + 26);

  doc.font('Helvetica')
    .fontSize(9)
    .fillColor(TEXT_LIGHT);

  let infoY = y + 42;
  if (customer.phone) { doc.text(`Phone: ${customer.phone}`, 50, infoY); infoY += 13; }
  if (customer.address) { doc.text(customer.address, 50, infoY); }

  doc.rect(320, y, 220, 80).fill(LIGHT_BG).stroke('#E0E0E0');

  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10);
  doc.text('Invoice No:', 330, y + 10);
  doc.text('Date:', 330, y + 28);
  doc.text('Status:', 330, y + 46);

  doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(10);
  doc.text(bill.billNumber, 420, y + 10);
  doc.text(new Date(bill.date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }) + ' IST', 420, y + 28);

  const statusColors = { paid: '#27AE60', unpaid: '#E74C3C', partial: '#F39C12' };
  const statusColor = statusColors[bill.status] || TEXT_DARK;
  doc.fillColor(statusColor)
    .font('Helvetica-Bold')
    .text(bill.status.toUpperCase(), 420, y + 46);
}

function drawItemsTable(doc, bill) {
  const tableTop = 225;
  const colX = { sno: 45, item: 75, desc: 220, qty: 340, price: 400, total: 480 };

  doc.rect(40, tableTop, 515, 22).fill(NAVY);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
  doc.text('#', colX.sno, tableTop + 6);
  doc.text('Item', colX.item, tableTop + 6);
  doc.text('Description', colX.desc, tableTop + 6);
  doc.text('Qty', colX.qty, tableTop + 6, { width: 40, align: 'center' });
  doc.text('Price', colX.price, tableTop + 6, { width: 60, align: 'right' });
  doc.text('Total', colX.total, tableTop + 6, { width: 70, align: 'right' });

  let rowY = tableTop + 28;
  const items = bill.items || [];

  items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.rect(40, rowY - 4, 515, 22).fill(LIGHT_BG);
    }

    doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(9);
    doc.text(String(index + 1), colX.sno, rowY);
    doc.text(item.productName || '', colX.item, rowY, { width: 140 });
    doc.text(item.description || '-', colX.desc, rowY, { width: 110 });
    doc.text(String(item.quantity), colX.qty, rowY, { width: 40, align: 'center' });
    doc.text(formatINR(item.price), colX.price, rowY, { width: 60, align: 'right' });
    doc.text(formatINR(item.total), colX.total, rowY, { width: 70, align: 'right' });

    rowY += 22;
  });

  doc.moveTo(40, rowY + 2).lineTo(555, rowY + 2).strokeColor('#CCCCCC').stroke();

  return rowY + 10;
}

function drawTotals(doc, bill) {
  const items = bill.items || [];
  let y = 225 + 28 + items.length * 22 + 20;
  const labelX = 380;
  const valueX = 480;

  const drawRow = (label, value, bold = false, color = TEXT_DARK) => {
    doc.fillColor(TEXT_LIGHT).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
    doc.text(label, labelX, y, { width: 90, align: 'right' });
    doc.fillColor(color).font(bold ? 'Helvetica-Bold' : 'Helvetica');
    doc.text(formatINR(value), valueX, y, { width: 70, align: 'right' });
    y += 18;
  };

  drawRow('Subtotal:', bill.subtotal);
  if (bill.discount > 0) drawRow('Discount:', bill.discount, false, '#E74C3C');
  if (bill.tax > 0) drawRow('Tax (GST):', bill.tax);

  doc.moveTo(labelX, y).lineTo(555, y).strokeColor(GOLD).lineWidth(1.5).stroke();
  y += 6;

  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13);
  doc.text('TOTAL:', labelX, y, { width: 90, align: 'right' });
  doc.text(formatINR(bill.totalAmount), valueX, y, { width: 70, align: 'right' });
  y += 22;

  if (bill.amountPaid > 0) {
    drawRow('Amount Paid:', bill.amountPaid, false, '#27AE60');
    if (bill.totalAmount - bill.amountPaid > 0) {
      drawRow('Balance Due:', bill.totalAmount - bill.amountPaid, true, '#E74C3C');
    }
  }

  if (bill.notes) {
    y += 10;
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text('Notes:', 40, y);
    y += 14;
    doc.fillColor(TEXT_LIGHT).font('Helvetica').fontSize(9).text(bill.notes, 40, y, { width: 300 });
  }
}

function drawFooter(doc) {
  const footerY = doc.page.height - 60;

  doc.rect(0, footerY, doc.page.width, 60).fill(NAVY);

  doc.fillColor(GOLD)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('Thank you for your business!', 0, footerY + 12, {
      width: doc.page.width,
      align: 'center',
    });

  doc.fillColor('#AAAACC')
    .font('Helvetica')
    .fontSize(7)
    .text(
      'Goods once sold will not be taken back. All disputes subject to local jurisdiction.',
      0, footerY + 28,
      { width: doc.page.width, align: 'center' }
    );
}

function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

module.exports = { generateBillPDF };
