import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import "./sellerDashboard.css";
//Checking 
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

export default function SellerDashboard() {
  const [items, setItems] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [bidsMap, setBidsMap] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, [token, navigate]);

  // Fetch seller's items
  useEffect(() => {
    if (!token) return;

    const fetchSellerData = async () => {
      try {
        setLoading(true);

        // Fetch all items sold by current user
        const itemsRes = await fetch(`${API_BASE_URL}/items/mine`, {
          credentials: "include",
          headers: { Authorization: token },
        });

        if (!itemsRes.ok) throw new Error("Failed to fetch items");
        const itemsData = await itemsRes.json();
        setItems(itemsData);

        // For each item, fetch its auction
        const auctionsMap = {};
        const bidsDataMap = {};

        for (const item of itemsData) {
          try {
            // Fetch auction for this item
            const auctionRes = await fetch(
              `${API_BASE_URL}/auctions?itemId=${item._id}`,
              { credentials: "include" }
            );
            if (auctionRes.ok) {
              const auctionsData = await auctionRes.json();
              if (Array.isArray(auctionsData) && auctionsData.length > 0) {
                const auction = auctionsData[0];
                auctionsMap[item._id] = auction;

                // Fetch bids for this auction
                const bidsRes = await fetch(
                  `${API_BASE_URL}/bids/auction/${auction._id}`,
                  { credentials: "include" }
                );
                if (bidsRes.ok) {
                  const bidsData = await bidsRes.json();
                  bidsDataMap[auction._id] = Array.isArray(bidsData)
                    ? bidsData.sort(
                        (a, b) =>
                          new Date(b.createdAt) - new Date(a.createdAt)
                      )
                    : [];
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching auction for item ${item._id}:`, err);
          }
        }

        setAuctions(auctionsMap);
        setBidsMap(bidsDataMap);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [token]);

  if (loading)
    return (
      <div className="seller-dashboard-container">
        <NavBar />
        <p style={{ textAlign: "center", padding: "2rem" }}>Loading...</p>
      </div>
    );

  if (error)
    return (
      <div className="seller-dashboard-container">
        <NavBar />
        <p style={{ color: "red", textAlign: "center", padding: "2rem" }}>
          {error}
        </p>
      </div>
    );

  return (
    <div className="seller-dashboard-container">
      <NavBar />

      <div className="dashboard-header">
        <h1>My Auction Dashboard</h1>
        <p>Track all your auctions and bidders in one place</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-dashboard">
          <p>You haven't listed any items yet.</p>
        </div>
      ) : (
        <div className="auctions-list">
          {items.map((item) => {
            const auction = auctions[item._id];
            const bids = auction ? bidsMap[auction._id] || [] : [];
            const auctionEnded =
              auction &&
              (new Date(auction.endTime) <= new Date() || !auction.isActive);
            const timeRemaining = auction
              ? new Date(auction.endTime) - new Date()
              : 0;

            return (
              <div key={item._id} className="auction-card">
                {/* Item Image */}
                <div className="card-image-section">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="card-image"
                    />
                  )}
                </div>

                {/* Item Info */}
                <div className="card-content">
                  <h2 className="item-title">{item.title}</h2>
                  <p className="item-category">{item.category}</p>
                  <p className="item-description">{item.description}</p>

                  {/* Status Section */}
                  {auction ? (
                    <div className="auction-info-section">
                      <div className="status-badge">
                        {auctionEnded ? (
                          <span className="status-ended">ENDED</span>
                        ) : (
                          <span className="status-active">LIVE</span>
                        )}
                      </div>

                      <div className="bidding-stats">
                        <div className="stat">
                          <span className="label">Asking Price</span>
                          <span className="value">₹{item.askingPrice || (auction ? auction.startingPrice : "N/A")}</span>
                        </div>

                        <div className="stat">
                          <span className="label">Current Bid</span>
                          <span className="value highlight">
                            ₹{auction.currentHighestBid || item.askingPrice || auction.startingPrice || "N/A"}
                          </span>
                        </div>

                        <div className="stat">
                          <span className="label">Total Bids</span>
                          <span className="value">{bids.length}</span>
                        </div>

                        {!auctionEnded && (
                          <div className="stat">
                            <span className="label">Time Left</span>
                            <span className="value">
                              {timeRemaining > 0
                                ? Math.ceil(timeRemaining / (1000 * 60 * 60)) +
                                  "h"
                                : "Ending"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Winner Info */}
                      {auctionEnded && auction.winner && (
                        <div className="winner-section">
                          <h4>🎉 Auction Won!</h4>
                          <p>
                            <strong>{auction.winner?.name}</strong> won with a
                            bid of ₹{auction.soldPrice}
                          </p>
                        </div>
                      )}

                      {/* Bids History */}
                      <div className="bids-section">
                        <h3>Bid History (Visible to Seller Only)</h3>
                        {bids.length === 0 ? (
                          <p className="no-bids">No bids yet</p>
                        ) : (
                          <div className="bids-table">
                            <div className="table-header">
                              <span className="col-rank">#</span>
                              <span className="col-bidder">Bidder Name</span>
                              <span className="col-amount">Amount</span>
                              <span className="col-time">Time</span>
                            </div>
                            {bids.map((bid, index) => (
                              <div key={bid._id} className="table-row">
                                <span className="col-rank">
                                  {bids.length - index}
                                </span>
                                <span className="col-bidder">
                                  {bid.bidder?.name || "Anonymous"}
                                </span>
                                <span className="col-amount">₹{bid.amount}</span>
                                <span className="col-time">
                                  {new Date(bid.createdAt).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="no-auction-section">
                      <p>
                        ℹ️ Waiting for the first bid to start the auction
                      </p>
                      <p className="hint">
                        Duration: {item.biddingDuration} hours
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
