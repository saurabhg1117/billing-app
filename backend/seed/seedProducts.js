require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  { name: 'Classic Sherwani', basePrice: 15000, description: 'Traditional embroidered sherwani for groom' },
  { name: 'Designer Sherwani', basePrice: 25000, description: 'Premium designer sherwani with heavy embroidery' },
  { name: 'Velvet Sherwani', basePrice: 20000, description: 'Royal velvet sherwani with gold threadwork' },
  { name: 'Silk Sherwani', basePrice: 18000, description: 'Pure silk sherwani with zari work' },
  { name: 'Three-Piece Wedding Suit', basePrice: 12000, description: 'Complete 3-piece suit with coat, vest, and trousers' },
  { name: 'Tuxedo Suit', basePrice: 15000, description: 'Black tuxedo suit for reception' },
  { name: 'Jodhpuri Suit', basePrice: 14000, description: 'Traditional Jodhpuri bandhgala suit' },
  { name: 'Double-Breasted Suit', basePrice: 13000, description: 'Elegant double-breasted wedding suit' },
  { name: 'Wedding Blazer', basePrice: 8000, description: 'Premium blazer for wedding functions' },
  { name: 'Velvet Blazer', basePrice: 9500, description: 'Rich velvet blazer for cocktail/sangeet' },
  { name: 'Embroidered Blazer', basePrice: 11000, description: 'Blazer with detailed embroidery work' },
  { name: 'Kurta Pajama Set', basePrice: 5000, description: 'Silk kurta pajama set for mehendi/haldi' },
  { name: 'Pathani Suit', basePrice: 4500, description: 'Traditional pathani suit' },
  { name: 'Dhoti Kurta Set', basePrice: 6000, description: 'South Indian style dhoti with silk kurta' },
  { name: 'Angrakha Kurta', basePrice: 5500, description: 'Rajasthani style angrakha kurta' },
  { name: 'Indo-Western Sherwani', basePrice: 16000, description: 'Fusion Indo-Western sherwani with modern cut' },
  { name: 'Indo-Western Jacket Set', basePrice: 10000, description: 'Asymmetric jacket with kurta and bottom' },
  { name: 'Nehru Jacket Set', basePrice: 7000, description: 'Classic Nehru jacket with kurta pajama' },
  { name: 'Wedding Mojari', basePrice: 2500, description: 'Embroidered mojari/jutti for groom' },
  { name: 'Safa / Turban', basePrice: 1500, description: 'Traditional wedding turban/safa' },
  { name: 'Dupatta / Stole', basePrice: 1200, description: 'Silk dupatta/stole for sherwani' },
  { name: 'Brooch & Kilangi Set', basePrice: 800, description: 'Decorative brooch and turban kilangi' },
  { name: 'Mala / Varmala', basePrice: 500, description: 'Wedding garland set' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Product.deleteMany({});
    console.log('Cleared existing products');

    const inserted = await Product.insertMany(products);
    console.log(`Seeded ${inserted.length} products successfully`);

    await mongoose.connection.close();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

seed();
