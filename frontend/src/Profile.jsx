import React, { useEffect, useState } from "react";
import NavBar from "./NavBar";
import { Link } from "react-router-dom";
import "./profile.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("listed"); // only 'listed' is needed now
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/me`, {
          credentials: "include",
          headers: { Authorization: token },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchProfile();
  }, [token]);

  if (error) return <p style={{ color: "red", padding: "2rem" }}>{error}</p>;
  if (!profile) return <p style={{ padding: "2rem" }}>Loading profile...</p>;

  const itemsListed = profile.itemsListed || [];
  const wonAuctions = profile.wonAuctions || [];
  const bidHistory = profile.bidHistory || [];

  // Helper to extract the primary image from an item
  const getImage = (item) => {
    if (item?.images && item.images.length > 0) return item.images[0];
    if (item?.image) return item.image;
    // Fallback grey placeholder if no image exists
    return "https://via.placeholder.com/400x400/222222/5c452e?text=No+Image"; 
  };

  // Helper to format date strings to: MM/DD-YYYY HH:mm:ss
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";
    
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const hrs = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    
    return `${month}/${day}-${year} ${hrs}:${mins}:${secs}`;
  };

  return (
    <div className="profile-page-wrapper">
      
      {/* Luminous Gallery contrasting header block */}
      <div className="luminous-header-backsplash">
        <NavBar />
        <div className="profile-container header-tight">
          <h1 className="profile-title">My Profile</h1>
        </div>
      </div>
      
      <div className="profile-container overlap-container">
        
        {profile.user && (
          <div className="profile-id-card">
            <div className="profile-avatar">
               <svg viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
               </svg>
            </div>
            <div className="profile-info">
              <div className="info-row">
                 <span className="info-value-name">{profile.user.name}</span>
              </div>
              <div className="info-row">
                 <span className="info-value-email">{profile.user.email}</span>
              </div>
            </div>
          </div>
        )}

        <div className="profile-grid">
          
          {/* LEFT COLUMN: Listed Items */}
          <div className="left-section">
            <div className="tab-content">
              <div className="cards-grid">
                {itemsListed.length === 0 ? <p style={{ color: '#888' }}>No items listed yet.</p> : null}
                {itemsListed.map(it => (
                  <Link
                    to={`/items/${it._id}`}
                    key={it._id}
                    className="item-card"
                  >
                    <div className="card-header">
                      <span className="card-title" title={it.title}>{it.title}</span>
                    </div>
                    <div className="card-image-wrapper">
                      <img src={getImage(it)} alt={it.title} className="card-image" />
                    </div>
                    <span className="badge-available-custom">
                        {String(it.status).toLowerCase() === 'available' ? 'Available' : 'Sold'}
                    </span>
                    <div className="card-footer profile-card-gap">
                      {it.askingPrice && <span className="card-bid">Price <span className="card-bid-val">₹{it.askingPrice}</span></span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Purchases & Bids */}
          <div className="right-section">
            <h3 className="section-heading">My Purchases ({wonAuctions.length})</h3>
            {wonAuctions.length === 0 ? (
              <p style={{ color: '#888', marginBottom: '3rem' }}>No purchases yet.</p>
            ) : (
              <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                {wonAuctions.map(au => (
                  <div key={au._id}>
                    <Link to={`/auctions/${au._id}`} className="won-card">
                      <div className="won-img-wrapper">
                        🏆
                      </div>
                      <div className="won-text-block">
                        <span className="won-title">{au.item?.title || "Item"}</span>
                        <span className="won-desc">Purchase completed</span>
                        <div className="won-numbers">76 87 92 43</div>
                        <div className="won-amount">₹{au.soldPrice}</div>
                      </div>
                    </Link>

                    <div style={{ marginTop: "0.2rem", marginBottom: "1rem", textAlign: "right" }}>
                      <Link
                        to={`/chat/${au._id}`}
                        className="badge-available-custom"
                        style={{ textDecoration: "none", fontSize: "0.7rem", padding: "0.2rem 0.6rem", display: "inline-block" }}
                      >
                        Chat
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 className="section-heading" style={{ marginTop: '3rem' }}>My Bids</h3>
            <div className="bids-container">
              {bidHistory.length === 0 ? (
                <p style={{ color: '#888' }}>No bids placed yet.</p>
              ) : (
                // Reversing the array to show recent bids first if the backend doesn't sort
                bidHistory.slice().reverse().map((bid, i) => (
                  <Link
                    to={`/auctions/${bid.auction?._id}`}
                    key={bid._id || i}
                    className="bid-row"
                  >
                    <div className="bid-info-left">
                      <span className="bid-item-title">{bid.auction?.item?.title || "Unknown Item"}</span>
                      {bid.auction?.item?.category && (
                        <span className="bid-item-category">{bid.auction.item.category.toUpperCase()}</span>
                      )}
                      <span className="bid-date">{formatDate(bid.createdAt)}</span>
                    </div>
                    <div className="bid-info-right">
                      <span className="bid-amount">₹{bid.amount}</span>
                      <span className={`badge ${bid.auction?.isActive ? 'badge-live' : 'badge-ended'}`}>
                        {bid.auction?.isActive ? 'LIVE' : 'ENDED'}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}