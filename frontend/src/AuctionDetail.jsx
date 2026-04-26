import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import "./auctionDetail.css";
import { API_BASE_URL } from "./apiConfig";

export default function AuctionDetail() {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/home");
  };

  const fetchAuction = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auctions/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load auction");
      const data = await res.json();
      setAuction(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchAuction();
    const timer = setInterval(fetchAuction, 5000);
    return () => clearInterval(timer);
  }, [id]);

  const placeBid = async () => {
    if (!bidAmount) return;
    try {
      setError("");
      setMessage("");
      const res = await fetch(`${API_BASE_URL}/bids`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ auctionId: id, amount: parseFloat(bidAmount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Bid failed");
      } else {
        setMessage("Bid placed successfully!");
        setBidAmount("");
        fetchAuction();
      }
    } catch (err) {
      setError("Network error");
    }
  };

  if (error) return <p className="ad-error">{error}</p>;
  if (!auction) return <p className="ad-loading">Loading auction…</p>;

  const now = new Date();
  const ended = new Date(auction.endTime) <= now || !auction.isActive;
  const isSeller = auction.seller?._id === currentUser.id;

  const allImages =
    auction.item?.images && auction.item.images.length > 0
      ? auction.item.images
      : auction.item?.image
      ? [auction.item.image]
      : [];
  const displayImage = allImages[selectedImage] || allImages[0];

  const highestBid = auction.currentHighestBid || auction.startingPrice;
  const totalBids = auction.bids?.length || 0;
  const winner = ended && auction.bids?.length > 0 ? auction.bids[0] : null;

  const statusLabel = ended ? "⌛ ENDED" : "🔥 ACTIVE";
  const statusClass = ended ? "ad-status-badge ended" : "ad-status-badge active";

  return (
    <div className="ad-page">
      <NavBar />

      <div className="ad-wrapper">
        {/* Back button */}
        <button className="ad-back-btn" onClick={goBack}>
          ← Back
        </button>

        <div className="ad-card">
          {/* ── LEFT: Image panel ── */}
          <div className="ad-image-panel">
            <div className="ad-image-frame">
              {displayImage ? (
                <img src={displayImage} alt={auction.item?.title} className="ad-main-image" />
              ) : (
                <div className="ad-no-image">No Image</div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="ad-thumbnails">
                {allImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`thumb-${i}`}
                    className={`ad-thumb ${selectedImage === i ? "active" : ""}`}
                    onClick={() => setSelectedImage(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Details panel ── */}
          <div className="ad-details-panel">
            {/* Title + Category */}
            <h1 className="ad-title">{auction.item?.title}</h1>
            <p className="ad-category">
              {auction.item?.category?.toUpperCase() ||
                auction.item?.subcategory?.toUpperCase() ||
                "ITEM"}
            </p>
            <p className="ad-description">{auction.item?.description}</p>

            <div className="ad-divider" />

            {/* Status badge */}
            <span className={statusClass}>{statusLabel}</span>

            {/* Metrics row */}
            <div className="ad-metrics">
              <div className="ad-metric">
                <span className="ad-metric-label">ASKING PRICE</span>
                <span className="ad-metric-value">₹{auction.startingPrice || auction.askingPrice}</span>
              </div>
              <div className="ad-metric">
                <span className="ad-metric-label">CURRENT BID</span>
                <span className="ad-metric-value gold">₹{highestBid}</span>
              </div>
              <div className="ad-metric">
                <span className="ad-metric-label">TOTAL BIDS</span>
                <span className="ad-metric-value gold">{totalBids}</span>
              </div>
            </div>

            {/* Winner banner */}
            {ended && winner && (
              <div className="ad-winner-banner">
                <div className="ad-winner-avatar">
                  {winner.bidder?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="ad-winner-info">
                  <span className="ad-winner-name">{winner.bidder?.name}</span>
                  <span className="ad-winner-sub">
                    {winner.bidder?.name} won with a bid of ₹{winner.amount}
                  </span>
                </div>
                <div className="ad-winner-flourish" />
              </div>
            )}

            {/* Bid section for active auctions */}
            {!ended && !isSeller && (
              <div className="ad-bid-form">
                <label className="ad-bid-label">Place Your Bid</label>
                <div className="ad-bid-row">
                  <input
                    type="number"
                    className="ad-bid-input"
                    placeholder={`Min ₹${highestBid + 1}`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                  <button className="ad-bid-btn" onClick={placeBid}>
                    Place Bid
                  </button>
                </div>
                {error && <p className="ad-msg error">{error}</p>}
                {message && <p className="ad-msg success">{message}</p>}
              </div>
            )}

            {!ended && isSeller && (
              <div className="ad-own-notice">
                ℹ️ This is your own auction. You cannot bid on it.
              </div>
            )}

            {/* Bid History — visible to seller only */}
            {isSeller && auction.bids && auction.bids.length > 0 && (
              <div className="ad-bid-history">
                <h3 className="ad-bh-title">
                  Bid History <span className="ad-bh-sub">(Visible to Seller Only)</span>
                </h3>
                <table className="ad-bh-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Bidder Name</th>
                      <th>Amount</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auction.bids.map((bid, i) => (
                      <tr key={i} className={i % 2 === 0 ? "even" : "odd"}>
                        <td>{i + 1}</td>
                        <td>{bid.bidder?.name || "Unknown"}</td>
                        <td className="ad-bh-amount">₹{bid.amount}</td>
                        <td>{new Date(bid.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
