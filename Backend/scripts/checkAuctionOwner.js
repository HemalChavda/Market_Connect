const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/product');

async function checkAuctionOwner() {
  try {
    const mongoUri = process.env.ATLASDB_URL || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const auctionId = '692971870320c3d0d24cdeed';
    const auction = await Product.findById(auctionId);

    if (!auction) {
      console.log('Auction not found');
      await mongoose.connection.close();
      return;
    }

    console.log('Auction Details:');
    console.log(`Title: ${auction.title}`);
    console.log(`Seller ID: ${auction.sellerId}`);
    console.log(`Status: ${auction.auctionDetails?.status}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAuctionOwner();