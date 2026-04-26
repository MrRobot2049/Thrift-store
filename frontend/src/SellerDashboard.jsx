import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import "./sellerDashboard.css"; // We will update this
import { API_BASE_URL } from "./apiConfig";

export default function SellerDashboard() {
  const [items, setItems] = useState([]);
  const [auctions, setAuctions] = useState({});
  const [bidsMap, setBidsMap] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;

    const fetchSellerData = async () => {
      try {
        setLoading(true);

        const itemsRes = await fetch(`${API_BASE_URL}/items/mine`, {
          credentials: "include",
          headers: { Authorization: token },
        });

        if (!itemsRes.ok) throw new Error("Failed to fetch items");
        const itemsData = await itemsRes.json();
        setItems(itemsData);

        const auctionsMap = {};
        const bidsDataMap = {};

        for (const item of itemsData) {
          try {
            const auctionRes = await fetch(
              `${API_BASE_URL}/auctions?itemId=${item._id}`,
              { credentials: "include" }
            );
            if (auctionRes.ok) {
              const auctionsData = await auctionRes.json();
              if (Array.isArray(auctionsData) && auctionsData.length > 0) {
                const auction = auctionsData[0];
                auctionsMap[item._id] = auction;

                const bidsRes = await fetch(
                  `${API_BASE_URL}/bids/auction/${auction._id}`,
                  { credentials: "include" }
                );
                if (bidsRes.ok) {
                  const bidsData = await bidsRes.json();
                  bidsDataMap[auction._id] = Array.isArray(bidsData)
                    ? bidsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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
      <div className="sd-page">
        <NavBar />
        <p className="sd-msg">Loading dashboard…</p>
      </div>
    );

  if (error)
    return (
      <div className="sd-page">
        <NavBar />
        <p className="sd-msg error">{error}</p>
      </div>
    );

  return (
    <div className="sd-page">
      <NavBar />
      
      <div className="sd-wrapper">
        <div className="sd-header">
          <h1>My Auctions</h1>
          <p>Track all your listings and incoming bids</p>
        </div>

        {items.length === 0 ? (
          <div className="sd-empty">
            <p>You haven't listed any items yet.</p>
          </div>
        ) : (
          <div className="sd-list">
            {items.map((item) => {
              const auction = auctions[item._id];
              const bids = auction ? bidsMap[auction._id] || [] : [];
              const auctionEnded =
                auction &&
                (new Date(auction.endTime) <= new Date() || !auction.isActive);
              
              const currentBid = auction?.currentHighestBid || item.askingPrice || auction?.startingPrice || 0;
              const askingPrice = item.askingPrice || auction?.startingPrice || 0;
              const totalBids = bids.length;

              const statusLabel = auction 
                ? (auctionEnded ? "⌛ ENDED" : "🔥 ACTIVE")
                : "⏳ WAITING FOR FIRST BID";

              return (
                <div key={item._id} className="sd-card">
                  {/* LEFT: Image */}
                  <div className="sd-image-panel">
                    <div className="sd-image-frame">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="sd-main-image" />
                      ) : (
                        <div className="sd-no-image">No Image</div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Info */}
                  <div className="sd-details-panel">
                    <h2 className="sd-title">{item.title}</h2>
                    <p className="sd-category">{item.category?.toUpperCase() || "ITEM"}</p>
                    <p className="sd-description">{item.description}</p>

                    <div className="sd-divider" />

                    <span className={`sd-status-badge ${auctionEnded ? "ended" : "active"}`}>
                      {statusLabel}
                    </span>

                    <div className="sd-metrics">
                      <div className="sd-metric">
                        <span className="sd-metric-label">ASKING PRICE</span>
                        <span className="sd-metric-value">₹{askingPrice}</span>
                      </div>
                      <div className="sd-metric">
                        <span className="sd-metric-label">CURRENT BID</span>
                        <span className="sd-metric-value gold">₹{currentBid}</span>
                      </div>
                      <div className="sd-metric">
                        <span className="sd-metric-label">TOTAL BIDS</span>
                        <span className="sd-metric-value gold">{totalBids}</span>
                      </div>
                    </div>

                    {auctionEnded && auction?.winner && (
                      <div className="sd-winner-banner">
                        <div className="sd-winner-avatar">
                          {auction.winner?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="sd-winner-info">
                          <span className="sd-winner-name">{auction.winner?.name}</span>
                          <span className="sd-winner-sub">
                            {auction.winner?.name} won with a bid of ₹{auction.soldPrice}
                          </span>
                        </div>
                        <div className="sd-winner-flourish" />
                      </div>
                    )}

                    {auctionEnded && auction?.winner && (
                      <div style={{ marginTop: "1rem" }}>
                        <Link
                          to={`/chat/${auction._id}`}
                          className="sd-status-badge active"
                          style={{ textDecoration: "none", display: "inline-block" }}
                        >
                          Open Winner Chat
                        </Link>
                      </div>
                    )}

                    {bids.length > 0 && (
                      <div className="sd-bid-history">
                        <h3 className="sd-bh-title">
                          Bid History <span className="sd-bh-sub">(Visible to Seller Only)</span>
                        </h3>
                        <table className="sd-bh-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Bidder Name</th>
                              <th>Amount</th>
                              <th>Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bids.map((bid, index) => {
                              const rank = bids.length - index;
                              return (
                                <tr key={bid._id} className={rank % 2 !== 0 ? "odd" : "even"}>
                                  <td>{rank}</td>
                                  <td>{bid.bidder?.name || "Anonymous"}</td>
                                  <td className="sd-bh-amount">₹{bid.amount}</td>
                                  <td>{new Date(bid.createdAt).toLocaleString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {!auction && (
                      <div className="sd-notice">
                        ℹ️ Auction will start when the first bid is placed. (Duration: {item.biddingDuration}h)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
