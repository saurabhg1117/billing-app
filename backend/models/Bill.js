const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
}, { _id: false });

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    unique: true,
  },
  customer: {
    type: customerSchema,
    required: true,
  },
  items: {
    type: [billItemSchema],
    validate: {
      validator: (arr) => arr.length > 0,
      message: 'At least one item is required',
    },
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['paid', 'unpaid', 'partial'],
    default: 'unpaid',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

billSchema.pre('save', async function (next) {
  if (!this.billNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `BILL-${dateStr}-`;
    const lastBill = await mongoose.model('Bill').findOne({ billNumber: new RegExp(`^${prefix}\\d+$`) })
      .sort({ billNumber: -1 })
      .select('billNumber')
      .lean();
    let seq = 1;
    if (lastBill) {
      const match = lastBill.billNumber.match(/-(\d+)$/);
      if (match) seq = parseInt(match[1], 10) + 1;
    }
    this.billNumber = `${prefix}${String(seq).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);
