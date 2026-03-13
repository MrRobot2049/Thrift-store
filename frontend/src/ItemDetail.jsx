import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavBar from "./NavBar";
import "./itemDetail.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Fetch item details
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/items/${id}`);
        if (!res.ok) throw new Error("Could not load item");
        const data = await res.json();
        setItem(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchItem();
  }, [id]);

  // Fetch auction details and bids
  useEffect(() => {
    const fetchAuctionAndBids = async () => {
      try {
        // Try to fetch auction for this item
        const auctionRes = await fetch(`${API_BASE_URL}/auctions?itemId=${id}`, {
          credentials: "include",
        });
        if (auctionRes.ok) {
          const auctionsData = await auctionRes.json();
          if (Array.isArray(auctionsData) && auctionsData.length > 0) {
            setAuction(auctionsData[0]);
            
            // Fetch bids for this auction
            const bidsRes = await fetch(`${API_BASE_URL}/bids/auction/${auctionsData[0]._id}`, {
              credentials: "include",
            });
            if (bidsRes.ok) {
              const bidsData = await bidsRes.json();
              setBids(Array.isArray(bidsData) ? bidsData : []);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching auction/bids:", err);
      }
    };

    if (id) fetchAuctionAndBids();
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!auction) return;

    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(auction.endTime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Auction ended");
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h left`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m left`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s left`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  const placeBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setError("Please enter a valid bid amount");
      return;
    }

    if (!token) {
      setError("Please login to bid");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const amount = parseFloat(bidAmount);
      
      // Get the asking price (default to auction starting price if item doesn't have it)
      const askingPrice = parseFloat(item.askingPrice || (auction ? auction.startingPrice : "0"));
      
      const minBidAmount = auction
        ? Math.max(askingPrice, auction.currentHighestBid) + 1
        : askingPrice;

      if (amount < minBidAmount) {
        setError(`Minimum bid amount is ₹${minBidAmount}`);
        setLoading(false);
        return;
      }

      // If no auction exists, create one first
      let auctionId = auction?._id;
      if (!auction) {
        const endTime = new Date(
          Date.now() + item.biddingDuration * 60 * 60 * 1000
        );
        const auctionRes = await fetch(`${API_BASE_URL}/auctions`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({
            itemId: id,
            startingPrice: askingPrice,
            endTime: endTime.toISOString(),
          }),
        });

        if (!auctionRes.ok) {
          throw new Error("Failed to create auction");
        }

        const newAuction = await auctionRes.json();
        auctionId = newAuction._id;
        setAuction(newAuction);
      }

      // Place the bid
      const bidRes = await fetch(`${API_BASE_URL}/bids`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          auctionId: auctionId,
          amount: amount,
        }),
      });

      if (!bidRes.ok) {
        const data = await bidRes.json();
        throw new Error(data.message || "Failed to place bid");
      }

      setMessage("Bid placed successfully!");
      setBidAmount("");
      
      // Refresh auction and bids
      const updatedAuctionRes = await fetch(`${API_BASE_URL}/auctions/${auctionId}`, {
        credentials: "include",
      });
      if (updatedAuctionRes.ok) {
        const updatedAuction = await updatedAuctionRes.json();
        setAuction(updatedAuction);
      }

      const updatedBidsRes = await fetch(`${API_BASE_URL}/bids/auction/${auctionId}`, {
        credentials: "include",
      });
      if (updatedBidsRes.ok) {
        const updatedBids = await updatedBidsRes.json();
        setBids(Array.isArray(updatedBids) ? updatedBids : []);
      }
    } catch (err) {
      setError(err.message || "Error placing bid");
    } finally {
      setLoading(false);
    }
  };

  if (error && !item) return <p style={{ color: "red" }}>{error}</p>;
  if (!item) return <p>Loading...</p>;

  // Get all images
  const allImages = (item.images && item.images.length > 0)
    ? item.images
    : item.image
    ? [item.image]
    : [];
  const displayImage = allImages[selectedImage] || allImages[0];

  const isOwnItem = item.seller?._id === currentUser.id;
  const auctionEnded = auction && (new Date(auction.endTime) <= new Date() || !auction.isActive);

  return (
    <div className="item-detail-container">
      <NavBar />

      <div className="item-detail-wrapper">
        {/* Image Section */}
        <div className="image-section">
          {displayImage && (
            <div className="image-gallery-container">
              <div className="main-image-wrapper">
                <img
                  src={displayImage}
                  alt={item.title}
                  className="main-image"
                />
              </div>

              {allImages.length > 1 && (
                <div className="thumbnails-wrapper">
                  {allImages.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className={`thumbnail ${selectedImage === index ? "active" : ""}`}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="details-section">
          <h1 className="item-title">{item.title}</h1>
          <p className="item-category">{item.category}</p>
          <p className="seller-info">Seller: <strong>{item.seller?.name}</strong></p>

          <div className="price-info-box">
            <div className="price-item">
              <span className="label">Asking Price</span>
              <span className="value">₹{item.askingPrice || (auction ? auction.startingPrice : "N/A")}</span>
            </div>
            {auction && (
              <>
                <div className="price-item">
                  <span className="label">Current Highest Bid</span>
                  <span className="value">₹{auction.currentHighestBid || item.askingPrice || auction.startingPrice}</span>
                </div>
                <div className="price-item">
                  <span className="label">Time Remaining</span>
                  <span className="value">{timeLeft}</span>
                </div>
              </>
            )}
          </div>

          <div className="item-description-box">
            <h3>Description</h3>
            <p>{item.description}</p>
          </div>

          {/* Bids History */}
          {auction && (
            <div className="bids-history-section">
              <h3>Bid History</h3>
              {bids.length === 0 ? (
                <p className="no-bids">No bids yet. Be the first to bid!</p>
              ) : (
                <div className="bids-list">
                  {bids.map((bid, index) => (
                    <div key={bid._id} className="bid-item">
                      <span className="bid-number">{bids.length - index}</span>
                      <div className="bid-info">
                        <span className="bid-bidder">
                          {isOwnItem
                            ? bid.bidder?.name || "Anonymous"
                            : `Bidder ${bids.length - index}`}
                        </span>
                        <span className="bid-time">
                          {new Date(bid.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span className="bid-amount">₹{bid.amount}</span>
                    </div>
                  ))}
                </div>
              )}
              {!isOwnItem && (
                <p className="bid-privacy-notice">
                  💡 Bidder names are anonymous to other users. Only the seller
                  sees who bid on this item.
                </p>
              )}
            </div>
          )}

          {/* Bid Form */}
          {!isOwnItem && !auctionEnded && (
            <div className="bid-form-section">
              <h3>Place Your Bid</h3>
              {error && <div className="alert error">{error}</div>}
              {message && <div className="alert success">{message}</div>}
              
              <div className="bid-form">
                <div className="form-group">
                  <label>Bid Amount (₹)</label>
                  <input
                    type="number"
                    placeholder={`Min: ₹${
                      auction
                        ? Math.max(parseFloat(item.askingPrice || (auction ? auction.startingPrice : "0")), auction.currentHighestBid) + 1
                        : parseFloat(item.askingPrice || (auction ? auction.startingPrice : "0"))
                    }`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    disabled={loading}
                    min={
                      auction
                        ? Math.max(parseFloat(item.askingPrice || (auction ? auction.startingPrice : "0")), auction.currentHighestBid) + 1
                        : parseFloat(item.askingPrice || (auction ? auction.startingPrice : "0"))
                    }
                  />
                </div>
                <button
                  onClick={placeBid}
                  disabled={loading}
                  className="bid-button"
                >
                  {loading ? "Placing bid..." : auction ? "Place Bid" : "Start Auction & Bid"}
                </button>
              </div>
            </div>
          )}

          {isOwnItem && (
            <div className="info-box warning">
              ℹ️ This is your own listing. You cannot bid on it.
            </div>
          )}

          {auctionEnded && (
            <div className="info-box ended">
              ❌ This auction has ended.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
