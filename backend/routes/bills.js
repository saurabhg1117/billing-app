const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const { generateBillPDF } = require('../services/pdfGenerator');
const { formatError } = require('../utils/formatError');

router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Bill.countDocuments(filter);

    res.json({
      bills,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalBills = await Bill.countDocuments();
    const paidBills = await Bill.countDocuments({ status: 'paid' });
    const unpaidBills = await Bill.countDocuments({ status: 'unpaid' });
    const partialBills = await Bill.countDocuments({ status: 'partial' });

    const revenueResult = await Bill.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalCollected: { $sum: '$amountPaid' } } },
    ]);

    const revenue = revenueResult[0] || { totalRevenue: 0, totalCollected: 0 };

    res.json({
      totalBills,
      paidBills,
      unpaidBills,
      partialBills,
      totalRevenue: revenue.totalRevenue,
      totalCollected: revenue.totalCollected,
      outstanding: revenue.totalRevenue - revenue.totalCollected,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/pdf', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${bill.billNumber}.pdf`);

    const pdfDoc = generateBillPDF(bill);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('[Create Bill] Received:', { customer: !!req.body?.customer, itemsCount: req.body?.items?.length });
    const { customer, items, discount = 0, tax = 0, amountPaid = 0, notes = '' } = req.body;

    const custName = (customer?.name || '').trim();
    if (!custName) return res.status(400).json({ message: 'Customer name is required' });
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    const billItems = items
      .map((item) => {
        const qty = Math.max(1, Number(item.quantity) || 1);
        const pr = Math.max(0, Number(item.price) || 0);
        return {
          productName: (item.productName || '').trim(),
          description: (item.description || '').trim(),
          quantity: qty,
          price: pr,
          total: qty * pr,
        };
      })
      .filter((item) => item.productName.length > 0);

    if (billItems.length === 0) {
      return res.status(400).json({ message: 'At least one item with a name is required' });
    }

    const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = subtotal - discount + tax;

    let status = 'unpaid';
    if (amountPaid >= totalAmount) status = 'paid';
    else if (amountPaid > 0) status = 'partial';

    const billData = {
      customer: {
        name: custName,
        phone: (customer.phone || '').trim(),
        address: (customer.address || '').trim(),
      },
      items: billItems,
      subtotal,
      discount,
      tax,
      totalAmount,
      amountPaid,
      status,
      notes,
    };

    let saved;
    let retries = 3;
    while (retries--) {
      try {
        const bill = new Bill(billData);
        saved = await bill.save();
        break;
      } catch (err) {
        if (err.code === 11000 && retries > 0) {
          await new Promise((r) => setTimeout(r, 50));
          continue;
        }
        throw err;
      }
    }

    console.log('[Create Bill] Success:', saved.billNumber);
    res.status(201).json(saved);
  } catch (error) {
    console.error('[Create Bill] Error:', error.message);
    const statusCode = error.code === 11000 ? 409 : (error.name === 'ValidationError' ? 400 : 500);
    res.status(statusCode).json({ message: formatError(error) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { customer, items, discount, tax, amountPaid, notes } = req.body;
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    if (customer) {
      if (customer.name) bill.customer.name = customer.name;
      if (customer.phone !== undefined) bill.customer.phone = customer.phone;
      if (customer.address !== undefined) bill.customer.address = customer.address;
    }
    if (items) {
      bill.items = items.map((item) => ({
        productName: item.productName,
        description: item.description || '',
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      }));
      bill.subtotal = bill.items.reduce((sum, item) => sum + item.total, 0);
    }
    if (discount !== undefined) bill.discount = discount;
    if (tax !== undefined) bill.tax = tax;
    if (notes !== undefined) bill.notes = notes;

    bill.totalAmount = bill.subtotal - bill.discount + bill.tax;

    if (amountPaid !== undefined) bill.amountPaid = amountPaid;
    if (bill.amountPaid >= bill.totalAmount) bill.status = 'paid';
    else if (bill.amountPaid > 0) bill.status = 'partial';
    else bill.status = 'unpaid';

    const saved = await bill.save();
    res.json(saved);
  } catch (error) {
    res.status(400).json({ message: formatError(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const bill = await Bill.findByIdAndDelete(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json({ message: 'Bill deleted' });
  } catch (error) {
    res.status(500).json({ message: formatError(error) });
  }
});

module.exports = router;
