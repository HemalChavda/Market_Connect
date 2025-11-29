const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/product');

async function verifyProducts() {
  try {
    const mongoUri = process.env.ATLASDB_URL || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const totalProducts = await Product.countDocuments({});
    const activeProducts = await Product.countDocuments({ isDeleted: false });
    const auctionProducts = await Product.countDocuments({ isAuction: true });
    const availableProducts = await Product.countDocuments({ 
      isDeleted: false, 
      isAuction: false,
      stock: { $gt: 0 }
    });

    console.log('Product Summary:');
    console.log(`- Total products: ${totalProducts}`);
    console.log(`- Active (non-deleted): ${activeProducts}`);
    console.log(`- Auction products: ${auctionProducts}`);
    console.log(`- Available for purchase: ${availableProducts}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyProducts();