import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavBar from "./NavBar";
import { isItemWishlisted, subscribeToWishlist, toggleWishlistItem } from "./wishlistStorage";
import "./itemDetail.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

function TimeRemaining({ endTime }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) { setRemaining("Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(
        h > 0
          ? `${h}h ${m}m left`
          : m > 0
          ? `${m}m ${s}s left`
          : `${s}s left`
      );
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  return <span>{remaining}</span>;
}

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

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
        setIsWishlisted(isItemWishlisted(data._id));
      } catch (err) {
        setError(err.message);
      }
    };
    fetchItem();
  }, [id]);

  useEffect(() => {
    return subscribeToWishlist((wishlistItems) => {
      setIsWishlisted(wishlistItems.some((wishlistItem) => wishlistItem._id === id));
    });
  }, [id]);

  // Fetch auction details and bids
  useEffect(() => {
    const fetchAuctionAndBids = async () => {
      try {
        const auctionRes = await fetch(`${API_BASE_URL}/auctions?itemId=${id}`, {
          credentials: "include",
        });
        if (auctionRes.ok) {
          const auctionsData = await auctionRes.json();
          if (Array.isArray(auctionsData) && auctionsData.length > 0) {
            setAuction(auctionsData[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching auction/bids:", err);
      }
    };

    if (id) fetchAuctionAndBids();
    
    // Auto-refresh auction and bids every 5 seconds
    const interval = setInterval(() => {
        if (id) fetchAuctionAndBids();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [id]);

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
      const askingPrice = parseFloat(item.askingPrice || (auction ? auction.startingPrice : "0"));
      const minBidAmount = auction
        ? Math.max(askingPrice, auction.currentHighestBid) + 1
        : askingPrice;

      if (amount < minBidAmount) {
        setError(`Minimum bid amount is ₹${minBidAmount}`);
        setLoading(false);
        return;
      }

      let auctionId = auction?._id;
      if (!auction) {
        const endTime = new Date(Date.now() + item.biddingDuration * 60 * 60 * 1000);
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

        if (!auctionRes.ok) throw new Error("Failed to create auction");
        const newAuction = await auctionRes.json();
        auctionId = newAuction._id;
        setAuction(newAuction);
      }

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
      
      // Refresh
      const updatedAuctionRes = await fetch(`${API_BASE_URL}/auctions/${auctionId}`, { credentials: "include" });
      if (updatedAuctionRes.ok) setAuction(await updatedAuctionRes.json());


      
    } catch (err) {
      setError(err.message || "Error placing bid");
    } finally {
      setLoading(false);
    }
  };

  if (error && !item) return <p className="item-detail-msg error">{error}</p>;
  if (!item) return <p className="item-detail-msg">Loading...</p>;

  const allImages = (item.images && item.images.length > 0) ? item.images : item.image ? [item.image] : [];
  const displayImage = allImages[selectedImage] || allImages[0];

  const isOwnItem = item.seller?._id === currentUser.id;
  const auctionEnded = auction && (new Date(auction.endTime) <= new Date() || !auction.isActive);
  const handleWishlistToggle = () => {
    const updatedItems = toggleWishlistItem(item);
    setIsWishlisted(updatedItems.some((wishlistItem) => wishlistItem._id === item._id));
  };

  return (
    <div className="item-detail-page">
      <NavBar />
      
      <div className="item-detail-container">
        {/* Ornate Frame around the whole content */}
        <div className="ornate-frame">
          <div className="ornate-frame-inner">
            
            <div className="item-detail-grid">
              
              {/* Image Section */}
              <div className="image-section">
                <div className="wood-picture-frame">
                  {displayImage ? (
                    <img src={displayImage} alt={item.title} className="framed-image" />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  {/* Decorative corners inside the frame */}
                  <div className="frame-corner br-tl"></div>
                  <div className="frame-corner br-tr"></div>
                  <div className="frame-corner br-bl"></div>
                  <div className="frame-corner br-br"></div>
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

              {/* Details Section */}
              <div className="details-section">
                <div className="item-title-row">
                  <h1 className="item-title">{item.title}</h1>
                  <button
                    type="button"
                    className={`detail-wishlist-btn ${isWishlisted ? "active" : ""}`}
                    onClick={handleWishlistToggle}
                  >
                    {isWishlisted ? "♥ Saved" : "♡ Save"}
                  </button>
                </div>
                <p className="item-category">
                  {item.category?.toUpperCase() || "ITEM"}
                </p>
                <p className="seller-info">Seller: <strong>{item.seller?.name || "Unknown"}</strong></p>

                {/* 3-column price strip */}
                <div className="price-strip">
                  <div className="price-strip-col">
                    <div className="price-strip-label">ASKING PRICE</div>
                    <div className="price-strip-value asking">₹{item.askingPrice || (auction ? auction.startingPrice : "N/A")}</div>
                  </div>
                  <div className="price-strip-divider" />
                  <div className="price-strip-col">
                    <div className="price-strip-label">CURRENT HIGHEST BID</div>
                    <div className="price-strip-value highest">
                      {auction && auction.currentHighestBid ? `₹${auction.currentHighestBid}` : "—"}
                    </div>
                  </div>
                  <div className="price-strip-divider" />
                  <div className="price-strip-col">
                    <div className="price-strip-label">TIME REMAINING</div>
                    <div className="price-strip-value time">
                      {auction && !auctionEnded
                        ? <TimeRemaining endTime={auction.endTime} />
                        : auctionEnded ? "Ended" : "—"}
                    </div>
                  </div>
                </div>

                <div className="item-description-box">
                  <p className="description-label">Description</p>
                  <p className="description-text">{item.description}</p>
                </div>

                {/* Bid Form / Status */}
                {!isOwnItem && !auctionEnded && (
                  <div className="bid-form-box">
                    <div className="bid-form-header">Place Your Bid</div>
                    <div className="bid-form-body">
                      <div className="form-group">
                        <label>Bid Amount</label>
                        <input
                          type="number"
                          className="vintage-input"
                          placeholder={`Min: ₹${auction ? Math.max(parseFloat(item.askingPrice || (auction ? auction.startingPrice : "0")), auction.currentHighestBid) + 1 : parseFloat(item.askingPrice || (auction ? auction.startingPrice : "0"))}`}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <button onClick={placeBid} disabled={loading} className="vintage-btn block-btn">
                        {loading ? "Placing bid..." : auction ? "Start Auction & Bid" : "Start Auction & Bid"}
                      </button>
                      {error && <p className="form-msg error">{error}</p>}
                      {message && <p className="form-msg success">{message}</p>}
                    </div>
                  </div>
                )}

                {isOwnItem && (
                  <div className="status-notice warning">
                    This is your own listing. You cannot bid on it.
                  </div>
                )}

                {auctionEnded && (
                  <div className="status-notice ended">
                    This auction has ended.
                  </div>
                )}


              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
