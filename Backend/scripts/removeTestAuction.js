const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/product');

async function removeTestAuction() {
  try {
    const mongoUri = process.env.ATLASDB_URL || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    // Find the test completed auction (iPhone 15 Pro Max)
    const testAuction = await Product.findOne({
      title: 'iPhone 15 Pro Max',
      isAuction: true,
      'auctionDetails.status': 'Completed'
    });

    if (!testAuction) {
      console.log('Test auction not found');
      await mongoose.connection.close();
      return;
    }

    console.log(`Found test auction: ${testAuction.title}`);
    console.log(`Status: ${testAuction.auctionDetails?.status}`);

    // Reset it back to a regular product
    testAuction.isAuction = false;
    testAuction.auctionDetails = undefined;

    await testAuction.save();

    console.log('\n✅ Test auction removed successfully!');
    console.log(`${testAuction.title} is now a regular product again`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removeTestAuction();