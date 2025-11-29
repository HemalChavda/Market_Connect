const cron = require('node-cron');
const Product = require('../models/product');

// Function to activate pending auctions
const activatePendingAuctions = async () => {
  try {
    const now = new Date();
    
    const pendingAuctions = await Product.find({
      isAuction: true,
      'auctionDetails.status': 'Pending',
      'auctionDetails.startTime': { $lte: now }
    });

    if (pendingAuctions.length > 0) {
      console.log(`[Auction Scheduler] Found ${pendingAuctions.length} pending auctions to activate`);
      
      for (const auction of pendingAuctions) {
        auction.auctionDetails.status = 'Active';
        await auction.save();
        console.log(`[Auction Scheduler] Activated auction: ${auction.title}`);
      }
    } else {
      console.log('[Auction Scheduler] Found 0 pending auctions to activate');
    }
  } catch (error) {
    console.error('[Auction Scheduler] Error activating pending auctions:', error);
  }
};

// Function to complete ended auctions
const completeEndedAuctions = async () => {
  try {
    const now = new Date();
    
    const endedAuctions = await Product.find({
      isAuction: true,
      'auctionDetails.status': 'Active',
      'auctionDetails.endTime': { $lte: now }
    }).populate('auctionDetails.highestBidder', 'name email');

    if (endedAuctions.length > 0) {
      console.log(`[Auction Scheduler] Found ${endedAuctions.length} ended auctions to process`);
      
      for (const auction of endedAuctions) {
        auction.auctionDetails.status = 'Completed';
        
        // Set winner information
        if (auction.auctionDetails.highestBidder) {
          auction.auctionDetails.winner = {
            userId: auction.auctionDetails.highestBidder._id,
            name: auction.auctionDetails.highestBidder.name,
            email: auction.auctionDetails.highestBidder.email,
            winningBid: auction.auctionDetails.currentBid
          };
          console.log(`[Auction Scheduler] Auction "${auction.title}" won by ${auction.auctionDetails.highestBidder.name} for ₹${auction.auctionDetails.currentBid}`);
        } else {
          console.log(`[Auction Scheduler] Auction "${auction.title}" ended with no bids`);
        }
        
        await auction.save();
      }
    } else {
      console.log('[Auction Scheduler] Found 0 ended auctions to process');
    }
  } catch (error) {
    console.error('[Auction Scheduler] Error completing ended auctions:', error);
  }
};

// Function to run all scheduled tasks
const runScheduledTasks = async () => {
  console.log('[Auction Scheduler] Running scheduled tasks...');
  await activatePendingAuctions();
  await completeEndedAuctions();
  console.log('[Auction Scheduler] Scheduled tasks completed');
};

// Start the auction scheduler
const startAuctionScheduler = () => {
  console.log('Starting auction scheduler...');
  
  // Run immediately on startup
  runScheduledTasks();
  
  // Schedule to run every minute
  cron.schedule('* * * * *', runScheduledTasks);
  
  console.log('Auction scheduler started - checking every 60 seconds');
};

module.exports = {
  startAuctionScheduler,
  runScheduledTasks,
  activatePendingAuctions,
  completeEndedAuctions
};