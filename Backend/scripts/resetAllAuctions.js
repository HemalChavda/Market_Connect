const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/product');

async function resetAllAuctions() {
  try {
    const mongoUri = process.env.ATLASDB_URL || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MongoDB URI not found in environment variables');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all products that are currently auction products
    const auctionProducts = await Product.find({ isAuction: true });
    console.log(`\nFound ${auctionProducts.length} auction products`);

    if (auctionProducts.length > 0) {
      console.log('\nProducts to reset:');
      auctionProducts.forEach(p => {
        console.log(`- ${p.title} (Status: ${p.auctionDetails?.status || 'Unknown'})`);
      });

      // Update all products to isAuction: false and remove auction details
      const result = await Product.updateMany(
        { isAuction: true },
        {
          $set: { isAuction: false },
          $unset: { auctionDetails: "" }
        }
      );

      console.log(`\n✅ Updated ${result.modifiedCount} products to isAuction: false`);
      console.log('✅ Removed all auction details');
    } else {
      console.log('\n✅ No auction products found - all products are already non-auction');
    }

    // Verify the changes
    const remainingAuctions = await Product.countDocuments({ isAuction: true });
    console.log(`\nVerification: ${remainingAuctions} auction products remaining (should be 0)`);

    // Show summary
    const totalProducts = await Product.countDocuments({});
    const activeProducts = await Product.countDocuments({ isDeleted: false });
    console.log(`\nSummary:`);
    console.log(`- Total products: ${totalProducts}`);
    console.log(`- Active products: ${activeProducts}`);
    console.log(`- Auction products: ${remainingAuctions}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAllAuctions();