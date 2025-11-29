import api from "./axios";

// Get all active auctions
export const getActiveAuctions = async () => {
  try {
    const response = await api.get('/auctions');
    return response.data;
  } catch (error) {
    console.error("Error fetching active auctions:", error);
    throw error;
  }
};

// Get upcoming auctions
export const getUpcomingAuctions = async () => {
  try {
    const response = await api.get('/auctions/upcoming');
    return response.data;
  } catch (error) {
    console.error("Error fetching upcoming auctions:", error);
    throw error;
  }
};

// Get recent completed auctions
export const getRecentCompletedAuctions = async () => {
  try {
    const response = await api.get('/auctions/recent/completed');
    return response.data;
  } catch (error) {
    console.error("Error fetching recent completed auctions:", error);
    throw error;
  }
};

// Get auction by ID
export const getAuctionById = async (id) => {
  try {
    const response = await api.get(`/auctions/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching auction:", error);
    throw error;
  }
};

// Place a bid on an auction
export const placeBid = async (auctionId, bidAmount) => {
  try {
    const response = await api.post(`/auctions/${auctionId}/bid`, {
      bidAmount: bidAmount
    });
    return response.data;
  } catch (error) {
    console.error("Error placing bid:", error);
    throw error;
  }
};

// Create auction (admin only)
export const createAuction = async (auctionData) => {
  try {
    const response = await api.post('/auctions', auctionData);
    return response.data;
  } catch (error) {
    console.error("Error creating auction:", error);
    throw error;
  }
};

// Cancel auction (admin only)
export const cancelAuction = async (auctionId) => {
  try {
    const response = await api.delete(`/auctions/${auctionId}`);
    return response.data;
  } catch (error) {
    console.error("Error cancelling auction:", error);
    throw error;
  }
};