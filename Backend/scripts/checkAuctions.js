const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/product');

async function checkAuctions() {
  try {
    const mongoUri = process.env.ATLASDB_URL || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    // Check all auction products
    const allAuctions = await Product.find({ isAuction: true });
    console.log(`Total auction products: ${allAuctions.length}\n`);

    if (allAuctions.length > 0) {
      console.log('Auction Details:');
      allAuctions.forEach(auction => {
        console.log(`\n- ${auction.title}`);
        console.log(`  Status: ${auction.auctionDetails?.status}`);
        console.log(`  Start: ${auction.auctionDetails?.startTime}`);
        console.log(`  End: ${auction.auctionDetails?.endTime}`);
        console.log(`  Current Bid: ₹${auction.auctionDetails?.currentBid || auction.auctionDetails?.startPrice}`);
      });
    }

    // Check active auctions
    const now = new Date();
    const activeAuctions = await Product.find({
      isAuction: true,
      "auctionDetails.status": "Active",
      "auctionDetails.endTime": { $gt: now }
    });
    console.log(`\n\nActive auctions (should show in buyer dashboard): ${activeAuctions.length}`);

    // Check pending auctions
    const pendingAuctions = await Product.find({
      isAuction: true,
      "auctionDetails.status": "Pending"
    });
    console.log(`Pending auctions: ${pendingAuctions.length}`);

    // Check completed auctions
    const completedAuctions = await Product.find({
      isAuction: true,
      "auctionDetails.status": "Completed"
    });
    console.log(`Completed auctions: ${completedAuctions.length}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAuctions();