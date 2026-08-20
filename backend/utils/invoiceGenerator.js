import PDFDocument from 'pdfkit';

export const generateInvoice = (vendor, paymentDetails) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    // Header
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('Wodibenuah Fair 2026', 110, 57)
      .fontSize(10)
      .text('Wodibenuah Fair Ltd.', 200, 65, { align: 'right' })
      .text('Lagos, Nigeria', 200, 80, { align: 'right' })
      .moveDown();

    // Invoice Title
    doc
      .fillColor('#000000')
      .fontSize(20)
      .text('INVOICE', 50, 120);

    // Invoice Details
    doc
      .fontSize(10)
      .text(`Invoice Number: ${paymentDetails.reference}`, 50, 150)
      .text(`Date: ${new Date().toLocaleDateString()}`, 50, 165)
      .text(`Balance Due: NGN 0.00`, 50, 150, { align: 'right' });

    // Vendor Details
    doc
      .text(`Bill To:`, 50, 200)
      .text(vendor.business_name || '', 50, 215)
      .text(vendor.full_name || '', 50, 230)
      .text(vendor.email || '', 50, 245)
      .text(vendor.phone_number || '', 50, 260);

    // Line Items Header
    const invoiceTableTop = 300;

    doc.font('Helvetica-Bold');
    generateTableRow(
      doc,
      invoiceTableTop,
      'Item',
      'Description',
      'Unit Cost',
      'Quantity',
      'Line Total'
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font('Helvetica');

    // Line Item
    const invoiceTableItem = invoiceTableTop + 30;
    generateTableRow(
      doc,
      invoiceTableItem,
      vendor.booth_type || 'Exhibition Booth',
      `Vendor Registration - ${vendor.selected_location || 'Lagos'}`,
      formatCurrency(paymentDetails.amount),
      1,
      formatCurrency(paymentDetails.amount)
    );

    generateHr(doc, invoiceTableItem + 20);

    // Total
    const subtotalPosition = invoiceTableItem + 40;
    generateTableRow(
      doc,
      subtotalPosition,
      '',
      '',
      'Subtotal',
      '',
      formatCurrency(paymentDetails.amount)
    );
    
    const paidToDatePosition = subtotalPosition + 20;
    generateTableRow(
      doc,
      paidToDatePosition,
      '',
      '',
      'Paid To Date',
      '',
      formatCurrency(paymentDetails.amount)
    );

    // Footer
    doc
      .fontSize(10)
      .text(
        'Payment is non-refundable. Thank you for your business.',
        50,
        700,
        { align: 'center', width: 500 }
      );

    doc.end();
  });
};

function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: 'right' })
    .text(quantity, 370, y, { width: 90, align: 'right' })
    .text(lineTotal, 0, y, { align: 'right' });
}

function generateHr(doc, y) {
  doc
    .strokeColor('#aaaaaa')
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return 'NGN ' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
