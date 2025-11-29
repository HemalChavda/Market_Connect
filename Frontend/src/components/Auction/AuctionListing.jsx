import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import * as auctionAPI from '../../../services/auction';
import './AuctionListing.css';

const AuctionListing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, clearCart } = useCart();
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState([]);
  const [recentCompleted, setRecentCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [selectedUpcoming, setSelectedUpcoming] = useState(null);

  useEffect(() => {
    loadAuctions();
    const interval = setInterval(loadAuctions, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadAuctions = async () => {
    try {
      setLoading(true);
      const [activeResponse, upcomingResponse, completedResponse] = await Promise.all([
        auctionAPI.getActiveAuctions(),
        auctionAPI.getUpcomingAuctions(),
        auctionAPI.getRecentCompletedAuctions()
      ]);

      if (activeResponse.success) {
        setActiveAuctions(activeResponse.data || []);
      }
      if (upcomingResponse.success) {
        setUpcomingAuctions(upcomingResponse.data || []);
      }
      if (completedResponse.success) {
        setRecentCompleted(completedResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading auctions:', error);
      setError('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpcomingClick = (auction) => {
    setSelectedUpcoming(auction);
    setShowUpcomingModal(true);
  };

  const handleProceedToPayment = (auction) => {
    // Clear cart and add auction product
    clearCart();
    
    // Add auction product to cart with winning bid price
    const auctionProduct = {
      _id: auction._id,
      title: auction.title,
      price: auction.auctionDetails?.currentBid || auction.auctionDetails?.startPrice,
      images: auction.images,
      stock: 1,
      isAuction: true,
      auctionId: auction._id
    };
    
    addToCart(auctionProduct, 1);
    
    // Navigate to checkout
    navigate('/checkout');
  };

  const isWinner = (auction) => {
    if (!user || !auction.auctionDetails?.winner) return false;
    return auction.auctionDetails.winner.userId?.toString() === user._id?.toString() ||
           auction.auctionDetails.winner.userId?.toString() === user.id?.toString();
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) {
      return 'Auction Ended';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const CountdownTimer = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState(formatTimeRemaining(endTime));

    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft(formatTimeRemaining(endTime));
      }, 1000);

      return () => clearInterval(timer);
    }, [endTime]);

    return <span className="countdown-timer">{timeLeft}</span>;
  };

  if (loading) {
    return (
      <div className="auction-listing">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading auctions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auction-listing">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadAuctions} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-listing">
      <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-btn">
        ← Back to Dashboard
      </button>
      
      <div className="auction-header">
        <h1>Live Auctions</h1>
        <p>Bid on exclusive items and win amazing deals!</p>
      </div>

      {/* Active Auctions */}
      <section className="auction-section">
        <h2>Active Auctions ({activeAuctions.length})</h2>
        {activeAuctions.length === 0 ? (
          <div className="empty-state">
            <p>No active auctions at the moment.</p>
            <p>Check back later for exciting deals!</p>
          </div>
        ) : (
          <div className="auction-grid">
            {activeAuctions.map((auction) => (
              <div key={auction._id} className="auction-card">
                <div className="auction-image">
                  <img 
                    src={auction.images?.[0]?.url || '/placeholder-image.jpg'} 
                    alt={auction.title}
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                  <div className="auction-status active">LIVE</div>
                </div>
                
                <div className="auction-info">
                  <h3 className="auction-title">{auction.title}</h3>
                  
                  <div className="auction-details">
                    <div className="price-info">
                      <span className="current-bid">
                        Current Bid: ₹{auction.auctionDetails?.currentBid || auction.auctionDetails?.startPrice || 0}
                      </span>
                      <span className="bid-count">
                        {auction.auctionDetails?.bidHistory?.length || 0} bids
                      </span>
                    </div>
                    
                    <div className="time-remaining">
                      <span className="time-label">Time Left:</span>
                      <CountdownTimer endTime={auction.auctionDetails?.endTime} />
                    </div>
                  </div>
                  
                  <Link 
                    to={`/auctions/${auction._id}`} 
                    className="bid-now-btn"
                  >
                    Bid Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Auctions */}
      {upcomingAuctions.length > 0 && (
        <section className="auction-section">
          <h2>Upcoming Auctions ({upcomingAuctions.length})</h2>
          <div className="auction-grid">
            {upcomingAuctions.map((auction) => (
              <div 
                key={auction._id} 
                className="auction-card upcoming-card"
                onClick={() => handleUpcomingClick(auction)}
              >
                <div className="auction-image">
                  <img 
                    src={auction.images?.[0]?.url || '/placeholder-image.jpg'} 
                    alt={auction.title}
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                  <div className="auction-status upcoming">UPCOMING</div>
                </div>
                
                <div className="auction-info">
                  <h3 className="auction-title">{auction.title}</h3>
                  
                  <div className="auction-details">
                    <div className="price-info">
                      <span className="starting-price">
                        Starting Price: ₹{auction.auctionDetails?.startPrice || 0}
                      </span>
                    </div>
                    
                    <div className="start-time">
                      <span className="time-label">Starts On:</span>
                      <span className="start-date">
                        {new Date(auction.auctionDetails?.startTime).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <button className="view-btn">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Completed Auctions */}
      {recentCompleted.length > 0 && (
        <section className="auction-section">
          <h2>Recently Completed</h2>
          <div className="completed-auctions">
            {recentCompleted.map((auction) => (
              <div key={auction._id} className="completed-auction-card">
                <div className="auction-image-small">
                  <img 
                    src={auction.images?.[0]?.url || '/placeholder-image.jpg'} 
                    alt={auction.title}
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
                
                <div className="auction-info-small">
                  <h4>{auction.title}</h4>
                  <div className="final-details">
                    {auction.auctionDetails?.winner ? (
                      <>
                        <span className="winning-bid">
                          Final Price: ₹{auction.auctionDetails.currentBid}
                        </span>
                        {!isWinner(auction) && (
                          <span className="winner">
                            Winner: {auction.auctionDetails.winner.name || 'Anonymous'}
                          </span>
                        )}
                        {isWinner(auction) && (
                          <button 
                            className="payment-btn"
                            onClick={() => handleProceedToPayment(auction)}
                          >
                            Proceed to Payment
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="no-bids">
                        No bids were placed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Auction Modal */}
      {showUpcomingModal && selectedUpcoming && (
        <div className="modal-overlay" onClick={() => setShowUpcomingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upcoming Auction</h3>
              <button className="modal-close" onClick={() => setShowUpcomingModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-message">
                This auction hasn't started yet.
              </p>
              <p className="modal-start-time">
                It will begin on <strong>{new Date(selectedUpcoming.auctionDetails?.startTime).toLocaleString()}</strong>
              </p>
              <div className="modal-auction-info">
                <h4>{selectedUpcoming.title}</h4>
                <p>Starting Price: ₹{selectedUpcoming.auctionDetails?.startPrice}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowUpcomingModal(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionListing;