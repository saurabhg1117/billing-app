/**
 * Sync DB with code - checks bills for schema mismatch and migrates if needed.
 * Run: node scripts/syncDb.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-billing';

function isObjectId(val) {
  if (!val || typeof val !== 'object') return false;
  return val instanceof mongoose.Types.ObjectId ||
    val._bsontype === 'ObjectID' ||
    (val.constructor && val.constructor.name === 'ObjectID');
}

function hasOldSchema(doc) {
  const customer = doc.customer;
  const items = doc.items;
  if (!customer || !items || !Array.isArray(items)) return false;

  // Old: customer is ObjectId ref
  if (isObjectId(customer)) return true;
  // Old: customer exists but has no name (might be populated ref with different structure)
  if (typeof customer === 'object' && !customer.name && customer._id) return true;
  // Old: items have product ref instead of productName
  const hasProductRef = items.some((i) => i.product && !i.productName);
  return hasProductRef;
}

async function migrateBill(rawDoc, CustomerModel, ProductModel) {
  const customer = rawDoc.customer;
  const items = rawDoc.items || [];
  let newCustomer = { name: '', phone: '', address: '' };
  const newItems = [];

  if (isObjectId(customer)) {
    const cust = await CustomerModel.findById(customer).lean();
    if (cust) {
      newCustomer = {
        name: cust.name || '',
        phone: cust.phone || '',
        address: cust.address || '',
      };
    }
  } else if (customer && typeof customer === 'object' && customer.name) {
    newCustomer = {
      name: String(customer.name || ''),
      phone: String(customer.phone || ''),
      address: String(customer.address || ''),
    };
  }

  for (const item of items) {
    let productName = item.productName;
    let price = item.price;
    let quantity = item.quantity || 1;
    let description = item.description || '';

    if (item.product && isObjectId(item.product)) {
      const prod = await ProductModel.findById(item.product).lean();
      if (prod) {
        productName = prod.name || 'Unknown';
        if (price == null || price === undefined) price = prod.basePrice || 0;
      }
    }
    if (!productName) productName = 'Unknown';
    if (price == null || price === undefined) price = 0;
    if (quantity == null || quantity < 1) quantity = 1;

    newItems.push({
      productName: String(productName),
      description: String(description),
      quantity: Number(quantity),
      price: Number(price),
      total: Number(quantity) * Number(price),
    });
  }

  if (newItems.length === 0) return null;

  const subtotal = newItems.reduce((s, i) => s + i.total, 0);
  const discount = Number(rawDoc.discount) || 0;
  const tax = Number(rawDoc.tax) || 0;
  const totalAmount = subtotal - discount + tax;
  const amountPaid = Number(rawDoc.amountPaid) || 0;
  let status = rawDoc.status || 'unpaid';
  if (amountPaid >= totalAmount) status = 'paid';
  else if (amountPaid > 0) status = 'partial';

  return {
    _id: rawDoc._id,
    billNumber: rawDoc.billNumber,
    customer: newCustomer,
    items: newItems,
    subtotal,
    discount,
    tax,
    totalAmount,
    amountPaid,
    status,
    notes: String(rawDoc.notes || ''),
    date: rawDoc.date || new Date(),
    createdAt: rawDoc.createdAt,
    updatedAt: new Date(),
  };
}

async function sync() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const billsColl = db.collection('bills');
    const rawBills = await billsColl.find({}).toArray();

    console.log(`Found ${rawBills.length} bills`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of rawBills) {
      if (!hasOldSchema(doc)) {
        skipped++;
        continue;
      }

      try {
        const migratedDoc = await migrateBill(doc, Customer, Product);
        if (!migratedDoc) {
          console.warn(`  Skip bill ${doc._id}: no valid items`);
          failed++;
          continue;
        }

        await billsColl.replaceOne({ _id: doc._id }, migratedDoc);
        migrated++;
        console.log(`  Migrated: ${doc.billNumber || doc._id}`);
      } catch (err) {
        console.error(`  Failed ${doc._id}:`, err.message);
        failed++;
      }
    }

    console.log('\nSync complete:');
    console.log(`  Migrated: ${migrated}`);
    console.log(`  Already in sync: ${skipped}`);
    console.log(`  Failed: ${failed}`);

    // Ensure Mongoose indexes are in sync
    await Bill.syncIndexes();
    console.log('  Indexes synced.');

    await mongoose.connection.close();
    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Sync error:', error.message);
    process.exit(1);
  }
}

sync();
